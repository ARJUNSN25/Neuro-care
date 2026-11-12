import type { LanguageCode, MLIntentId, MLTrainingSample } from '@/types/neurocare'

export const DEFAULT_ML_SAMPLES: MLTrainingSample[] = [
  // Memory
  { id: 'ml-1', intent: 'memory', language: 'en', phrase: 'how can i improve my memory recall forgetful names keep forgetting', isDefault: true },
  { id: 'ml-2', intent: 'memory', language: 'en', phrase: 'tips to strengthen short term memory and remember things easily old age', isDefault: true },
  { id: 'ml-3', intent: 'memory', language: 'kn', phrase: 'ನನ್ನ ನೆನಪಿನ ಶಕ್ತಿಯನ್ನು ಹೇಗೆ ಸುಧಾರಿಸಬಹುದು ಮರೆಯುವಿಕೆ ಜ್ಞಾಪಕ ನೆನಪು ಇರಲ್ಲ ಮರೆತುಹೋಗುತ್ತದೆ', isDefault: true },
  { id: 'ml-4', intent: 'memory', language: 'hi', phrase: 'मैं अपनी याददाश्त कैसे सुधार सकता हूँ स्मृति भूलना नाम याद नहीं रहता', isDefault: true },
  { id: 'ml-5', intent: 'memory', language: 'ar', phrase: 'كيف يمكنني تحسين ذاكرتي النسيان تذكر الأشياء تقوية الذاكرة أنسى الأسماء', isDefault: true },
  { id: 'ml-6', intent: 'memory', language: 'ta', phrase: 'என் நினைவாற்றலை எவ்வாறு மேம்படுத்துவது மறதி ஞாபக சக்தி மறந்துவிடுகிறது', isDefault: true },

  // Sleep
  { id: 'ml-7', intent: 'sleep', language: 'en', phrase: 'what is the connection between sleep and brain health insomnia tired bedtime cant sleep', isDefault: true },
  { id: 'ml-8', intent: 'sleep', language: 'en', phrase: 'how many hours of sleep do i need trouble sleeping wake up night rest', isDefault: true },
  { id: 'ml-9', intent: 'sleep', language: 'kn', phrase: 'ನಿದ್ರೆ ಮತ್ತು ಮೆದುಳಿನ ಆರೋಗ್ಯದ ನಡುವೆ ಏನು ಸಂಬಂಧ ನಿದ್ದೆ ಬರುತ್ತಿಲ್ಲ ರಾತ್ರಿ ನಿದ್ರೆ', isDefault: true },
  { id: 'ml-10', intent: 'sleep', language: 'hi', phrase: 'नींद और मस्तिष्क स्वास्थ्य के बीच क्या संबंध है अनिद्रा थकान सो नहीं पाता', isDefault: true },
  { id: 'ml-11', intent: 'sleep', language: 'ar', phrase: 'ما العلاقة بين النوم وصحة الدماغ الأرق ساعات النوم الراحة لا أنام', isDefault: true },
  { id: 'ml-12', intent: 'sleep', language: 'ta', phrase: 'தூக்கத்திற்கும் மூளை ஆரோக்கியத்திற்கும் என்ன தொடர்பு தூக்கம் வரவில்லை ஓய்வு', isDefault: true },

  // Attention / Concentration
  { id: 'ml-13', intent: 'attention', language: 'en', phrase: 'how can i improve my concentration focus distracted brain fog pay attention', isDefault: true },
  { id: 'ml-14', intent: 'attention', language: 'kn', phrase: 'ಏಕಾಗ್ರತೆಯನ್ನು ಹೇಗೆ ಹೆಚ್ಚಿಸಬಹುದು ಗಮನ ನಿಲ್ಲುತ್ತಿಲ್ಲ ಚಂಚಲತೆ', isDefault: true },
  { id: 'ml-15', intent: 'attention', language: 'hi', phrase: 'मैं अपनी एकाग्रता ध्यान कैसे बढ़ाएं फोकस भटकाव मन नहीं लगता', isDefault: true },
  { id: 'ml-16', intent: 'attention', language: 'ar', phrase: 'كيف يمكنني زيادة تركيزي الانتباه التشتت الذهني عدم التركيز', isDefault: true },
  { id: 'ml-17', intent: 'attention', language: 'ta', phrase: 'என் கவனத்தை எவ்வாறு அதிகரிப்பது ஒருமுகப்படுத்துதல் கவனச்சிதறல்', isDefault: true },

  // Physical Exercise Suggestions
  { id: 'ml-18', intent: 'physical', language: 'en', phrase: 'physical exercise workout walking yoga stretching movement for seniors old people', isDefault: true },
  { id: 'ml-19', intent: 'physical', language: 'en', phrase: 'give me physical exercises for brain wellness daily steps aerobic walk', isDefault: true },
  { id: 'ml-20', intent: 'physical', language: 'kn', phrase: 'ಮೆದುಳಿನ ಆರೋಗ್ಯಕ್ಕೆ ದೈಹಿಕ ವ್ಯಾಯಾಮ ಸಲಹೆ ನೀಡಿ ನಡಿಗೆ ಯೋಗ ಸೂರ್ಯ ನಮಸ್ಕಾರ ದೇಹದ ಚಟುವಟಿಕೆ', isDefault: true },
  { id: 'ml-21', intent: 'physical', language: 'hi', phrase: 'मस्तिष्क के लिए शारीरिक व्यायाम के सुझाव दें टहलना योग सूर्य नमस्कार कसरत सैर', isDefault: true },
  { id: 'ml-22', intent: 'physical', language: 'ar', phrase: 'اقترح تمارين بدنية لدعم صحة الدماغ رياضة المشي اليوغا النشاط الجسدي', isDefault: true },
  { id: 'ml-23', intent: 'physical', language: 'ta', phrase: 'மூளை நலனுக்கான உடற்பயிற்சி ஆலோசனைகள் தாருங்கள் நடைப்பயிற்சி யோகா உடல் செயல்பாடு', isDefault: true },

  // Nutrition & Lifestyle
  { id: 'ml-24', intent: 'nutrition', language: 'en', phrase: 'what food diet walnuts almonds fruits vegetables water blood pressure sugar vitamin', isDefault: true },
  { id: 'ml-25', intent: 'nutrition', language: 'kn', phrase: 'ಆಹಾರ ಬಾದಾಮಿ ವಾಲ್‌ನಟ್ ಪೋಷಣೆ ಊಟ ಹಣ್ಣು ತರಕಾರಿ ನೀರು ಕುಡಿಯುವುದು', isDefault: true },
  { id: 'ml-26', intent: 'nutrition', language: 'hi', phrase: 'भोजन आहार बादाम अखरोट क्या खाना चाहिए पानी फल सब्ज़ी पोषण', isDefault: true },
  { id: 'ml-27', intent: 'nutrition', language: 'ar', phrase: 'التغذية الطعام الصحي الجوز اللوز شرب الماء ماذا آكل الفواكه', isDefault: true },
  { id: 'ml-28', intent: 'nutrition', language: 'ta', phrase: 'உணவு பாதாம் வால்நட் என்ன சாப்பிட வேண்டும் தண்ணீர் பழம் காய்கறி', isDefault: true },

  // Stress & Mental Wellness
  { id: 'ml-29', intent: 'stress', language: 'en', phrase: 'stress anxiety tension worry fear relaxation breathing pranayama calm lonely', isDefault: true },
  { id: 'ml-30', intent: 'stress', language: 'kn', phrase: 'ಒತ್ತಡ ಆತಂಕ ಭಯ ಪ್ರಾಣಾಯಾಮ ವಿಶ್ರಾಂತಿ ಮನಸ್ಸು ಶಾಂತಿ ದುಃಖ', isDefault: true },
  { id: 'ml-31', intent: 'stress', language: 'hi', phrase: 'तनाव चिंता घबराहट प्राणायाम आराम शांत मन बेचैनी', isDefault: true },
  { id: 'ml-32', intent: 'stress', language: 'ar', phrase: 'التوتر القلق الاسترخاء التنفس العميق الهدوء النفسي الخوف', isDefault: true },
  { id: 'ml-33', intent: 'stress', language: 'ta', phrase: 'மன அழுத்தம் பதற்றம் கவலை மூச்சுப்பயிற்சி அமைதி பயம்', isDefault: true },

  // Personal Progress / Scores / Report
  { id: 'ml-34', intent: 'progress', language: 'en', phrase: 'check my progress trends score assessment report history analytics results', isDefault: true },
  { id: 'ml-35', intent: 'progress', language: 'kn', phrase: 'ನನ್ನ ಪ್ರಗತಿ ಮತ್ತು ವರದಿ ತೋರಿಸಿ ಮೌಲ್ಯಮಾಪನ ಅಂಕಿಅಂಶಗಳು ಫಲಿತಾಂಶ', isDefault: true },
  { id: 'ml-36', intent: 'progress', language: 'hi', phrase: 'मेरी प्रगति और रिपोर्ट दिखाएं मूल्यांकन परिणाम स्कोर डेटा', isDefault: true },
  { id: 'ml-37', intent: 'progress', language: 'ar', phrase: 'اعرض ملخص تقدمي ونتائجي التقرير نتائج التقييم الإحصائيات', isDefault: true },
  { id: 'ml-38', intent: 'progress', language: 'ta', phrase: 'என் முன்னேற்றம் அறிக்கையைக் காட்டு மதிப்பீடு முடிவுகள் மதிப்பெண்', isDefault: true },

  // Safety Refusal (Diagnosis / Prescriptions)
  { id: 'ml-39', intent: 'safety_refusal', language: 'en', phrase: 'diagnose do i have dementia alzheimer prescribe medicine tablet pill dose drug', isDefault: true },
  { id: 'ml-40', intent: 'safety_refusal', language: 'kn', phrase: 'ರೋಗನಿರ್ಣಯ ಡಿಮೆನ್ಶಿಯಾ ಅಲ್ಜೈಮರ್ ಔಷಧಿ ಮಾತ್ರೆ ಬರೆದುಕೊಡಿ ಗುಳಿಗೆ', isDefault: true },
  { id: 'ml-41', intent: 'safety_refusal', language: 'hi', phrase: 'निदान डिमेंशिया अल्जाइमर दवा गोली लिखें दवाई कौन सी लूं', isDefault: true },
  { id: 'ml-42', intent: 'safety_refusal', language: 'ar', phrase: 'تشخيص الخرف الزهايمر وصف دواء حبوب علاج ما الدواء', isDefault: true },
  { id: 'ml-43', intent: 'safety_refusal', language: 'ta', phrase: 'நோய் கண்டறிதல் டிமென்ஷியா மருந்து மாத்திரை பரிந்துரை என்ன மாத்திரை', isDefault: true },

  // Additional Everyday & Senior-Friendly Phrasings
  { id: 'ml-44', intent: 'nutrition', language: 'en', phrase: 'dehydration drink water vitamin b12 blood pressure diet sugar', isDefault: true },
  { id: 'ml-45', intent: 'sleep', language: 'en', phrase: 'late phone screen fatigue poor deep sleep wake up tired', isDefault: true },
  { id: 'ml-46', intent: 'physical', language: 'en', phrase: 'morning walk balance gentle exercise seniors mobility slow walk', isDefault: true },
  { id: 'ml-47', intent: 'progress', language: 'en', phrase: 'how am i doing show today summary assessment history graph', isDefault: true },

  { id: 'ml-48', intent: 'nutrition', language: 'kn', phrase: 'ನೀರು ಕುಡಿಯುವುದು ವಿಟಮಿನ್ ಬಿ12 ರಕ್ತದೊತ್ತಡ ಸಕ್ಕರೆ ಆಹಾರ', isDefault: true },
  { id: 'ml-49', intent: 'sleep', language: 'kn', phrase: 'ರಾತ್ರಿ ಮೊಬೈಲ್ ಆಯಾಸ ಸುಸ್ತು ನಿದ್ರೆಯ ಸಮಯ ಚೆನ್ನಾಗಿ ನಿದ್ದೆ', isDefault: true },
  { id: 'ml-50', intent: 'physical', language: 'kn', phrase: 'ಬೆಳಗಿನ ನಡಿಗೆ ಸಮತೋಲನ ವ್ಯಾಯಾಮ ಹಿರಿಯರಿಗೆ ಸುಲಭ ವ್ಯಾಯಾಮ ಹೆಜ್ಜೆಗಳು', isDefault: true },
  { id: 'ml-51', intent: 'progress', language: 'kn', phrase: 'ನನ್ನ ಇಂದಿನ ಸ್ಥಿತಿ ಮತ್ತು ಅಂಕಗಳು ವರದಿ ಪರಿಶೀಲನೆ', isDefault: true },

  { id: 'ml-52', intent: 'nutrition', language: 'hi', phrase: 'पानी पीना कमजोरी विटामिन बी12 ब्लड प्रेशर संतुलित खाना', isDefault: true },
  { id: 'ml-53', intent: 'sleep', language: 'hi', phrase: 'मोबाइल स्क्रीन थकान गहरी नींद सुबह सुस्ती सोने का समय', isDefault: true },
  { id: 'ml-54', intent: 'physical', language: 'hi', phrase: 'सुबह की सैर बुजुर्गों के लिए व्यायाम रोज़ाना कदम चलना', isDefault: true },
  { id: 'ml-55', intent: 'progress', language: 'hi', phrase: 'मेरा आज का स्कोर और स्वास्थ्य रिपोर्ट दिखाएं', isDefault: true },

  { id: 'ml-56', intent: 'nutrition', language: 'ar', phrase: 'شرب الماء الجفاف فيتامين ب12 ضغط الدم الغذاء الصحي لكبار السن', isDefault: true },
  { id: 'ml-57', intent: 'sleep', language: 'ar', phrase: 'استخدام الهاتف ليلاً التعب الصباحي جودة النوم النوم المريح', isDefault: true },
  { id: 'ml-58', intent: 'physical', language: 'ar', phrase: 'المشي الصباحي تمارين خفيفة لكبار السن التوازن عدد الخطوات', isDefault: true },
  { id: 'ml-59', intent: 'progress', language: 'ar', phrase: 'ملخص اليوم ونتائج التقييم والتقدم', isDefault: true },

  { id: 'ml-60', intent: 'nutrition', language: 'ta', phrase: 'தண்ணீர் குடிப்பது வைட்டமின் பி12 இரத்த அழுத்தம் உணவுப் பழக்கம்', isDefault: true },
  { id: 'ml-61', intent: 'sleep', language: 'ta', phrase: 'இரவு கைபேசி சோர்வு ஆழ்ந்த தூக்கம் காலை களைப்பு நல்ல தூக்கம்', isDefault: true },
  { id: 'ml-62', intent: 'physical', language: 'ta', phrase: 'காலை நடைப்பயிற்சி முதியோருக்கு எளிய உடற்பயிற்சி தினசரி படிகள்', isDefault: true },
  { id: 'ml-63', intent: 'progress', language: 'ta', phrase: 'இன்றைய மதிப்பெண் மற்றும் அறிக்கை காட்டு', isDefault: true },

  // Conversational Greetings & Assistant Help (5 Languages)
  { id: 'ml-64', intent: 'greeting', language: 'en', phrase: 'hi hello hey good morning afternoon evening namaste how are you help welcome', isDefault: true },
  { id: 'ml-65', intent: 'greeting', language: 'en', phrase: 'who are you what can you do talk speak voice assistant test', isDefault: true },
  { id: 'ml-66', intent: 'greeting', language: 'kn', phrase: 'ನಮಸ್ಕಾರ ಹಾಯ್ ಹಲೋ ಶುಭೋದಯ ಹೇಗಿದ್ದೀರಾ ಸಹಾಯ ಮಾಡಿ ಮಾತನಾಡಿ ನೀನು ಯಾರು', isDefault: true },
  { id: 'ml-67', intent: 'greeting', language: 'hi', phrase: 'नमस्ते हाय हेलो सुप्रभात कैसे हो मदद बात करो क्या कर सकते हो आप कौन हैं', isDefault: true },
  { id: 'ml-68', intent: 'greeting', language: 'ar', phrase: 'مرحبا أهلا السلام عليكم صباح الخير مساء الخير كيف حالك مساعدة تحدث من أنت', isDefault: true },
  { id: 'ml-69', intent: 'greeting', language: 'ta', phrase: 'வணக்கம் ஹாய் ஹலோ காலை வணக்கம் எப்படி இருக்கிறீர்கள் உதவி பேசு நீ யார்', isDefault: true },

  // Clinical Support & Doctor Consultations (5 Languages)
  { id: 'ml-70', intent: 'clinical', language: 'en', phrase: 'book doctor appointment neurologist clinic hospital near me online offline video consultation', isDefault: true },
  { id: 'ml-71', intent: 'clinical', language: 'en', phrase: 'find specialist doctor schedule visit share medical lab report consult', isDefault: true },
  { id: 'ml-72', intent: 'clinical', language: 'kn', phrase: 'ವೈದ್ಯರ ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್ ಬುಕ್ ಡಾಕ್ಟರ್ ಆಸ್ಪತ್ರೆ ಕ್ಲಿನಿಕ್ ಸಮಾಲೋಚನೆ', isDefault: true },
  { id: 'ml-73', intent: 'clinical', language: 'hi', phrase: 'डॉक्टर अपॉइंटमेंट बुक अस्पताल क्लिनिक न्यूरोलॉजिस्ट परामर्श मिलना', isDefault: true },
  { id: 'ml-74', intent: 'clinical', language: 'ar', phrase: 'حجز موعد طبيب دكتور عيادة مستشفى قريب استشارة فيديو', isDefault: true },
  { id: 'ml-75', intent: 'clinical', language: 'ta', phrase: 'மருத்துவர் சந்திப்பு பதிவு டாக்டர் கிளினிக் மருத்துவமனை ஆலோசனை', isDefault: true },

  // Romanized / Phonetic Keywords (for users who pick KN/HI/AR/TA and type with English keyboard)
  { id: 'ml-76', intent: 'memory', language: 'kn', phrase: 'nenapu nenapina shakti mareyuvudu yaaddasht ninaivu dhakira', isDefault: true },
  { id: 'ml-77', intent: 'sleep', language: 'kn', phrase: 'nidre nidde niddhe neend thookam thoonguvathu nawm raatri', isDefault: true },
  { id: 'ml-78', intent: 'physical', language: 'kn', phrase: 'vyayama nadige vyayam sair riyada udarpayirchi nadai walking', isDefault: true },
  { id: 'ml-79', intent: 'nutrition', language: 'kn', phrase: 'aahara oota neer neeru khana pani thanneer saapadu unavu taaam maa', isDefault: true },
  { id: 'ml-80', intent: 'clinical', language: 'kn', phrase: 'vaidyaru aaspatre dawakhana daktar maruthuvar tabeeb mustashfa', isDefault: true },
  { id: 'ml-81', intent: 'stress', language: 'hi', phrase: 'otthada chinta tanaav manashanti manazhutham tawattur qalaq', isDefault: true },
  { id: 'ml-82', intent: 'progress', language: 'hi', phrase: 'pragati varadi parinama report score mathippeedu taqreer natija', isDefault: true },
]

export function detectLanguageFromText(
  text: string,
  fallback: LanguageCode
): LanguageCode {
  if (/[\u0C80-\u0CFF]/.test(text)) return 'kn'
  if (/[\u0900-\u097F]/.test(text)) return 'hi'
  if (/[\u0600-\u06FF]/.test(text)) return 'ar'
  if (/[\u0B80-\u0BFF]/.test(text)) return 'ta'
  return fallback
}

// Generic domain words present across all wellness topics should not bias TF-IDF toward any single intent
const DOMAIN_STOPWORDS = new Set([
  'brain', 'health', 'wellness', 'mind', 'improve', 'tips', 'suggest', 'give', 'help', 'how', 'what', 'can', 'good',
  'ಮೆದುಳು', 'ಮೆದುಳಿನ', 'ಆರೋಗ್ಯ', 'ಆರೋಗ್ಯಕ್ಕೆ', 'ಆರೋಗ್ಯದ', 'ಸಲಹೆ', 'ಹೇಗೆ', 'ಏನು', 'ನೀಡಿ',
  'मस्तिष्क', 'दिमाग', 'स्वास्थ्य', 'कैसे', 'क्या', 'सुझाव', 'दें',
  'الدماغ', 'صحة', 'كيف', 'ما', 'لدعم',
  'மூளை', 'ஆரோக்கியம்', 'ஆரோக்கியத்திற்கும்', 'நலன்', 'நலனுக்கான', 'எவ்வாறு', 'என்ன',
])

function tokenizeWithNgrams(text: string): string[] {
  const cleaned = text.toLowerCase().trim()
  // Keep Unicode combining marks (\p{M}) & ZWNJ/ZWJ so Indic matras/viramas stay attached to words
  const words = cleaned.match(/[\p{L}\p{M}\p{N}\u200C\u200D]+/gu) ?? []
  const tokens: string[] = []
  for (const w of words) {
    if (DOMAIN_STOPWORDS.has(w)) continue
    tokens.push(w)
    if (w.length >= 3) {
      for (let i = 0; i <= w.length - 3; i++) {
        tokens.push(`~${w.slice(i, i + 3)}`)
      }
    }
  }
  return tokens
}

// High-precision multilingual topic signals to resolve ambiguity cleanly in all 5 languages + Romanized text
const TOPIC_SIGNALS: Array<{
  intent: Exclude<MLIntentId, 'custom'>
  patterns: RegExp[]
}> = [
  {
    intent: 'clinical',
    patterns: [
      /\b(doctor|clinic|hospital|neurologist|appointment|book|consult|specialist|visit)\b/i,
      /(ವೈದ್ಯ|ಡಾಕ್ಟರ್|ಆಸ್ಪತ್ರೆ|ಕ್ಲಿನಿಕ್|ಅಪಾಯಿಂಟ್|ಸಮಾಲೋಚ|vaidyaru)/,
      /(डॉक्टर|अस्पताल|क्लिनिक|अपॉइंटमेंट|परामर्श|न्यूरोलॉजिस्ट|मरीज)/,
      /(طبيب|دكتور|عيادة|مستشفى|موعد|حجز|استشارة|tabeeb)/,
      /(மருத்துவர்|மருத்துவமனை|கிளினிக்|சந்திப்பு|ஆலோசனை|டாக்டர்|maruthuvar)/,
    ],
  },
  {
    intent: 'sleep',
    patterns: [
      /\b(sleep|sleeping|insomnia|bedtime|night|nap|wake|tired|snore|nidre|nidde|neend|thookam|nawm)\b/i,
      /(ನಿದ್ರೆ|ನಿದ್ದೆ|ಮಲಗ|ರಾತ್ರಿ)/,
      /(नींद|सोना|अनिद्रा|बिस्तर|सोने)/,
      /(نوم|أرق|أنام|نعاس|ليلاً)/,
      /(தூக்கம்|தூங்க|உறக்கம்)/,
    ],
  },
  {
    intent: 'physical',
    patterns: [
      /\b(exercise|exercises|walk|walking|steps|yoga|stretch|aerobic|fitness|workout|gym|move|mobility|vyayama|nadige|vyayam|udarpayirchi|nadai|riyada)\b/i,
      /(ವ್ಯಾಯಾಮ|ನಡಿಗೆ|ನಡೆಯ|ಯೋಗ|ಸೂರ್ಯ|ಹೆಜ್ಜೆ|ಚಟುವಟಿಕೆ)/,
      /(व्यायाम|कसरत|टहल|सैर|योग|चलना|कदम)/,
      /(تمارين|رياضة|مشي|يوغا|خطوة|حركة|المشي)/,
      /(உடற்பயிற்சி|நடை|நடக்க|யோகா|படிகள்)/,
    ],
  },
  {
    intent: 'memory',
    patterns: [
      /\b(memory|remember|recall|forget|forgetting|forgetful|names|nenapu|yaaddasht|ninaivu|dhakira)\b/i,
      /(ನೆನಪು|ನೆನಪಿನ|ಮರೆ|ಜ್ಞಾಪಕ)/,
      /(याद|स्मृति|भूल|याददाश्त)/,
      /(ذاكر|تذكر|نسيان|أنسى)/,
      /(நினைவு|நினைவாற்றல்|மறதி|ஞாபகம்)/,
    ],
  },
  {
    intent: 'attention',
    patterns: [
      /\b(attention|focus|concentrate|concentration|distract|brain fog|alert)\b/i,
      /(ಏಕಾಗ್ರತ|ಗಮನ|ಚಂಚಲ)/,
      /(एकाग्रता|ध्यान|फोकस)/,
      /(تركيز|انتباه|تشتت)/,
      /(கவனம்|ஒருமுகப்படுத்து)/,
    ],
  },
  {
    intent: 'nutrition',
    patterns: [
      /\b(food|eat|eating|diet|nutrition|walnut|almond|fruit|vegetable|water|drink|hydration|vitamin|b12|bp|blood pressure|sugar|diabetes|aahara|oota|neeru|khana|pani|thanneer|unavu)\b/i,
      /(ಆಹಾರ|ಊಟ|ತಿನ್ನ|ಬಾದಾಮಿ|ವಾಲ್‌ನಟ್|ನೀರು|ಹಣ್ಣು|ರಕ್ತದೊತ್ತಡ|ವಿಟಮಿನ್)/,
      /(भोजन|खाना|आहार|पानी|बादाम|अखरोट|पोषण|फल|विटामिन)/,
      /(طعام|أكل|تغذية|غذاء|ماء|جوز|لوز|فيتامين|فواكه)/,
      /(உணவு|சாப்பாடு|சாப்பிட|தண்ணீர்|பாதாம்|வால்நட்|பழம்|வைட்டமின்)/,
    ],
  },
  {
    intent: 'stress',
    patterns: [
      /\b(stress|anxiety|anxious|worry|worried|tension|fear|calm|relax|breathe|breathing|pranayama|lonely|sad|otthada|tanaav|tawattur)\b/i,
      /(ಒತ್ತಡ|ಆತಂಕ|ಭಯ|ಪ್ರಾಣಾಯಾಮ|ವಿಶ್ರಾಂತಿ|ಶಾಂತಿ)/,
      /(तनाव|चिंता|घबराहट|प्राणायाम|आराम|बेचैनी)/,
      /(توتر|قلق|استرخاء|تنفس|هدوء|خوف)/,
      /(மன அழுத்தம்|பதற்றம்|கவலை|மூச்சு|அமைதி)/,
    ],
  },
  {
    intent: 'progress',
    patterns: [
      /\b(progress|report|score|scores|trend|trends|history|result|results|summary|baseline|analytics|pragati|varadi|taqreer)\b/i,
      /(ಪ್ರಗತಿ|ವರದಿ|ಅಂಕ|ಮೌಲ್ಯಮಾಪನ|ಫಲಿತಾಂಶ)/,
      /(प्रगति|रिपोर्ट|परिणाम|स्कोर|मूल्यांकन)/,
      /(تقدمي|تقرير|نتائج|تقييم|ملخص)/,
      /(முன்னேற்றம்|அறிக்கை|முடிவு|மதிப்பீடு|மதிப்பெண்)/,
    ],
  },
]

const SAFETY_REFUSAL_PATTERNS: RegExp[] = [
  /\b(diagnose|diagnosis|dementia|alzheimer|alzheimers|prescribe|prescription|medicine|medication|tablet|tablets|pill|pills|dose|dosage|drug|syrup|capsule|dizzy|dizziness|headache|fever|stroke|chest pain|numbness|vomiting)\b/i,
  /\b(dawai|goli|marunthu|maathre|aushadhi|chakkar|bukhar)\b/i,
  /(ರೋಗನಿರ್ಣಯ|ಡಿಮೆನ್ಶಿಯಾ|ಅಲ್ಜೈಮರ್|ಔಷಧ|ಮಾತ್ರೆ|ಗುಳಿಗೆ|ಬರೆದುಕೊಡಿ|ತಲೆತಿರುಗುವುದು|ತಲೆನೋವು|ಜ್ವರ|ಎದೆ ನೋವು)/,
  /(निदान|डिमेंशिया|अल्जाइमर|दवा|दवाई|गोली|टेबलेट|चक्कर|सिरदर्द|बुखार|सीने में दर्द)/,
  /(تشخيص|الخرف|الزهايمر|وصف دواء|دواء|أدوية|حبوب|دوخة|صداع|حمى|ألم الصدر)/,
  /(நோய் கண்டறி|டிமென்ஷியா|மருந்து|மாத்திரை|பரிந்துரை|தலைசுற்றல்|தலைவலி|காய்ச்சல்|நெஞ்சு வலி)/,
]

export interface MLClassificationResult {
  intent: MLIntentId
  confidence: number // 0 to 100
  matchedPhrase: string
  detectedLanguage: LanguageCode
  customAnswer?: string
}

export function classifyIntentWithTFIDF(
  query: string,
  samples: MLTrainingSample[],
  fallbackLang: LanguageCode
): MLClassificationResult {
  const detectedLanguage = detectLanguageFromText(query, fallbackLang)
  const trimmedQuery = query.trim()

  // 1. Standalone greetings & polite acknowledgements
  const normalizedWords =
    trimmedQuery.toLowerCase().match(/[\p{L}\p{M}\p{N}\u200C\u200D]+/gu) ?? []
  const exactGreetingWords = new Set([
    'hi', 'hello', 'hey', 'helo', 'hii', 'namaste', 'namaskara', 'vanakkam', 'salam', 'marhaba', 'ahlan',
    'ok', 'okay', 'thanks', 'thank', 'you', 'help', 'welcome',
    'ನಮಸ್ಕಾರ', 'ಹಾಯ್', 'ಹಲೋ', 'ಧನ್ಯವಾದ', 'ಸಹಾಯ',
    'नमस्ते', 'हाय', 'हेलो', 'धन्यवाद', 'शुक्रिया', 'मदद',
    'مرحبا', 'مرحباً', 'أهلا', 'أهلاً', 'شكرا', 'شكراً', 'السلام', 'مساعدة',
    'வணக்கம்', 'ஹாய்', 'ஹலோ', 'நன்றி', 'உதவி',
  ])
  if (
    normalizedWords.length === 0 ||
    (normalizedWords.length <= 2 && normalizedWords.every((w) => exactGreetingWords.has(w)))
  ) {
    return {
      intent: 'greeting',
      confidence: 92,
      matchedPhrase: trimmedQuery || 'general greeting',
      detectedLanguage,
    }
  }

  // Build TF-IDF vectors over current corpus
  const docs = samples.map((s) => ({
    sample: s,
    tokens: tokenizeWithNgrams(s.phrase),
  }))
  const queryTokens = tokenizeWithNgrams(trimmedQuery)

  const docCount = Math.max(1, docs.length)
  const df = new Map<string, number>()
  for (const doc of docs) {
    const unique = new Set(doc.tokens)
    for (const tok of unique) {
      df.set(tok, (df.get(tok) ?? 0) + 1)
    }
  }

  const toVector = (tokens: string[]) => {
    const tf = new Map<string, number>()
    for (const tok of tokens) {
      tf.set(tok, (tf.get(tok) ?? 0) + 1)
    }
    const vec = new Map<string, number>()
    for (const [tok, count] of tf.entries()) {
      const idf = Math.log((docCount + 1) / ((df.get(tok) ?? 0) + 1)) + 1
      vec.set(tok, count * idf)
    }
    return vec
  }

  const cosineSim = (a: Map<string, number>, b: Map<string, number>) => {
    let dot = 0
    let normA = 0
    let normB = 0
    for (const v of a.values()) normA += v * v
    for (const v of b.values()) normB += v * v
    for (const [k, v] of a.entries()) {
      const bv = b.get(k)
      if (bv) dot += v * bv
    }
    if (normA === 0 || normB === 0) return 0
    return dot / (Math.sqrt(normA) * Math.sqrt(normB))
  }

  const qVec = toVector(queryTokens)

  // 2. Custom user-trained samples get immediate priority when matched well
  let bestCustomScore = -1
  let bestCustomSample: MLTrainingSample | null = null
  for (const doc of docs) {
    if (doc.sample.isDefault) continue
    const sim = cosineSim(qVec, toVector(doc.tokens)) * 1.15
    if (sim > bestCustomScore) {
      bestCustomScore = sim
      bestCustomSample = doc.sample
    }
  }
  if (bestCustomSample && bestCustomScore >= 0.28) {
    return {
      intent: bestCustomSample.intent,
      confidence: Math.max(60, Math.min(98, Math.round(bestCustomScore * 115))),
      matchedPhrase: bestCustomSample.phrase,
      detectedLanguage,
      customAnswer: bestCustomSample.customAnswer,
    }
  }

  // 3. Medical safety guardrail never compromises
  if (SAFETY_REFUSAL_PATTERNS.some((rx) => rx.test(trimmedQuery))) {
    return {
      intent: 'safety_refusal',
      confidence: 95,
      matchedPhrase: trimmedQuery,
      detectedLanguage,
    }
  }

  // 4. Score TF-IDF + multilingual semantic topic signal boost
  const signalHits = new Map<MLIntentId, number>()
  for (const { intent, patterns } of TOPIC_SIGNALS) {
    let hits = 0
    for (const rx of patterns) {
      if (rx.test(trimmedQuery)) hits++
    }
    if (hits > 0) signalHits.set(intent, hits)
  }

  let bestScore = -1
  let bestSample: MLTrainingSample = samples[0]

  for (const doc of docs) {
    const dVec = toVector(doc.tokens)
    let sim = cosineSim(qVec, dVec)
    if (doc.sample.language === detectedLanguage) sim *= 1.08
    if (!doc.sample.isDefault) sim *= 1.15
    const hitCount = signalHits.get(doc.sample.intent) ?? 0
    if (hitCount > 0) {
      sim += 0.35 + Math.min(0.25, (hitCount - 1) * 0.12)
    }
    if (sim > bestScore) {
      bestScore = sim
      bestSample = doc.sample
    }
  }

  if (bestScore < 0.08) {
    return {
      intent: 'greeting',
      confidence: 58,
      matchedPhrase: 'general wellness greeting',
      detectedLanguage,
    }
  }

  const confidence = Math.max(
    45,
    Math.min(98, Math.round(bestScore * 105))
  )

  return {
    intent: bestSample.intent,
    confidence,
    matchedPhrase: bestSample.phrase,
    detectedLanguage,
    customAnswer: bestSample.customAnswer,
  }
}
