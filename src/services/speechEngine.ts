import type { LanguageCode } from '@/types/neurocare'

export interface VoiceResolution {
  voice: SpeechSynthesisVoice | null
  mode: 'native' | 'phonetic-bridge'
  voiceLabel: string
  targetLocale: string
}

export interface SpeakOptions {
  text: string
  lang: LanguageCode
  rate?: number
  englishFallbackAlso?: boolean
  englishSummaryText?: string
  onStart?: (resolution: VoiceResolution) => void
  onEnd?: () => void
  onError?: (reason: string) => void
}

const LOCALE_MAP: Record<LanguageCode, string> = {
  en: 'en-IN',
  kn: 'kn-IN',
  hi: 'hi-IN',
  ar: 'ar-SA',
  ta: 'ta-IN',
}

// Keep strong references to prevent Chromium garbage-collecting active utterances mid-speech
const activeUtterances = new Set<SpeechSynthesisUtterance>()
// Voices whose cloud/OS sockets hang or fail to start are quarantined for the session
const brokenVoiceURIs = new Set<string>()
let playbackSessionId = 0
let keepAliveInterval: ReturnType<typeof setInterval> | null = null
let cancelDelayTimer: ReturnType<typeof setTimeout> | null = null
let startWatchdogTimer: ReturnType<typeof setTimeout> | null = null
let endWatchdogTimer: ReturnType<typeof setTimeout> | null = null
let sharedAudioCtx: AudioContext | null = null

export function stripMarkdownForSpeech(text: string): string {
  return text
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/[#_`]/g, '')
    .replace(/•/g, ', ')
    .replace(/→/g, ' to ')
    .replace(/–|—/g, ', ')
    .replace(/\(([^)]*)\)/g, ' $1 ')
    .replace(/(^|\n|\s)(\d+)\.\s+/g, '$1$2, ')
    .replace(/\s*\n+\s*/g, '. ')
    .replace(/:\s*\./g, '.')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

export function getCachedVoices(): SpeechSynthesisVoice[] {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return []
  return window.speechSynthesis.getVoices() ?? []
}

export function subscribeVoicesChanged(cb: () => void): () => void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return () => {}
  }
  const synth = window.speechSynthesis
  synth.addEventListener?.('voiceschanged', cb)
  return () => {
    synth.removeEventListener?.('voiceschanged', cb)
  }
}

export function resolveVoiceForLanguage(lang: LanguageCode): VoiceResolution {
  const allVoices = getCachedVoices()
  const healthyVoices = allVoices.filter((v) => !brokenVoiceURIs.has(v.voiceURI))
  const voices = healthyVoices.length > 0 ? healthyVoices : allVoices
  const targetLocale = LOCALE_MAP[lang]

  const rankVoice = (v: SpeechSynthesisVoice) => {
    const n = v.name.toLowerCase()
    let score = 0
    // Strongly prefer reliable local OS voices (zero cloud-socket stalls on Windows Edge/Chrome)
    if (v.localService) score += 50
    if (
      n.includes('zira') ||
      n.includes('david') ||
      n.includes('aria') ||
      n.includes('jenny') ||
      n.includes('ravi') ||
      n.includes('heera') ||
      n.includes('kalpana') ||
      n.includes('hemant') ||
      n.includes('valluvar') ||
      n.includes('naayf')
    ) {
      score += 20
    }
    if (n.includes('natural')) score += 12
    if (n.includes('google')) score += 10
    if (n.includes('online')) score += 4
    return score
  }

  const exactPrefixMatches = voices
    .filter((v) => v.lang.toLowerCase().startsWith(lang))
    .sort((a, b) => rankVoice(b) - rankVoice(a))

  if (exactPrefixMatches.length > 0) {
    // For English, prefer en-IN then en-US / en-GB
    if (lang === 'en') {
      const preferredEn =
        exactPrefixMatches.find((v) => v.lang.toLowerCase().startsWith('en-in')) ??
        exactPrefixMatches.find((v) => v.lang.toLowerCase().startsWith('en-us')) ??
        exactPrefixMatches[0]
      return {
        voice: preferredEn,
        mode: 'native',
        voiceLabel: `${preferredEn.name} (${preferredEn.lang})`,
        targetLocale: preferredEn.lang,
      }
    }

    const bestNative = exactPrefixMatches[0]
    return {
      voice: bestNative,
      mode: 'native',
      voiceLabel: `${bestNative.name} (${bestNative.lang})`,
      targetLocale: bestNative.lang,
    }
  }

  // Fallback for Windows/Chromium when kn/hi/ar/ta SAPI voice packs aren't installed:
  // Use the clearest English SAPI voice paired with our phonetic transliterator so output is NEVER silent.
  const englishFallback =
    voices
      .filter((v) => v.lang.toLowerCase().startsWith('en'))
      .sort((a, b) => rankVoice(b) - rankVoice(a))[0] ??
    voices[0] ??
    null

  return {
    voice: englishFallback,
    mode: lang === 'en' ? 'native' : 'phonetic-bridge',
    voiceLabel: englishFallback
      ? `${englishFallback.name} (${englishFallback.lang})`
      : 'System Default Audio',
    targetLocale,
  }
}

/* ============================================================================
 * ACCURATE PHONETIC TRANSLITERATION FOR NON-LATIN SCRIPTS (KN / HI / TA / AR)
 * Ensures audible, recognizable speech via standard en-US/en-GB TTS engines
 * whenever native OS language packs are absent.
 * ==========================================================================*/

// Kannada (U+0C80..U+0CFF)
const KN_VOWELS: Record<string, string> = {
  '\u0C85': 'a', '\u0C86': 'aa', '\u0C87': 'i', '\u0C88': 'ee',
  '\u0C89': 'u', '\u0C8A': 'oo', '\u0C8B': 'ru', '\u0C8E': 'e',
  '\u0C8F': 'ey', '\u0C90': 'ai', '\u0C92': 'o', '\u0C93': 'oh', '\u0C94': 'au',
}
const KN_CONSONANTS: Record<string, string> = {
  '\u0C95': 'k', '\u0C96': 'kh', '\u0C97': 'g', '\u0C98': 'gh', '\u0C99': 'ng',
  '\u0C9A': 'ch', '\u0C9B': 'chh', '\u0C9C': 'j', '\u0C9D': 'jh', '\u0C9E': 'ny',
  '\u0C9F': 't', '\u0CA0': 'th', '\u0CA1': 'd', '\u0CA2': 'dh', '\u0CA3': 'n',
  '\u0CA4': 't', '\u0CA5': 'th', '\u0CA6': 'd', '\u0CA7': 'dh', '\u0CA8': 'n',
  '\u0CAA': 'p', '\u0CAB': 'ph', '\u0CAC': 'b', '\u0CAD': 'bh', '\u0CAE': 'm',
  '\u0CAF': 'y', '\u0CB0': 'r', '\u0CB1': 'r', '\u0CB2': 'l', '\u0CB3': 'l',
  '\u0CB5': 'v', '\u0CB6': 'sh', '\u0CB7': 'sh', '\u0CB8': 's', '\u0CB9': 'h',
  '\u0CDE': 'f',
}
const KN_MATRAS: Record<string, string> = {
  '\u0CBE': 'aa', '\u0CBF': 'i', '\u0CC0': 'ee', '\u0CC1': 'u', '\u0CC2': 'oo',
  '\u0CC3': 'ru', '\u0CC6': 'e', '\u0CC7': 'ey', '\u0CC8': 'ai', '\u0CCA': 'o',
  '\u0CCB': 'oh', '\u0CCC': 'au', '\u0CCD': '',
}
const KN_MODS: Record<string, string> = {
  '\u0C82': 'm', '\u0C83': 'ha',
}

// Hindi / Devanagari (U+0900..U+097F)
const HI_VOWELS: Record<string, string> = {
  '\u0905': 'a', '\u0906': 'aa', '\u0907': 'i', '\u0908': 'ee',
  '\u0909': 'u', '\u090A': 'oo', '\u090B': 'ri', '\u090F': 'ey',
  '\u0910': 'ai', '\u0913': 'oh', '\u0914': 'au', '\u0911': 'au',
}
const HI_CONSONANTS: Record<string, string> = {
  '\u0915': 'k', '\u0916': 'kh', '\u0917': 'g', '\u0918': 'gh', '\u0919': 'ng',
  '\u091A': 'ch', '\u091B': 'chh', '\u091C': 'j', '\u091D': 'jh', '\u091E': 'ny',
  '\u091F': 't', '\u0920': 'th', '\u0921': 'd', '\u0922': 'dh', '\u0923': 'n',
  '\u0924': 't', '\u0925': 'th', '\u0926': 'd', '\u0927': 'dh', '\u0928': 'n',
  '\u092A': 'p', '\u092B': 'f', '\u092C': 'b', '\u092D': 'bh', '\u092E': 'm',
  '\u092F': 'y', '\u0930': 'r', '\u0931': 'r', '\u0932': 'l', '\u0933': 'l',
  '\u0935': 'v', '\u0936': 'sh', '\u0937': 'sh', '\u0938': 's', '\u0939': 'h',
  '\u0958': 'q', '\u0959': 'kh', '\u095A': 'gh', '\u095B': 'z', '\u095C': 'd', '\u095D': 'dh', '\u095E': 'f',
}
const HI_MATRAS: Record<string, string> = {
  '\u093E': 'aa', '\u093F': 'i', '\u0940': 'ee', '\u0941': 'u', '\u0942': 'oo',
  '\u0943': 'ri', '\u0947': 'ey', '\u0948': 'ai', '\u094B': 'oh', '\u094C': 'au',
  '\u094D': '', '\u0949': 'au', '\u0945': 'ae',
}
const HI_MODS: Record<string, string> = {
  '\u0902': 'n', '\u0901': 'n', '\u0903': 'ha', '\u0964': '. ',
}

// Tamil (U+0B80..U+0BFF)
const TA_VOWELS: Record<string, string> = {
  '\u0B85': 'a', '\u0B86': 'aa', '\u0B87': 'i', '\u0B88': 'ee',
  '\u0B89': 'u', '\u0B8A': 'oo', '\u0B8E': 'e', '\u0B8F': 'ey',
  '\u0B90': 'ai', '\u0B92': 'o', '\u0B93': 'oh', '\u0B94': 'au',
}
const TA_CONSONANTS: Record<string, string> = {
  '\u0B95': 'k', '\u0B99': 'ng', '\u0B9A': 'ch', '\u0B9C': 'j', '\u0B9E': 'ny',
  '\u0B9F': 't', '\u0BA3': 'n', '\u0BA4': 'th', '\u0BA8': 'n', '\u0BA9': 'n',
  '\u0BAA': 'p', '\u0BAE': 'm', '\u0BAF': 'y', '\u0BB0': 'r', '\u0BB1': 'r',
  '\u0BB2': 'l', '\u0BB3': 'l', '\u0BB4': 'zh', '\u0BB5': 'v', '\u0BB6': 'sh',
  '\u0BB7': 'sh', '\u0BB8': 's', '\u0BB9': 'h',
}
const TA_MATRAS: Record<string, string> = {
  '\u0BBE': 'aa', '\u0BBF': 'i', '\u0BC0': 'ee', '\u0BC1': 'u', '\u0BC2': 'oo',
  '\u0BC6': 'e', '\u0BC7': 'ey', '\u0BC8': 'ai', '\u0BCA': 'o', '\u0BCB': 'oh',
  '\u0BCC': 'au', '\u0BCD': '',
}
const TA_MODS: Record<string, string> = {
  '\u0B82': 'm', '\u0B83': 'ak',
}

function transliterateIndicSegment(
  text: string,
  vowels: Record<string, string>,
  consonants: Record<string, string>,
  matras: Record<string, string>,
  mods: Record<string, string>
): string {
  const chars = Array.from(text)
  let out = ''
  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i]
    if (ch === '\u093C' || ch === '\u0CBC') continue // nukta marker
    if (vowels[ch] !== undefined) {
      out += vowels[ch]
      continue
    }
    if (consonants[ch] !== undefined) {
      const next = chars[i + 1]
      if (next && matras[next] !== undefined) {
        out += consonants[ch] + matras[next]
        i++
      } else {
        out += consonants[ch] + 'a'
      }
      continue
    }
    if (mods[ch] !== undefined) {
      out += mods[ch]
      continue
    }
    if (matras[ch] !== undefined) {
      out += matras[ch]
      continue
    }
    out += ch
  }
  // Smooth schwa endings and awkward clusters for natural English SAPI reading
  return out
    .replace(/aa+/g, 'aa')
    .replace(/\b([a-z]+)a\b/g, (m, stem) => (stem.length >= 3 ? `${stem}a` : m))
}

const ARABIC_WORD_GLOSSARY: Record<string, string> = {
  'مرحبا': 'marhaban',
  'مرحباً': 'marhaban',
  'أهلا': 'ahlan',
  'أهلاً': 'ahlan',
  'أنا': 'ana',
  'المساعد': 'al-musaayed',
  'الذكي': 'adh-dhakee',
  'الذاكرة': 'adh-dhaakira',
  'ذاكرتي': 'dhaakiratee',
  'ذاكرة': 'dhaakira',
  'النوم': 'an-nawm',
  'نومك': 'nawmak',
  'نوم': 'nawm',
  'العميق': 'al-ameeq',
  'الدماغ': 'ad-dimaagh',
  'صحة': 'sihhat',
  'تركيزي': 'tarkeezee',
  'التركيز': 'at-tarkeez',
  'الانتباه': 'al-intibaah',
  'المشي': 'al-mashee',
  'السريع': 'as-saree',
  'التمارين': 'at-tamaareen',
  'تمارين': 'tamaareen',
  'البدنية': 'al-badaniyya',
  'اليوغا': 'al-yoga',
  'التمدد': 'at-tamaddud',
  'التنفس': 'at-tanaffus',
  'التوتر': 'at-tawattur',
  'اليومي': 'al-yawmee',
  'يومياً': 'yawmiyyan',
  'دقيقة': 'daqeeqa',
  'ساعة': 'saa-ah',
  'خطوة': 'khatwa',
  'الماء': 'al-maa',
  'التغذية': 'at-taghdhiya',
  'الصحية': 'as-sihhiyya',
  'الجوز': 'al-jawz',
  'اللوز': 'al-lawz',
  'الطبيب': 'at-tabeeb',
  'الأعصاب': 'al-aasaab',
  'تقرير': 'taqreer',
  'متوسط': 'mutawassit',
  'أيام': 'ayyaam',
  'أفضل': 'afdal',
  'طرق': 'turuq',
  'طبيعية': 'tabee-iyya',
  'لدعم': 'li-daam',
  'كيف': 'kayfa',
  'يمكنني': 'yumkinunee',
  'تحسين': 'tahseen',
  'زيادة': 'ziyaada',
  'العلاقة': 'al-alaaqa',
  'بين': 'bayna',
  'وصحة': 'wa sihhat',
  'ملخص': 'mulakkhas',
  'تقدمك': 'taqaddumak',
  'تقدمي': 'taqaddumee',
  'ألعاب': 'al-aab',
  'الفيتامينات': 'al-feetaameenaat',
  'ضغط': 'daght',
  'الدم': 'ad-dam',
  'الأرق': 'al-araq',
  'الراحة': 'ar-raaha',
  'الهدوء': 'al-hudoo',
  'لا': 'laa',
  'من': 'min',
  'في': 'fee',
  'على': 'alaa',
  'مع': 'maa',
  'إلى': 'ilaa',
  'و': 'wa',
}

const ARABIC_CHAR_MAP: Record<string, string> = {
  '\u0627': 'a', '\u0623': 'a', '\u0625': 'i', '\u0622': 'aa', '\u0671': 'a',
  '\u0628': 'b', '\u062A': 't', '\u062B': 'th', '\u062C': 'j', '\u062D': 'h',
  '\u062E': 'kh', '\u062F': 'd', '\u0630': 'dh', '\u0631': 'r', '\u0632': 'z',
  '\u0633': 's', '\u0634': 'sh', '\u0635': 's', '\u0636': 'd', '\u0637': 't',
  '\u0638': 'z', '\u0639': 'a', '\u063A': 'gh', '\u0641': 'f', '\u0642': 'q',
  '\u0643': 'k', '\u0644': 'l', '\u0645': 'm', '\u0646': 'n', '\u0647': 'h',
  '\u0648': 'w', '\u064A': 'y', '\u0649': 'a', '\u0629': 'a', '\u0621': '',
  '\u0624': 'w', '\u0626': 'y',
  // Diacritics
  '\u064E': 'a', '\u064F': 'u', '\u0650': 'i', '\u0651': '', '\u0652': '',
  '\u064B': 'an', '\u064C': 'un', '\u064D': 'in', '\u0640': '',
  '\u060C': ', ', '\u061F': '? ', '\u061B': '; ',
}

function transliterateArabicText(text: string): string {
  const tokens = text.split(/(\s+)/)
  return tokens
    .map((tok) => {
      if (!/[\u0600-\u06FF]/.test(tok)) return tok
      const exact = ARABIC_WORD_GLOSSARY[tok]
      if (exact) return exact
      // Strip trailing punctuation for lookup
      const m = tok.match(/^([\u0600-\u06FF]+)([^\u0600-\u06FF]*)$/)
      if (m && ARABIC_WORD_GLOSSARY[m[1]]) {
        return ARABIC_WORD_GLOSSARY[m[1]] + m[2]
      }
      // Transliterate letters inserting light short vowels between long consonant runs
      let res = ''
      const chars = Array.from(tok)
      for (let i = 0; i < chars.length; i++) {
        const mapped = ARABIC_CHAR_MAP[chars[i]] ?? chars[i]
        res += mapped
      }
      // Replace definite article prefix 'al' cleanly
      res = res.replace(/^al([bcdfghjklmnpqrstvwxyz]{2,})/i, 'al-$1')
      // Break 3+ consonants without vowels using 'a' so English SAPI reads syllables instead of spelling letters
      res = res.replace(/([bcdfghjklmnpqrstvwxyz])([bcdfghjklmnpqrstvwxyz])([bcdfghjklmnpqrstvwxyz])/gi, '$1a$2$3')
      res = res.replace(/([bcdfghjklmnpqrstvwxyz])([bcdfghjklmnpqrstvwxyz])/gi, (pair, c1, c2) => {
        if (['sh', 'kh', 'th', 'dh', 'gh'].includes(pair.toLowerCase())) return pair
        return `${c1}a${c2}`
      })
      return res
    })
    .join('')
}

export function buildSpeakableText(text: string, lang: LanguageCode, resolution: VoiceResolution): string {
  const clean = stripMarkdownForSpeech(text)
  if (!clean) return ''

  // If the browser actually has a native non-English voice, speak the native Unicode script directly!
  if (resolution.mode === 'native' || lang === 'en') {
    return clean
  }

  // Phonetic bridge for en-US/en-GB SAPI voices when native language voice packs aren't installed:
  if (lang === 'kn' || /[\u0C80-\u0CFF]/.test(clean)) {
    return transliterateIndicSegment(clean, KN_VOWELS, KN_CONSONANTS, KN_MATRAS, KN_MODS)
  }
  if (lang === 'hi' || /[\u0900-\u097F]/.test(clean)) {
    return transliterateIndicSegment(clean, HI_VOWELS, HI_CONSONANTS, HI_MATRAS, HI_MODS)
  }
  if (lang === 'ta' || /[\u0B80-\u0BFF]/.test(clean)) {
    return transliterateIndicSegment(clean, TA_VOWELS, TA_CONSONANTS, TA_MATRAS, TA_MODS)
      .replace(/rr/g, 'ttr')
      .replace(/nr/g, 'ndr')
  }
  if (lang === 'ar' || /[\u0600-\u06FF]/.test(clean)) {
    return transliterateArabicText(clean)
  }
  return clean
}

function splitIntoSpeechChunks(text: string, maxLen = 140): string[] {
  const rawSentences = text
    .split(/(?<=[.!?।])\s+|\s*;\s*/)
    .map((s) => s.trim())
    .filter(Boolean)

  const chunks: string[] = []
  for (const sent of rawSentences) {
    if (sent.length <= maxLen) {
      chunks.push(sent)
      continue
    }
    const words = sent.split(/\s+/)
    let current = ''
    for (const w of words) {
      if (!current) {
        current = w
      } else if (current.length + 1 + w.length <= maxLen) {
        current += ' ' + w
      } else {
        chunks.push(current)
        current = w
      }
    }
    if (current) chunks.push(current)
  }
  return chunks.length > 0 ? chunks : [text]
}

export function playSoftFeedbackChime(kind: 'mic-start' | 'reply-ready' = 'reply-ready'): void {
  if (typeof window === 'undefined') return
  try {
    const WinCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!WinCtx) return
    if (!sharedAudioCtx) {
      sharedAudioCtx = new WinCtx()
    }
    if (sharedAudioCtx.state === 'suspended') {
      void sharedAudioCtx.resume()
    }
    const osc = sharedAudioCtx.createOscillator()
    const gain = sharedAudioCtx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(kind === 'mic-start' ? 587 : 523, sharedAudioCtx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(
      kind === 'mic-start' ? 784 : 659,
      sharedAudioCtx.currentTime + 0.08
    )
    gain.gain.setValueAtTime(0.03, sharedAudioCtx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.0001, sharedAudioCtx.currentTime + 0.14)
    osc.connect(gain)
    gain.connect(sharedAudioCtx.destination)
    osc.start()
    osc.stop(sharedAudioCtx.currentTime + 0.15)
  } catch {
    // Ignore audio context blocks
  }
}

/**
 * Call synchronously inside click/submit handlers so browsers maintain user-activation
 * for subsequent SpeechSynthesis and Web Audio playback.
 */
export function unlockSpeechAudio(primeEmptyUtterance = true): void {
  if (typeof window === 'undefined') return
  try {
    const WinCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (WinCtx) {
      if (!sharedAudioCtx) sharedAudioCtx = new WinCtx()
      if (sharedAudioCtx.state === 'suspended') {
        void sharedAudioCtx.resume()
      }
    }
    if ('speechSynthesis' in window) {
      const synth = window.speechSynthesis
      synth.resume()
      if (
        primeEmptyUtterance &&
        !synth.speaking &&
        !synth.pending &&
        typeof SpeechSynthesisUtterance !== 'undefined'
      ) {
        const primer = new SpeechSynthesisUtterance(' ')
        primer.volume = 0
        primer.rate = 2
        activeUtterances.add(primer)
        primer.onend = () => activeUtterances.delete(primer)
        primer.onerror = () => activeUtterances.delete(primer)
        synth.speak(primer)
      }
    }
  } catch {
    // Safe no-op in headless/restricted environments
  }
}

function clearWatchdogs() {
  if (startWatchdogTimer) {
    clearTimeout(startWatchdogTimer)
    startWatchdogTimer = null
  }
  if (endWatchdogTimer) {
    clearTimeout(endWatchdogTimer)
    endWatchdogTimer = null
  }
}

function clearKeepAlive() {
  if (keepAliveInterval) {
    clearInterval(keepAliveInterval)
    keepAliveInterval = null
  }
}

export function stopAllSpeech(): void {
  playbackSessionId++
  clearKeepAlive()
  clearWatchdogs()
  if (cancelDelayTimer) {
    clearTimeout(cancelDelayTimer)
    cancelDelayTimer = null
  }
  activeUtterances.clear()
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel()
    } catch {
      // Ignore cancel errors
    }
  }
}

export function speakWithEngine(options: SpeakOptions): VoiceResolution | null {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    options.onError?.('Speech output is unavailable in this browser.')
    return null
  }

  const synth = window.speechSynthesis
  const initialResolution = resolveVoiceForLanguage(options.lang)
  const initialSpeakable = buildSpeakableText(options.text, options.lang, initialResolution)
  if (!initialSpeakable) {
    options.onError?.('No speakable text provided.')
    return null
  }

  const shouldCancelFirst = synth.speaking || synth.pending
  playbackSessionId++
  const mySessionId = playbackSessionId

  clearKeepAlive()
  clearWatchdogs()
  if (cancelDelayTimer) {
    clearTimeout(cancelDelayTimer)
    cancelDelayTimer = null
  }
  activeUtterances.clear()

  const buildQueueFor = (res: VoiceResolution, forceSystemDefaultVoice = false) => {
    const speakable = buildSpeakableText(options.text, options.lang, res)
    const primaryChunks = splitIntoSpeechChunks(speakable)
    const englishChunks =
      options.englishFallbackAlso && options.lang !== 'en' && options.englishSummaryText
        ? splitIntoSpeechChunks(stripMarkdownForSpeech(options.englishSummaryText))
        : []
    const enRes = englishChunks.length > 0 ? resolveVoiceForLanguage('en') : null

    return [
      ...primaryChunks.map((chunk) => ({
        text: chunk,
        voice: forceSystemDefaultVoice ? null : res.voice,
        lang:
          res.mode === 'native'
            ? res.targetLocale
            : (forceSystemDefaultVoice ? 'en-US' : res.voice?.lang ?? 'en-US'),
      })),
      ...englishChunks.map((chunk) => ({
        text: chunk,
        voice: forceSystemDefaultVoice ? null : enRes?.voice ?? res.voice,
        lang: enRes?.targetLocale ?? 'en-IN',
      })),
    ]
  }

  const startQueue = (res: VoiceResolution, forceSystemDefaultVoice: boolean, hasRetriedFallback: boolean) => {
    if (mySessionId !== playbackSessionId) return

    const queue = buildQueueFor(res, forceSystemDefaultVoice)
    let idx = 0
    let notifiedStart = false

    // Gentle keep-alive ONLY wakes Chromium if an OS engine auto-paused a long utterance
    keepAliveInterval = setInterval(() => {
      if (mySessionId !== playbackSessionId) {
        clearKeepAlive()
        return
      }
      try {
        if (synth.speaking && synth.paused) {
          synth.resume()
        }
      } catch {
        // Ignore resume errors
      }
    }, 2000)

    const attemptFallbackRetry = (failedVoice: SpeechSynthesisVoice | null, errReason: string) => {
      if (mySessionId !== playbackSessionId) return
      clearWatchdogs()
      if (failedVoice?.voiceURI) {
        brokenVoiceURIs.add(failedVoice.voiceURI)
      }
      if (!hasRetriedFallback) {
        clearKeepAlive()
        activeUtterances.clear()
        try {
          synth.cancel()
        } catch {
          // Ignore cancel error
        }
        const nextRes = resolveVoiceForLanguage(options.lang)
        const shouldForceNullVoice =
          failedVoice != null && nextRes.voice?.voiceURI === failedVoice.voiceURI
        const fallbackRes: VoiceResolution = shouldForceNullVoice
          ? {
              voice: null,
              mode: options.lang === 'en' ? 'native' : 'phonetic-bridge',
              voiceLabel: 'System Default Audio',
              targetLocale: nextRes.targetLocale,
            }
          : nextRes
        cancelDelayTimer = setTimeout(() => {
          startQueue(fallbackRes, shouldForceNullVoice, true)
        }, 60)
        return
      }
      clearKeepAlive()
      options.onError?.(errReason)
    }

    const speakNext = () => {
      clearWatchdogs()
      if (mySessionId !== playbackSessionId) {
        clearKeepAlive()
        return
      }
      if (idx >= queue.length) {
        clearKeepAlive()
        options.onEnd?.()
        return
      }

      const item = queue[idx]
      idx++
      const utter = new SpeechSynthesisUtterance(item.text)
      if (item.voice) {
        try {
          utter.voice = item.voice
        } catch {
          // Fall back to default voice matching utter.lang if browser rejects voice handle
        }
      }
      utter.lang = item.lang
      utter.rate = options.rate ?? 1.0
      utter.pitch = 1.0
      utter.volume = 1.0

      activeUtterances.add(utter)
      let chunkStarted = false
      let chunkFinished = false

      // Quarantine silently hanging cloud voices if onstart never fires within 1.5s
      startWatchdogTimer = setTimeout(() => {
        if (mySessionId !== playbackSessionId || chunkStarted || chunkFinished) return
        activeUtterances.delete(utter)
        attemptFallbackRetry(
          item.voice,
          'Browser speech voice did not start playback. Check system volume or browser voice settings.'
        )
      }, 1500)

      utter.onstart = () => {
        if (mySessionId !== playbackSessionId) return
        chunkStarted = true
        if (startWatchdogTimer) {
          clearTimeout(startWatchdogTimer)
          startWatchdogTimer = null
        }
        if (!notifiedStart) {
          notifiedStart = true
          options.onStart?.(res)
        }
        // Safety deadline so UI never stays stuck if a browser drops onend
        const maxMs = Math.max(12000, Math.round((item.text.length * 140) / Math.max(0.7, options.rate ?? 1)))
        endWatchdogTimer = setTimeout(() => {
          if (mySessionId !== playbackSessionId || chunkFinished) return
          chunkFinished = true
          activeUtterances.delete(utter)
          speakNext()
        }, maxMs)
      }

      utter.onend = () => {
        if (chunkFinished) return
        chunkFinished = true
        clearWatchdogs()
        activeUtterances.delete(utter)
        speakNext()
      }

      utter.onerror = (ev) => {
        if (chunkFinished) return
        chunkFinished = true
        clearWatchdogs()
        activeUtterances.delete(utter)
        if (mySessionId !== playbackSessionId) return
        const errCode = (ev as unknown as { error?: string })?.error
        if (errCode === 'interrupted' || errCode === 'canceled') return
        if (!chunkStarted && item.voice && !hasRetriedFallback) {
          attemptFallbackRetry(item.voice, `Speech error: ${errCode ?? 'playback interrupted'}`)
          return
        }
        clearKeepAlive()
        options.onError?.(`Speech error: ${errCode ?? 'playback interrupted'}`)
      }

      try {
        synth.resume()
        synth.speak(utter)
      } catch {
        clearWatchdogs()
        activeUtterances.delete(utter)
        clearKeepAlive()
        options.onError?.('Unable to trigger browser speech synthesis.')
      }
    }

    speakNext()
  }

  if (shouldCancelFirst) {
    try {
      synth.cancel()
    } catch {
      // Ignore cancel error
    }
    // Brief 60ms delay prevents Windows Chromium from silently cancelling the newly queued utterance
    cancelDelayTimer = setTimeout(() => startQueue(initialResolution, false, false), 60)
  } else {
    startQueue(initialResolution, false, false)
  }

  return initialResolution
}
