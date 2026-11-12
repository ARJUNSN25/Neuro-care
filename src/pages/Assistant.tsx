import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Bot,
  Cpu,
  Mic,
  MicOff,
  Plus,
  RotateCcw,
  Send,
  ShieldAlert,
  Siren,
  Sparkles,
  Square,
  Trash2,
  Volume2,
  Waves,
} from 'lucide-react'
import { EmergencyHelpModal } from '@/components/common/EmergencyHelpModal'
import { AppShell } from '@/components/layout/AppShell'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { Input, Select, Textarea } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Switch } from '@/components/ui/Switch'
import { LANGUAGE_OPTIONS, TRANSLATIONS } from '@/data/translations'
import { useNeuroCare } from '@/context/NeuroCareContext'
import { useTranslation } from '@/hooks/useTranslation'
import { classifyIntentWithTFIDF } from '@/services/mlIntentEngine'
import {
  getCachedVoices,
  playSoftFeedbackChime,
  resolveVoiceForLanguage,
  speakWithEngine,
  stopAllSpeech,
  subscribeVoicesChanged,
  unlockSpeechAudio,
} from '@/services/speechEngine'
import type { LanguageCode, MLIntentId } from '@/types/neurocare'
import { cn } from '@/utils/cn'

interface SpeechRecognitionAlternativeLike {
  transcript: string
}
interface SpeechRecognitionResultLike {
  0: SpeechRecognitionAlternativeLike
  isFinal: boolean
}
interface SpeechRecognitionEventLike {
  results: ArrayLike<SpeechRecognitionResultLike>
}
interface SpeechRecognitionErrorEventLike {
  error?: string
}
interface SpeechRecognitionLike {
  lang: string
  interimResults: boolean
  continuous: boolean
  onresult: ((ev: SpeechRecognitionEventLike) => void) | null
  onerror: ((ev: SpeechRecognitionErrorEventLike) => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
}

const TEST_VOICE_SAMPLES: Record<LanguageCode, string> = {
  en: 'Hello! NeuroCare AI voice assistant is active and ready to support your brain wellness.',
  kn: 'ನಮಸ್ಕಾರ! ನ್ಯೂರೋಕೇರ್ ಎಐ ಧ್ವನಿ ಸಹಾಯಕ ಸಕ್ರಿಯವಾಗಿದೆ. ನಿಮ್ಮ ಮೆದುಳಿನ ಆರೋಗ್ಯದ ಬಗ್ಗೆ ಕೇಳಿ.',
  hi: 'नमस्ते! न्यूरोकेयर एआई वॉइस असिस्टेंट सक्रिय है। अपने मस्तिष्क स्वास्थ्य के बारे में पूछें।',
  ar: 'مرحباً! مساعد نيوروكير الصوتي نشط وجاهز لدعم صحة دماغك.',
  ta: 'வணக்கம்! நியூரோಕேர் ஏஐ குரல் உதவியாளர் தயாராக உள்ளது. உங்கள் மூளை நலம் குறித்துக் கேளுங்கள்.',
}

function renderFormattedInline(segment: string, isUser: boolean): React.ReactNode[] {
  const tokens = segment.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g)
  return tokens.map((tok, idx) => {
    if (tok.startsWith('**') && tok.endsWith('**') && tok.length > 4) {
      return (
        <strong
          key={idx}
          className={isUser ? 'font-bold text-[#FAF4EA]' : 'font-bold text-[#0F3D3E]'}
        >
          {tok.slice(2, -2)}
        </strong>
      )
    }
    if (tok.startsWith('*') && tok.endsWith('*') && tok.length > 2) {
      return (
        <span
          key={idx}
          className={
            isUser
              ? 'italic text-[#EADCC8]/90 text-[0.92em]'
              : 'italic text-[#4A5D5E] text-[0.92em]'
          }
        >
          {tok.slice(1, -1)}
        </span>
      )
    }
    return tok
  })
}

function renderFormattedMessage(text: string, isUser: boolean): React.ReactNode {
  const lines = text.split('\n')
  return lines.map((line, i) => (
    <React.Fragment key={i}>
      {renderFormattedInline(line, isUser)}
      {i < lines.length - 1 ? <br /> : null}
    </React.Fragment>
  ))
}

export default function Assistant() {
  const {
    state,
    setLanguage,
    sendChatMessage,
    clearChatHistory,
    addMLTrainingSample,
    removeMLTrainingSample,
  } = useNeuroCare()
  const t = useTranslation()
  const activeLang = state.user.preferredLanguage

  const [input, setInput] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [voiceNotice, setVoiceNotice] = useState('')
  const [autoSpeak, setAutoSpeak] = useState(true)
  const [dualEnglish, setDualEnglish] = useState(false)
  const [seniorEasyMode, setSeniorEasyMode] = useState(true)
  const [speechRate, setSpeechRate] = useState(0.85)
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null)
  const [voiceTick, setVoiceTick] = useState(0)
  const [emergencyOpen, setEmergencyOpen] = useState(false)

  // ML Training Modal state
  const [trainModalOpen, setTrainModalOpen] = useState(false)
  const [trainPhrase, setTrainPhrase] = useState('')
  const [trainIntent, setTrainIntent] = useState<MLIntentId>('custom')
  const [trainLang, setTrainLang] = useState<LanguageCode>(activeLang)
  const [trainCustomAnswer, setTrainCustomAnswer] = useState('')
  const [probeQuery, setProbeQuery] = useState('')

  const scrollRef = useRef<HTMLDivElement | null>(null)
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null)

  useEffect(() => {
    const unsub = subscribeVoicesChanged(() => setVoiceTick((v) => v + 1))
    let checks = 0
    const pollId = setInterval(() => {
      checks++
      if (getCachedVoices().length > 0) {
        setVoiceTick((v) => v + 1)
        clearInterval(pollId)
      } else if (checks >= 16) {
        clearInterval(pollId)
      }
    }, 300)
    const syncId = setTimeout(() => {
      if (getCachedVoices().length > 0) {
        setVoiceTick((v) => v + 1)
        clearInterval(pollId)
      }
    }, 16)
    return () => {
      unsub()
      clearTimeout(syncId)
      clearInterval(pollId)
    }
  }, [])

  const currentVoiceInfo = useMemo(() => {
    void voiceTick
    return resolveVoiceForLanguage(activeLang)
  }, [activeLang, voiceTick])

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: 'smooth',
    })
  }, [state.chatHistory])

  useEffect(() => {
    return () => {
      stopAllSpeech()
      recognitionRef.current?.stop()
    }
  }, [])

  const speakText = useCallback(
    (
      text: string,
      lang: LanguageCode,
      msgId: string,
      manualClick = false,
      englishSummaryText?: string
    ) => {
      const res = speakWithEngine({
        text,
        lang,
        rate: speechRate,
        englishFallbackAlso: dualEnglish,
        englishSummaryText,
        onStart: (resolution) => {
          setSpeakingMsgId(msgId)
          setVoiceTick((v) => v + 1)
          if (manualClick) {
            const modeText =
              resolution.mode === 'native'
                ? t.assistantPage.voiceEngineNative
                : t.assistantPage.voiceEnginePhonetic
            setVoiceNotice(
              `${t.assistantPage.voiceErrors.spokenSuccessPrefix} ${resolution.voiceLabel} (${modeText})`
            )
          }
        },
        onEnd: () => {
          setSpeakingMsgId((prev) => (prev === msgId ? null : prev))
        },
        onError: (reason) => {
          setSpeakingMsgId((prev) => (prev === msgId ? null : prev))
          if (manualClick || reason) {
            setVoiceNotice(reason || t.assistantPage.voiceErrors.noTtsApi)
          }
        },
      })
      if (!res && manualClick) {
        setVoiceNotice(t.assistantPage.voiceErrors.noTtsApi)
      }
    },
    [
      speechRate,
      dualEnglish,
      t.assistantPage.voiceEngineNative,
      t.assistantPage.voiceEnginePhonetic,
      t.assistantPage.voiceErrors.spokenSuccessPrefix,
      t.assistantPage.voiceErrors.noTtsApi,
    ]
  )

  const handleStopSpeaking = () => {
    stopAllSpeech()
    setSpeakingMsgId(null)
  }

  const handleToggleSeniorEasy = (enabled: boolean) => {
    setSeniorEasyMode(enabled)
    setSpeechRate(enabled ? 0.85 : 1.0)
  }

  const triggerPrompt = (text: string, fromVoice = false) => {
    if (!text.trim()) return
    if (!fromVoice) {
      unlockSpeechAudio(!autoSpeak)
    }
    setVoiceNotice('')
    setInput('')
    const replyMsg = sendChatMessage(text, activeLang)
    if (replyMsg && autoSpeak) {
      playSoftFeedbackChime('reply-ready')
      speakText(
        replyMsg.content,
        replyMsg.language ?? activeLang,
        replyMsg.id,
        false,
        replyMsg.englishSummary
      )
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    triggerPrompt(input)
  }

  const handleTestVoice = () => {
    unlockSpeechAudio(false)
    if (speakingMsgId === 'test-voice') {
      handleStopSpeaking()
      return
    }
    playSoftFeedbackChime('reply-ready')
    speakText(
      TEST_VOICE_SAMPLES[activeLang],
      activeLang,
      'test-voice',
      true,
      TEST_VOICE_SAMPLES.en
    )
  }

  const startRecognitionLoop = (locale: string, allowEnFallback: boolean) => {
    const win = window as unknown as {
      SpeechRecognition?: new () => SpeechRecognitionLike
      webkitSpeechRecognition?: new () => SpeechRecognitionLike
    }
    const RecCtor = win.SpeechRecognition || win.webkitSpeechRecognition
    if (!RecCtor) {
      setVoiceNotice(t.assistantPage.voiceErrors.noSpeechApi)
      return
    }

    try {
      const rec = new RecCtor()
      rec.lang = locale
      rec.interimResults = true
      rec.continuous = false
      let finalTranscript = ''
      let latestTranscript = ''
      let retriedFallback = false
      let hadError = false

      rec.onresult = (event) => {
        let combined = ''
        for (let i = 0; i < event.results.length; i++) {
          combined += event.results[i][0].transcript
          if (event.results[i].isFinal) {
            finalTranscript = combined
          }
        }
        latestTranscript = combined
        setInput(combined)
      }

      rec.onerror = (ev) => {
        const errCode = ev?.error ?? ''
        setIsListening(false)
        if (errCode === 'aborted') {
          return
        }
        if (
          allowEnFallback &&
          locale !== 'en-IN' &&
          (errCode === 'language-not-supported' || errCode === 'service-not-allowed')
        ) {
          retriedFallback = true
          setVoiceNotice(t.assistantPage.voiceErrors.langFallback)
          startRecognitionLoop('en-IN', false)
          return
        }
        hadError = true
        if (errCode === 'no-speech') {
          setVoiceNotice(t.assistantPage.voiceErrors.micNoSpeech)
        } else if (errCode === 'audio-capture') {
          setVoiceNotice(t.assistantPage.voiceErrors.micNoDevice)
        } else if (errCode === 'network' || errCode === 'service-not-allowed') {
          setVoiceNotice(t.assistantPage.voiceErrors.micServiceBlocked)
        } else {
          setVoiceNotice(t.assistantPage.voiceErrors.micBlocked)
        }
      }

      rec.onend = () => {
        if (retriedFallback) return
        setIsListening(false)
        const spoken = (finalTranscript || latestTranscript).trim()
        if (hadError && !spoken) return
        if (spoken) {
          triggerPrompt(spoken, true)
        }
      }

      recognitionRef.current = rec
      rec.start()
      setIsListening(true)
    } catch {
      setIsListening(false)
      setVoiceNotice(t.assistantPage.voiceErrors.micStartFailed)
    }
  }

  const startVoiceConversation = () => {
    setVoiceNotice('')

    if (isListening) {
      recognitionRef.current?.stop()
      setIsListening(false)
      return
    }

    handleStopSpeaking()
    unlockSpeechAudio(true)
    playSoftFeedbackChime('mic-start')
    startRecognitionLoop(t.speechLocale, true)
  }

  const handleAddTrainingSample = (e: React.FormEvent) => {
    e.preventDefault()
    if (!trainPhrase.trim()) return
    addMLTrainingSample({
      phrase: trainPhrase.trim(),
      intent: trainIntent,
      language: trainLang,
      customAnswer:
        trainIntent === 'custom' && trainCustomAnswer.trim()
          ? trainCustomAnswer.trim()
          : undefined,
      isDefault: false,
    })
    setTrainPhrase('')
    setTrainCustomAnswer('')
  }

  const handleClearChat = () => {
    handleStopSpeaking()
    clearChatHistory()
  }

  const probeResult = probeQuery.trim()
    ? classifyIntentWithTFIDF(
        probeQuery,
        state.mlTrainingSamples,
        activeLang
      )
    : null

  const formatIntentLabel = (intentKey: string) => {
    const map: Record<string, string> = {
      memory: t.assistantPage.trainModal.intents.memory,
      sleep: t.assistantPage.trainModal.intents.sleep,
      attention: t.assistantPage.trainModal.intents.attention,
      physical: t.assistantPage.trainModal.intents.physical,
      nutrition: t.assistantPage.trainModal.intents.nutrition,
      stress: t.assistantPage.trainModal.intents.stress,
      greeting: t.assistantPage.trainModal.intents.greeting,
      clinical: t.assistantPage.trainModal.intents.clinical,
      progress: t.nav.analytics,
      safety_refusal: t.assistantPage.safetyBold.replace(':', ''),
      'custom-trained': t.assistantPage.trainModal.intents.custom,
      custom: t.assistantPage.trainModal.intents.custom,
    }
    return map[intentKey] ?? intentKey
  }

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="cyan">
                <Cpu className="h-3 w-3" />
                {t.assistantPage.badgeMl}
              </Badge>
              <Badge variant="primary">{t.assistantPage.badgeLangs}</Badge>
            </div>
            <h1 className="mt-2 text-2xl sm:text-3xl font-bold text-[#0F3D3E]">
              {t.assistantPage.title}
            </h1>
            <p className="text-sm text-[#4A5D5E]">{t.assistantPage.subtitle}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setTrainLang(activeLang)
                setTrainModalOpen(true)
              }}
            >
              <Cpu className="h-3.5 w-3.5 text-[#2E6F73]" />
              {t.assistantPage.trainModelBtn} ({state.mlTrainingSamples.length})
            </Button>
            <Button variant="outline" size="sm" onClick={handleClearChat}>
              <RotateCcw className="h-3.5 w-3.5" />
              {t.assistantPage.resetBtn}
            </Button>
          </div>
        </div>

        {/* 5-Language Instant Voice & UI Switcher + Speech Settings Bar */}
        <Card>
          <CardContent className="pt-4 space-y-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-xs font-semibold text-[#0F3D3E] me-1">
                  {t.assistantPage.voiceChatLangLabel}
                </span>
                {LANGUAGE_OPTIONS.map((opt) => (
                  <button
                    key={opt.code}
                    type="button"
                    onClick={() => {
                      setVoiceNotice('')
                      setLanguage(opt.code)
                    }}
                    className={cn(
                      'rounded-xl border px-3 py-1.5 text-xs font-semibold transition-colors',
                      activeLang === opt.code
                        ? 'border-[#2E6F73] bg-[#2E6F73] text-[#FAF4EA]'
                        : 'border-[#2E6F73]/25 bg-[#FBF6EE] text-[#263A3B] hover:border-[#2E6F73]/55'
                    )}
                  >
                    {opt.nativeLabel}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-3 border-t md:border-t-0 pt-2 md:pt-0 border-[#CBB9A1]/60">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-[#263A3B]">
                    {t.assistantPage.autoSpeakLabel}
                  </span>
                  <Switch
                    checked={autoSpeak}
                    onCheckedChange={setAutoSpeak}
                    aria-label={t.assistantPage.autoSpeakLabel}
                  />
                </div>
                <Select
                  aria-label={t.assistantPage.voiceSpeedRates.normal}
                  value={String(speechRate)}
                  onChange={(e) => setSpeechRate(Number(e.target.value))}
                  className="h-8 w-32 text-xs"
                >
                  <option value="0.85">{t.assistantPage.voiceSpeedRates.calm}</option>
                  <option value="1">{t.assistantPage.voiceSpeedRates.normal}</option>
                  <option value="1.15">{t.assistantPage.voiceSpeedRates.brisk}</option>
                </Select>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#CBB9A1]/60 pt-2.5 min-w-0">
              <div className="flex flex-wrap items-center gap-2 min-w-0 max-w-full">
                <Button
                  type="button"
                  size="sm"
                  variant={speakingMsgId === 'test-voice' ? 'danger' : 'secondary'}
                  onClick={handleTestVoice}
                >
                  {speakingMsgId === 'test-voice' ? (
                    <>
                      <Square className="h-3.5 w-3.5 fill-current" />
                      {t.assistantPage.stopSpeaking}
                    </>
                  ) : (
                    <>
                      <Volume2 className="h-3.5 w-3.5 text-[#2E6F73]" />
                      {t.assistantPage.testVoiceBtn}
                    </>
                  )}
                </Button>

                <Badge
                  variant={currentVoiceInfo.mode === 'native' ? 'success' : 'cyan'}
                  className="max-w-full whitespace-normal text-start leading-tight"
                >
                  <Waves className="h-3 w-3 shrink-0" />
                  <span className="break-words">
                    {currentVoiceInfo.mode === 'native'
                      ? t.assistantPage.voiceEngineNative
                      : t.assistantPage.voiceEnginePhonetic}
                    : {currentVoiceInfo.voiceLabel}
                  </span>
                </Badge>
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-[#263A3B]">
                    {t.assistantPage.easyReadLabel}
                  </span>
                  <Switch
                    checked={seniorEasyMode}
                    onCheckedChange={handleToggleSeniorEasy}
                    aria-label={t.assistantPage.easyReadLabel}
                  />
                </div>

                {activeLang !== 'en' && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-[#263A3B]">
                      {t.assistantPage.dualEnglishLabel}
                    </span>
                    <Switch
                      checked={dualEnglish}
                      onCheckedChange={setDualEnglish}
                      aria-label={t.assistantPage.dualEnglishLabel}
                    />
                  </div>
                )}
              </div>
            </div>

            <p className="text-xs text-[#263A3B] bg-[#FBF6EE] border border-[#2E6F73]/25 rounded-xl px-3 py-2">
              {t.assistantPage.langGuaranteeHint}
            </p>
          </CardContent>
        </Card>

        {/* Medical Safety Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-[#C6601F]/45 bg-[#F7E8D8] px-4 py-3 text-xs text-[#7A360D]">
          <div className="flex items-start gap-2.5">
            <ShieldAlert className="h-4 w-4 text-[#C6601F] shrink-0 mt-0.5" />
            <span>
              <strong className="text-[#5C2606]">{t.assistantPage.safetyBold}</strong> {t.assistantPage.safetyText}
              <strong className="text-[#5C2606]">{t.assistantPage.safetyNeverDiagnose}</strong>
            </span>
          </div>
          <button
            type="button"
            onClick={() => setEmergencyOpen(true)}
            className="inline-flex items-center gap-1.5 self-start sm:self-center rounded-xl border border-[#C6601F]/60 bg-[#0A0F14] px-3 py-1.5 text-xs font-bold text-[#EADCC8] hover:bg-[#0F3D3E] shrink-0 transition-colors"
          >
            <Siren className="h-3.5 w-3.5 text-[#C6601F] shrink-0" />
            <span dir="ltr" className="tabular-nums font-extrabold">
              112 / 108
            </span>
            <span>· {t.emergencyHelp.headerBtn}</span>
          </button>
        </div>

        {/* Localized Suggested Prompts */}
        <div className="flex flex-wrap gap-2">
          {t.assistantPage.starterPrompts.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => triggerPrompt(q)}
              className={cn(
                'rounded-full border border-[#2E6F73]/25 bg-[#FBF6EE] px-4 font-medium text-[#0F3D3E] hover:border-[#2E6F73] hover:bg-[#EADCC8]/65 transition-colors text-start',
                seniorEasyMode ? 'py-2 text-xs sm:text-sm' : 'py-1.5 text-xs'
              )}
            >
              {q}
            </button>
          ))}
        </div>

        {voiceNotice && (
          <div className="rounded-xl border border-[#2E6F73]/30 bg-[#F7EFE3] px-4 py-2.5 text-xs sm:text-sm text-[#0F3D3E]">
            {voiceNotice}
          </div>
        )}

        {/* Conversation Window */}
        <Card className="overflow-hidden">
          <div
            ref={scrollRef}
            className="h-[460px] overflow-y-auto p-4 sm:p-5 space-y-4 bg-[#EADCC8]/45"
          >
            {state.chatHistory.map((msg) => {
              const isSpeakingThis = speakingMsgId === msg.id
              const isInitial = msg.id === 'msg-1'
              const displayContent = isInitial
                ? t.assistantPage.initialGreeting
                : msg.content
              const displayFollowUps = isInitial
                ? t.assistantPage.starterPrompts.slice(0, 2)
                : msg.suggestedFollowUps?.slice(0, 2)
              const englishSummary = isInitial
                ? TRANSLATIONS.en.assistantPage.initialGreeting
                : msg.englishSummary

              return (
                <div
                  key={msg.id}
                  className={cn(
                    'flex flex-col max-w-[92%] sm:max-w-[88%] space-y-1.5',
                    msg.role === 'user' ? 'ms-auto items-end' : 'me-auto items-start'
                  )}
                >
                  <div className="flex items-center gap-2 text-[11px] font-semibold text-[#4A5D5E]">
                    {msg.role === 'assistant' ? (
                      <>
                        <Bot className="h-3.5 w-3.5 text-[#2E6F73]" />
                        <span>NeuroCare AI</span>
                        {msg.mlIntent && (
                          <Badge variant="outline" className="text-[10px] py-0">
                            {t.assistantPage.mlBadgePrefix} {formatIntentLabel(msg.mlIntent)} ·{' '}
                            {msg.mlConfidence ?? 85}%
                          </Badge>
                        )}
                      </>
                    ) : (
                      <span>{state.user.fullName}</span>
                    )}
                  </div>

                  <div
                    className={cn(
                      'rounded-2xl px-4 py-3 shadow-xs text-start break-words',
                      seniorEasyMode
                        ? 'text-[15px] sm:text-base leading-7'
                        : 'text-xs sm:text-sm leading-relaxed',
                      msg.role === 'user'
                        ? 'bg-[#0F3D3E] text-[#EADCC8]'
                        : 'bg-[#F7EFE3] border border-[#2E6F73]/25 text-[#0A0F14]'
                    )}
                  >
                    {renderFormattedMessage(displayContent, msg.role === 'user')}
                  </div>

                  {msg.role === 'assistant' && (
                    <div className="flex flex-wrap items-center gap-2 pt-0.5">
                      <button
                        type="button"
                        onClick={() => {
                          unlockSpeechAudio(false)
                          if (isSpeakingThis) {
                            handleStopSpeaking()
                          } else {
                            speakText(
                              displayContent,
                              msg.language ?? activeLang,
                              msg.id,
                              true,
                              englishSummary
                            )
                          }
                        }}
                        className={cn(
                          'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-colors',
                          isSpeakingThis
                            ? 'border-[#C6601F]/50 bg-[#C6601F]/15 text-[#8C3F10]'
                            : 'border-[#2E6F73]/25 bg-[#FBF6EE] text-[#0F3D3E] hover:border-[#2E6F73] hover:text-[#2E6F73]'
                        )}
                      >
                        {isSpeakingThis ? (
                          <>
                            <Square className="h-3 w-3 fill-current" />
                            {t.assistantPage.stopSpeaking}
                          </>
                        ) : (
                          <>
                            <Volume2 className="h-3.5 w-3.5 text-[#2E6F73]" />
                            {t.assistantPage.speakBtn}
                          </>
                        )}
                      </button>

                      {displayFollowUps?.map((f) => (
                        <button
                          key={f}
                          type="button"
                          onClick={() => triggerPrompt(f)}
                          className="rounded-full border border-[#2E6F73]/25 bg-[#FBF6EE] px-2.5 py-1 text-[11px] font-medium text-[#2E6F73] hover:bg-[#EADCC8]/75 text-start"
                        >
                          {f}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}

            {speakingMsgId && (
              <div className="flex items-center gap-2 text-xs text-[#2E6F73] font-medium">
                <Sparkles className="h-4 w-4 animate-pulse" />
                <span>{t.assistantPage.testingVoiceBtn}</span>
              </div>
            )}
          </div>

          {/* Speech-to-Speech & Text Input Bar */}
          <CardContent className="p-3 bg-[#F7EFE3] border-t border-[#2E6F73]/20">
            <form onSubmit={handleSubmit} className="flex flex-wrap sm:flex-nowrap items-center gap-2">
              <Button
                type="button"
                variant={isListening ? 'danger' : 'cyan'}
                onClick={startVoiceConversation}
                className="shrink-0"
                aria-label={isListening ? t.assistantPage.listeningNow : t.assistantPage.listenVoice}
              >
                {isListening ? (
                  <>
                    <MicOff className="h-4 w-4 animate-pulse" />
                    <span>{t.assistantPage.listeningNow}</span>
                  </>
                ) : (
                  <>
                    <Mic className="h-4 w-4" />
                    <span>{t.assistantPage.listenVoice}</span>
                  </>
                )}
              </Button>

              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={t.assistantPage.inputPlaceholder}
                className="flex-1 min-w-[180px]"
              />

              <Button
                type="submit"
                variant="primary"
                disabled={!input.trim()}
                className="shrink-0"
              >
                <Send className="h-4 w-4" />
                <span className="hidden sm:inline">{t.assistantPage.sendBtn}</span>
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Client-Side ML Training Modal */}
        <Modal
          open={trainModalOpen}
          onClose={() => setTrainModalOpen(false)}
          title={t.assistantPage.trainModal.title}
          subtitle={t.assistantPage.trainModal.subtitle}
          maxWidthClass="max-w-2xl"
        >
          <div className="space-y-5">
            {/* Live Probe Tester */}
            <div className="rounded-xl border border-[#2E6F73]/25 bg-[#FBF6EE] p-4 space-y-2">
              <label className="text-xs font-bold text-[#0F3D3E]">
                {t.assistantPage.trainModal.probeTitle}
              </label>
              <Input
                value={probeQuery}
                onChange={(e) => setProbeQuery(e.target.value)}
                placeholder={t.assistantPage.trainModal.probePlaceholder}
              />
              {probeResult && (
                <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                  <Badge variant="primary">
                    {t.assistantPage.trainModal.intentLabel} {formatIntentLabel(probeResult.intent)}
                  </Badge>
                  <Badge variant="success">
                    {t.assistantPage.trainModal.confidenceLabel} {probeResult.confidence}%
                  </Badge>
                  <Badge variant="cyan">
                    {t.assistantPage.trainModal.langLabel} {probeResult.detectedLanguage.toUpperCase()}
                  </Badge>
                </div>
              )}
            </div>

            {/* Add Training Sample Form */}
            <form onSubmit={handleAddTrainingSample} className="space-y-3 border-t border-[#CBB9A1]/60 pt-4">
              <h4 className="text-sm font-bold text-[#0F3D3E]">
                {t.assistantPage.trainModal.teachHeading}
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-[#0F3D3E]">
                    {t.assistantPage.trainModal.intentCategoryLabel}
                  </label>
                  <Select
                    value={trainIntent}
                    onChange={(e) => setTrainIntent(e.target.value as MLIntentId)}
                    className="mt-1"
                  >
                    <option value="custom">{t.assistantPage.trainModal.intents.custom}</option>
                    <option value="physical">{t.assistantPage.trainModal.intents.physical}</option>
                    <option value="memory">{t.assistantPage.trainModal.intents.memory}</option>
                    <option value="sleep">{t.assistantPage.trainModal.intents.sleep}</option>
                    <option value="attention">{t.assistantPage.trainModal.intents.attention}</option>
                    <option value="nutrition">{t.assistantPage.trainModal.intents.nutrition}</option>
                    <option value="stress">{t.assistantPage.trainModal.intents.stress}</option>
                    <option value="greeting">{t.assistantPage.trainModal.intents.greeting}</option>
                    <option value="clinical">{t.assistantPage.trainModal.intents.clinical}</option>
                  </Select>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-[#0F3D3E]">
                    {t.assistantPage.trainModal.languageFieldLabel}
                  </label>
                  <Select
                    value={trainLang}
                    onChange={(e) => setTrainLang(e.target.value as LanguageCode)}
                    className="mt-1"
                  >
                    {LANGUAGE_OPTIONS.map((o) => (
                      <option key={o.code} value={o.code}>
                        {o.nativeLabel}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-[#0F3D3E]">
                  {t.assistantPage.trainModal.samplePhraseLabel}
                </label>
                <Input
                  value={trainPhrase}
                  onChange={(e) => setTrainPhrase(e.target.value)}
                  placeholder={t.assistantPage.trainModal.samplePhrasePlaceholder}
                  className="mt-1"
                  required
                />
              </div>

              {trainIntent === 'custom' && (
                <div>
                  <label className="text-[11px] font-semibold text-[#0F3D3E]">
                    {t.assistantPage.trainModal.customResponseLabel}
                  </label>
                  <Textarea
                    value={trainCustomAnswer}
                    onChange={(e) => setTrainCustomAnswer(e.target.value)}
                    placeholder={t.assistantPage.trainModal.customResponsePlaceholder}
                    className="mt-1"
                    required
                  />
                </div>
              )}

              <Button type="submit" variant="primary" size="sm">
                <Plus className="h-3.5 w-3.5" />
                {t.assistantPage.trainModal.addRetrainBtn}
              </Button>
            </form>

            {/* Custom Samples List */}
            <div className="space-y-2 border-t border-[#CBB9A1]/60 pt-4 max-h-44 overflow-y-auto">
              <p className="text-xs font-bold text-[#0F3D3E]">
                {t.assistantPage.trainModal.corpusSizePrefix} {state.mlTrainingSamples.length}{' '}
                {t.assistantPage.trainModal.corpusSamplesSuffix}
              </p>
              {state.mlTrainingSamples
                .filter((s) => !s.isDefault)
                .map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between gap-2 rounded-xl border border-[#2E6F73]/25 bg-[#FBF6EE] px-3 py-2 text-xs"
                  >
                    <div className="min-w-0">
                      <span className="font-semibold text-[#0F3D3E]">{s.phrase}</span>
                      <span className="ms-2 text-[#4A5D5E]">
                        [{formatIntentLabel(s.intent)} · {s.language.toUpperCase()}]
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeMLTrainingSample(s.id)}
                      aria-label={t.assistantPage.trainModal.deleteAria}
                      className="text-[#C6601F] hover:text-[#9B2C1B] p-1"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
            </div>
          </div>
        </Modal>

        <EmergencyHelpModal open={emergencyOpen} onClose={() => setEmergencyOpen(false)} />
      </div>
    </AppShell>
  )
}
