import { TRANSLATIONS } from '@/data/translations'
import { classifyIntentWithTFIDF } from '@/services/mlIntentEngine'
import type {
  AssessmentCategoryResult,
  CognitiveAssessmentSession,
  LanguageCode,
  NeuroCareState,
  ReportStatusLabel,
} from '@/types/neurocare'

export interface ComputedReportSummary {
  generatedAt: string
  latestAssessmentDate: string
  taskStatus: ReportStatusLabel
  sleepStatus: ReportStatusLabel
  lifestyleStatus: ReportStatusLabel
  functionalStatus: ReportStatusLabel
  familyContextStatus: ReportStatusLabel
  avgSleepHours7d: number
  avgSleepQuality7d: number
  avgSteps7d: number
  avgExerciseMins7d: number
  avgStress7d: number
  latestTaskPct: number | null
  previousTaskPct: number | null
  taskDeltaPct: number | null
  latestFunctionalPct: number | null
  areasRequiringAttention: string[]
  clinicalFollowUpSuggestions: string[]
  changeNarrative: string
}

export function formatAssessmentCategorySummary(
  cat: AssessmentCategoryResult,
  lang: LanguageCode
): string {
  const slips = Math.max(0, cat.maxScore - cat.rawScore)
  const avgMs = cat.avgReactionMs ?? 650

  const byLang: Record<LanguageCode, Record<AssessmentCategoryResult['categoryId'], string>> = {
    en: {
      memory: `${cat.rawScore}/${cat.maxScore} target words recalled accurately`,
      attention: `${cat.rawScore}/${cat.maxScore} Stroop trials accurate, avg ${avgMs}ms`,
      processing: `${cat.rawScore} symbol-digit matches in 20s`,
      language: `${cat.rawScore}/${cat.maxScore} semantic & verbal items accurate`,
      executive: `Alternating trail completed with ${slips} slip(s)`,
      functional: 'Self-reported independence across everyday planning & routines',
    },
    kn: {
      memory: `${cat.rawScore}/${cat.maxScore} ಗುರಿ ಪದಗಳು ನಿಖರವಾಗಿ ನೆನಪಿಸಲ್ಪಟ್ಟಿವೆ`,
      attention: `${cat.rawScore}/${cat.maxScore} ಸ್ಟ್ರೂಪ್ ಪ್ರಯತ್ನಗಳು ನಿಖರ, ಸರಾಸರಿ ${avgMs}ms`,
      processing: `20 ಸೆಕೆಂಡುಗಳಲ್ಲಿ ${cat.rawScore} ಚಿಹ್ನೆ-ಅಂಕಿ ಹೊಂದಾಣಿಕೆಗಳು`,
      language: `${cat.rawScore}/${cat.maxScore} ಭಾಷಾ ಮತ್ತು ಮೌಖಿಕ ಅಂಶಗಳು ನಿಖರ`,
      executive: `${slips} ತಪ್ಪುಗಳೊಂದಿಗೆ ಪರ್ಯಾಯ ಅನುಕ್ರಮ ಪೂರ್ಣಗೊಂಡಿದೆ`,
      functional: 'ದೈನಂದಿನ ಯೋಜನೆ ಮತ್ತು ದಿನಚರಿಗಳಲ್ಲಿ ಸ್ವಯಂ-ವರದಿ ಸ್ವಾತಂತ್ರ್ಯ',
    },
    hi: {
      memory: `${cat.rawScore}/${cat.maxScore} लक्ष्य शब्द सटीक रूप से याद किए गए`,
      attention: `${cat.rawScore}/${cat.maxScore} स्ट्रूप प्रयास सटीक, औसत ${avgMs}ms`,
      processing: `20 सेकंड में ${cat.rawScore} प्रतीक-अंक मिलान`,
      language: `${cat.rawScore}/${cat.maxScore} भाषायी एवं शब्द प्रश्न सटीक`,
      executive: `${slips} चूक के साथ वैकल्पिक क्रम पूरा हुआ`,
      functional: 'दैनिक योजना और दिनचर्या में स्व-रिपोर्ट स्वतंत्रता',
    },
    ar: {
      memory: `تم تذكر ${cat.rawScore}/${cat.maxScore} من الكلمات المستهدفة بدقة`,
      attention: `${cat.rawScore}/${cat.maxScore} محاولات ستروب دقيقة، المتوسط ${avgMs} مللي ثانية`,
      processing: `${cat.rawScore} مطابقة رمز-رقم خلال 20 ثانية`,
      language: `${cat.rawScore}/${cat.maxScore} عناصر لغوية ودلالية دقيقة`,
      executive: `اكتمل المسار المتناوب مع ${slips} خطأ`,
      functional: 'الاستقلالية المُبلَّغ عنها ذاتياً في التخطيط والروتين اليومي',
    },
    ta: {
      memory: `${cat.rawScore}/${cat.maxScore} இலக்குச் சொற்கள் துல்லியமாக நினைவுகூரப்பட்டன`,
      attention: `${cat.rawScore}/${cat.maxScore} ஸ்ட்ரூப் முயற்சிகள் சரி, சராசரி ${avgMs}ms`,
      processing: `20 வினாடிகளில் ${cat.rawScore} குறியீடு-எண் பொருத்தங்கள்`,
      language: `${cat.rawScore}/${cat.maxScore} மொழி மற்றும் சொல் கேள்விகள் சரி`,
      executive: `${slips} தவறுகளுடன் மாற்று வரிசை முடிக்கப்பட்டது`,
      functional: 'அன்றாட திட்டமிடல் மற்றும் வழக்கங்களில் சுய-அறிக்கை சுதந்திரம்',
    },
  }

  return byLang[lang]?.[cat.categoryId] ?? byLang.en[cat.categoryId]
}

export function computeBrainHealthReport(state: NeuroCareState): ComputedReportSummary {
  const lang = state.user.preferredLanguage ?? 'en'
  const t = TRANSLATIONS[lang] ?? TRANSLATIONS.en

  const sortedAssessments = [...state.assessments].sort((a, b) =>
    b.completedAt.localeCompare(a.completedAt)
  )
  const latest = sortedAssessments[0]
  const prev = sortedAssessments[1]

  const recentSleep = [...state.sleepLogs]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 7)
  const avgSleepHours7d = recentSleep.length
    ? Number(
        (
          recentSleep.reduce((sum, s) => sum + s.durationHours, 0) /
          recentSleep.length
        ).toFixed(1)
      )
    : 0
  const avgSleepQuality7d = recentSleep.length
    ? Number(
        (
          recentSleep.reduce((sum, s) => sum + s.qualityRating, 0) /
          recentSleep.length
        ).toFixed(1)
      )
    : 0

  const recentLifestyle = [...state.lifestyleLogs]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 7)
  const avgSteps7d = recentLifestyle.length
    ? Math.round(
        recentLifestyle.reduce((sum, l) => sum + l.walkingSteps, 0) /
          recentLifestyle.length
      )
    : 0
  const avgExerciseMins7d = recentLifestyle.length
    ? Math.round(
        recentLifestyle.reduce((sum, l) => sum + l.exerciseMinutes, 0) /
          recentLifestyle.length
      )
    : 0
  const avgStress7d = recentLifestyle.length
    ? Number(
        (
          recentLifestyle.reduce((sum, l) => sum + l.stressLevel, 0) /
          recentLifestyle.length
        ).toFixed(1)
      )
    : 0

  const latestTaskPct = latest ? latest.taskPerformancePct : null
  const previousTaskPct = prev ? prev.taskPerformancePct : null
  const taskDeltaPct =
    latestTaskPct !== null && previousTaskPct !== null
      ? latestTaskPct - previousTaskPct
      : null

  let taskStatus: ReportStatusLabel = 'Insufficient information'
  if (latestTaskPct !== null) {
    if (taskDeltaPct === null) {
      taskStatus = latestTaskPct >= 75 ? 'Stable' : 'Needs attention'
    } else if (latestTaskPct < 70 || taskDeltaPct <= -10) {
      taskStatus = 'Needs attention'
    } else if (Math.abs(taskDeltaPct) >= 6) {
      taskStatus = 'Changed'
    } else {
      taskStatus = 'Stable'
    }
  }

  let sleepStatus: ReportStatusLabel = 'Insufficient information'
  if (recentSleep.length >= 3) {
    if (avgSleepHours7d < 6.5 || avgSleepQuality7d < 3.0) {
      sleepStatus = 'Needs attention'
    } else if (avgSleepHours7d >= 7.0 && avgSleepQuality7d >= 3.7) {
      sleepStatus = 'Stable'
    } else {
      sleepStatus = 'Changed'
    }
  }

  let lifestyleStatus: ReportStatusLabel = 'Insufficient information'
  if (recentLifestyle.length >= 3) {
    if (avgSteps7d < 5000 || avgStress7d >= 4.0) {
      lifestyleStatus = 'Needs attention'
    } else if (avgSteps7d >= 7000 && avgStress7d <= 3.0) {
      lifestyleStatus = 'Stable'
    } else {
      lifestyleStatus = 'Changed'
    }
  }

  const latestFunctionalPct = latest ? latest.functionalQuestionnairePct : null
  let functionalStatus: ReportStatusLabel = 'Insufficient information'
  if (latestFunctionalPct !== null) {
    functionalStatus =
      latestFunctionalPct >= 85
        ? 'Stable'
        : latestFunctionalPct >= 70
          ? 'Changed'
          : 'Needs attention'
  }

  const familyContextStatus: ReportStatusLabel =
    state.familyHistory.length > 0 ? 'Stable' : 'Insufficient information'

  const reportStrings: Record<
    LanguageCode,
    {
      lowSleep: (hrs: number) => string
      highStress: (st: number) => string
      lowSteps: (steps: number) => string
      taskDip: string
      noFlags: string
      clinicalBase1: string
      clinicalBase2: string
      clinicalCardio: string
      needTwoAssessments: string
      narrativePair: (
        prevDate: string,
        latestDate: string,
        dirText: string,
        prevPct: number,
        latestPct: number,
        funcPct: number
      ) => string
      dirImproved: (d: number) => string
      dirShifted: (d: number) => string
      dirUnchanged: string
      narrativeSingle: (date: string, taskPct: number, funcPct: number) => string
    }
  > = {
    en: {
      lowSleep: (hrs) =>
        `7-day sleep average (${hrs} hrs) is below 6.5 hrs — short or fragmented sleep commonly reduces attention and recall accuracy.`,
      highStress: (st) =>
        `Elevated recent self-reported stress (${st}/5) may temporarily affect processing speed and concentration.`,
      lowSteps: (steps) =>
        `Average daily walking (${steps.toLocaleString()} steps) has room to rise toward 7,500–8,500 steps for vascular brain support.`,
      taskDip:
        'Recent task accuracy dipped compared to your prior baseline. Repeat a morning check-in after adequate rest before drawing conclusions.',
      noFlags:
        'No urgent lifestyle or task pattern flags detected in current logs. Continue tracking consistently across rested mornings.',
      clinicalBase1:
        'Share longitudinal sleep, blood pressure, and functional questionnaire trends during routine annual preventive visits.',
      clinicalBase2:
        'If you or close family members notice persistent, progressive difficulties in daily tasks (managing medications, bills, or familiar routes), schedule an evaluation with a licensed neurologist or primary physician.',
      clinicalCardio:
        'Given documented family history of cardiometabolic conditions, keep routine HbA1c, lipid profile, blood pressure, Vitamin B12, and thyroid screenings current.',
      needTwoAssessments:
        'Complete at least two cognitive assessments on separate days to observe baseline comparisons.',
      narrativePair: (prevDate, latestDate, dirText, prevPct, latestPct, funcPct) =>
        `Between ${prevDate} and ${latestDate}, objective cognitive task accuracy ${dirText} (${prevPct}% → ${latestPct}%), while self-reported daily functioning is ${funcPct}%. Note: Normal day-to-day variations often reflect sleep duration, stress, time of day, or repeated-testing familiarity rather than clinical change.`,
      dirImproved: (d) => `improved by +${d}%`,
      dirShifted: (d) => `shifted by ${d}%`,
      dirUnchanged: 'remained unchanged',
      narrativeSingle: (date, taskPct, funcPct) =>
        `Baseline recorded on ${date} with ${taskPct}% task accuracy across domains A–E and ${funcPct}% self-reported daily functional confidence.`,
    },
    kn: {
      lowSleep: (hrs) =>
        `7 ದಿನಗಳ ನಿದ್ರೆಯ ಸರಾಸರಿ (${hrs} ಗಂಟೆ) 6.5 ಗಂಟೆಗಿಂತ ಕಡಿಮೆಯಿದೆ — ಕಡಿಮೆ ಅಥವಾ ತುಂಡರಿಸಿದ ನಿದ್ರೆ ಸಾಮಾನ್ಯವಾಗಿ ಗಮನ ಮತ್ತು ನೆನಪಿನ ನಿಖರತೆಯನ್ನು ಕಡಿಮೆ ಮಾಡುತ್ತದೆ.`,
      highStress: (st) =>
        `ಇತ್ತೀಚಿನ ಸ್ವಯಂ-ವರದಿ ಮಾಡಿದ ಒತ್ತಡ (${st}/5) ಹೆಚ್ಚಾಗಿರುವುದರಿಂದ ಪ್ರಕ್ರಿಯೆಯ ವೇಗ ಮತ್ತು ಏಕಾಗ್ರತೆಗೆ ತಾತ್ಕಾಲಿಕವಾಗಿ ಪರಿಣಾಮ ಬೀರಬಹುದು.`,
      lowSteps: (steps) =>
        `ದೈನಂದಿನ ಸರಾಸರಿ ನಡಿಗೆ (${steps.toLocaleString()} ಹೆಜ್ಜೆಗಳು) ರಕ್ತನಾಳಗಳ ಮೆದುಳಿನ ಬೆಂಬಲಕ್ಕಾಗಿ 7,500–8,500 ಹೆಜ್ಜೆಗಳತ್ತ ಹೆಚ್ಚಿಸಬಹುದು.`,
      taskDip:
        'ಹಿಂದಿನ ಮೂಲಮಟ್ಟಕ್ಕೆ ಹೋಲಿಸಿದರೆ ಇತ್ತೀಚಿನ ಕಾರ್ಯ ನಿಖರತೆ ಸ್ವಲ್ಪ ಕಡಿಮೆಯಾಗಿದೆ. ತೀರ್ಮಾನಕ್ಕೆ ಬರುವ ಮೊದಲು ವಿಶ್ರಾಂತಿ ಪಡೆದ ಬೆಳಿಗ್ಗೆ ಮತ್ತೆ ಪರಿಶೀಲಿಸಿ.',
      noFlags:
        'ಪ್ರಸ್ತುತ ದಾಖಲೆಗಳಲ್ಲಿ ಯಾವುದೇ ತುರ್ತು ಜೀವನಶೈಲಿ ಅಥವಾ ಕಾರ್ಯ ಮಾದರಿ ಎಚ್ಚರಿಕೆಗಳಿಲ್ಲ. ವಿಶ್ರಾಂತಿ ಪಡೆದ ಬೆಳಿಗ್ಗೆ ನಿಯಮಿತವಾಗಿ ಟ್ರ್ಯಾಕ್ ಮಾಡಿ.',
      clinicalBase1:
        'ವಾರ್ಷಿಕ ತಡೆಗಟ್ಟುವ ಆರೋಗ್ಯ ಭೇಟಿಗಳ ಸಮಯದಲ್ಲಿ ದೀರ್ಘಾವಧಿಯ ನಿದ್ರೆ, ರಕ್ತದೊತ್ತಡ ಮತ್ತು ದೈನಂದಿನ ಕಾರ್ಯಕ್ಷಮತೆಯ ಪ್ರವೃತ್ತಿಗಳನ್ನು ಹಂಚಿಕೊಳ್ಳಿ.',
      clinicalBase2:
        'ನೀವು ಅಥವಾ ಕುಟುಂಬದವರು ದೈನಂದಿನ ಕೆಲಸಗಳಲ್ಲಿ (ಔಷಧಿ, ಬಿಲ್, ಪರಿಚಿತ ದಾರಿಗಳು) ನಿರಂತರ ತೊಂದರೆ ಗಮನಿಸಿದರೆ ಪರವಾನಗಿ ಪಡೆದ ನರವಿಜ್ಞಾನಿ ಅಥವಾ ವೈದ್ಯರನ್ನು ಭೇಟಿ ಮಾಡಿ.',
      clinicalCardio:
        'ಕುಟುಂಬದ ಹೃದಯ-ಚಯಾಪಚಯ ಇತಿಹಾಸವನ್ನು ಗಮನದಲ್ಲಿಟ್ಟುಕೊಂಡು HbA1c, ಲಿಪಿಡ್ ಪ್ರೊಫೈಲ್, ರಕ್ತದೊತ್ತಡ, ವಿಟಮಿನ್ B12 ಮತ್ತು ಥೈರಾಯ್ಡ್ ತಪಾಸಣೆಯನ್ನು ನಿಯಮಿತವಾಗಿ ಮಾಡಿ.',
      needTwoAssessments:
        'ಮೂಲಮಟ್ಟದ ಹೋಲಿಕೆಗಳನ್ನು ನೋಡಲು ಬೇರೆ ಬೇರೆ ದಿನಗಳಲ್ಲಿ ಕನಿಷ್ಠ ಎರಡು ಅರಿವಿನ ಮೌಲ್ಯಮಾಪನಗಳನ್ನು ಪೂರ್ಣಗೊಳಿಸಿ.',
      narrativePair: (prevDate, latestDate, dirText, prevPct, latestPct, funcPct) =>
        `${prevDate} ಮತ್ತು ${latestDate} ನಡುವೆ, ವಸ್ತುನಿಷ್ಠ ಅರಿವಿನ ಕಾರ್ಯ ನಿಖರತೆ ${dirText} (${prevPct}% → ${latestPct}%), ಮತ್ತು ಸ್ವಯಂ-ವರದಿ ದೈನಂದಿನ ಕಾರ್ಯಕ್ಷಮತೆ ${funcPct}% ಆಗಿದೆ. ಗಮನಿಸಿ: ದಿನನಿತ್ಯದ ಸಣ್ಣ ಬದಲಾವಣೆಗಳು ನಿದ್ರೆ, ಒತ್ತಡ ಅಥವಾ ಪರೀಕ್ಷೆಯ ಪರಿಚಯವನ್ನು ಪ್ರತಿಬಿಂಬಿಸಬಹುದು.`,
      dirImproved: (d) => `+${d}% ಸುಧಾರಿಸಿದೆ`,
      dirShifted: (d) => `${d}% ಬದಲಾಗಿದೆ`,
      dirUnchanged: 'ಸ್ಥಿರವಾಗಿ ಉಳಿದಿದೆ',
      narrativeSingle: (date, taskPct, funcPct) =>
        `${date} ರಂದು A–E ಕ್ಷೇತ್ರಗಳಲ್ಲಿ ${taskPct}% ಕಾರ್ಯ ನಿಖರತೆ ಮತ್ತು ${funcPct}% ಸ್ವಯಂ-ವರದಿ ದೈನಂದಿನ ಕಾರ್ಯ ವಿಶ್ವಾಸದೊಂದಿಗೆ ಮೂಲಮಟ್ಟ ದಾಖಲಾಗಿದೆ.`,
    },
    hi: {
      lowSleep: (hrs) =>
        `7-दिन का नींद औसत (${hrs} घंटे) 6.5 घंटे से कम है — कम या खंडित नींद अक्सर ध्यान और स्मृति सटीकता को कम करती है।`,
      highStress: (st) =>
        `हाल ही में दर्ज उच्च तनाव (${st}/5) अस्थायी रूप से प्रोसेसिंग गति और एकाग्रता को प्रभावित कर सकता है।`,
      lowSteps: (steps) =>
        `दैनिक चलने का औसत (${steps.toLocaleString()} कदम) मस्तिष्क रक्त प्रवाह के लिए 7,500–8,500 कदम तक बढ़ाया जा सकता है।`,
      taskDip:
        'पिछले बेसलाइन की तुलना में हालिया कार्य सटीकता थोड़ी कम हुई है। किसी निष्कर्ष से पहले पूरी नींद के बाद सुबह फिर से जांच करें।',
      noFlags:
        'वर्तमान लॉग में कोई तात्कालिक जीवनशैली या कार्य चेतावनी नहीं दिखी। आराम भरी सुबह नियमित रूप से ट्रैक करते रहें।',
      clinicalBase1:
        'नियमित वार्षिक निवारक जांच के दौरान अपनी नींद, रक्तचाप और दैनिक कार्य प्रश्नावली के रुझान साझा करें।',
      clinicalBase2:
        'यदि आप या परिवार दैनिक कार्यों (दवाइयां, बिल या परिचित रास्ते) में लगातार बढ़ती कठिनाई देखते हैं, तो योग्य न्यूरोलॉजिस्ट या डॉक्टर से परामर्श लें।',
      clinicalCardio:
        'परिवार में कार्डियोमेटाबोलिक इतिहास को देखते हुए HbA1c, लिपिड प्रोफाइल, रक्तचाप, विटामिन B12 और थायरॉइड जांच नियमित रखें।',
      needTwoAssessments:
        'बेसलाइन तुलना देखने के लिए अलग-अलग दिनों में कम से कम दो संज्ञानात्मक मूल्यांकन पूरे करें।',
      narrativePair: (prevDate, latestDate, dirText, prevPct, latestPct, funcPct) =>
        `${prevDate} और ${latestDate} के बीच, वस्तुनिष्ठ संज्ञानात्मक कार्य सटीकता ${dirText} (${prevPct}% → ${latestPct}%), जबकि स्व-रिपोर्ट दैनिक कार्यक्षमता ${funcPct}% है। नोट: सामान्य उतार-चढ़ाव अक्सर नींद, तनाव या अभ्यास से परिचित होने के कारण होते हैं।`,
      dirImproved: (d) => `+${d}% बेहतर हुई`,
      dirShifted: (d) => `${d}% बदली`,
      dirUnchanged: 'समान रही',
      narrativeSingle: (date, taskPct, funcPct) =>
        `${date} को डोमेन A–E में ${taskPct}% कार्य सटीकता और ${funcPct}% स्व-रिपोर्ट दैनिक कार्य आत्मविश्वास के साथ बेसलाइन दर्ज हुआ।`,
    },
    ar: {
      lowSleep: (hrs) =>
        `متوسط النوم لمدة 7 أيام (${hrs} ساعة) أقل من 6.5 ساعات — غالباً ما يقلل النوم القصير أو المتقطع من دقة الانتباه والتذكر.`,
      highStress: (st) =>
        `ارتفاع التوتر المُبلَّغ عنه مؤخراً (${st}/5) قد يؤثر مؤقتاً على سرعة المعالجة والتركيز.`,
      lowSteps: (steps) =>
        `متوسط المشي اليومي (${steps.toLocaleString()} خطوة) يمكن رفعه نحو 7,500–8,500 خطوة لدعم صحة أوعية الدماغ.`,
      taskDip:
        'انخفضت دقة المهام الأخيرة مقارنة بالخط الأساسي السابق. أعد الفحص صباحاً بعد راحة كافية قبل استخلاص النتائج.',
      noFlags:
        'لا توجد مؤشرات نمط حياة أو مهام عاجلة في السجلات الحالية. واصل التتبع بانتظام في صباحات مريحة.',
      clinicalBase1:
        'شارك اتجاهات النوم وضغط الدم واستبيان الوظائف اليومية خلال الزيارات الوقائية السنوية.',
      clinicalBase2:
        'إذا لاحظت أنت أو أسرتك صعوبات مستمرة ومتزايدة في المهام اليومية (الأدوية أو الفواتير أو الطرق المألوفة)، حدد موعداً مع طبيب أعصاب مختص.',
      clinicalCardio:
        'نظراً للتاريخ العائلي المسجل للحالات القلبية الأيضية، حافظ على فحوصات HbA1c والدهون وضغط الدم وفيتامين B12 والغدة الدرقية بانتظام.',
      needTwoAssessments:
        'أكمل تقييمين إدراكيين على الأقل في يومين منفصلين لملاحظة مقارنات الخط الأساسي.',
      narrativePair: (prevDate, latestDate, dirText, prevPct, latestPct, funcPct) =>
        `بين ${prevDate} و${latestDate}، دقة المهام الإدراكية الموضوعية ${dirText} (${prevPct}% ← ${latestPct}%)، بينما بلغت الوظائف اليومية المُبلَّغ عنها ذاتياً ${funcPct}%. ملاحظة: التغيرات اليومية الطبيعية تعكس غالباً مدة النوم أو التوتر أو التعود على الاختبار.`,
      dirImproved: (d) => `تحسنت بمقدار +${d}%`,
      dirShifted: (d) => `تغيرت بمقدار ${d}%`,
      dirUnchanged: 'بقيت دون تغيير',
      narrativeSingle: (date, taskPct, funcPct) =>
        `تم تسجيل الخط الأساسي بتاريخ ${date} بدقة مهام ${taskPct}% عبر المجالات A–E وثقة وظيفية يومية ${funcPct}%.`,
    },
    ta: {
      lowSleep: (hrs) =>
        `7-நாள் தூக்க சராசரி (${hrs} மணி) 6.5 மணி நேரத்திற்குக் குறைவாக உள்ளது — குறைந்த அல்லது துண்டிக்கப்பட்ட தூக்கம் கவனத்தையும் நினைவுத் துல்லியத்தையும் குறைக்கலாம்.`,
      highStress: (st) =>
        `சமீபத்திய மன அழுத்த மதிப்பீடு (${st}/5) அதிகமாக இருப்பதால் செயல்பாட்டு வேகம் மற்றும் கவனத்தைத் தற்காலிகமாகப் பாதிக்கலாம்.`,
      lowSteps: (steps) =>
        `தினசரி நடை சராசரி (${steps.toLocaleString()} படிகள்) மூளை இரத்த ஓட்ட ஆதரவுக்கு 7,500–8,500 படிகளாக உயர்த்த இடமுள்ளது.`,
      taskDip:
        'முந்தைய அடிப்படை நிலையை விட சமீபத்திய பணி துல்லியம் சற்று குறைந்துள்ளது. நன்கு ஓய்வெடுத்த காலையில் மீண்டும் பரிசோதிக்கவும்.',
      noFlags:
        'தற்போதைய பதிவுகளில் அவசர வாழ்க்கை முறை அல்லது பணி எச்சரிக்கைகள் எதுவும் இல்லை. ஓய்வெடுத்த காலை நேரங்களில் தொடர்ந்து கண்காணிக்கவும்.',
      clinicalBase1:
        'வருடாந்திர தடுப்பு மருத்துவச் சந்திப்புகளின் போது நீண்டகால தூக்கம், இரத்த அழுத்தம் மற்றும் அன்றாடச் செயல்பாட்டுப் போக்குகளைப் பகிரவும்.',
      clinicalBase2:
        'அன்றாடப் பணிகளில் (மருந்துகள், பில்கள், பழக்கமான வழிகள்) தொடர்ச்சியான சிரமத்தை நீங்களோ குடும்பத்தினரோ கண்டால், தகுதிவாய்ந்த நரம்பியல் மருத்துவரை அணுகவும்.',
      clinicalCardio:
        'குடும்பத்தில் இதய-வளர்சிதை மாற்ற வரலாறு உள்ளதால் HbA1c, கொழுப்பு, இரத்த அழுத்தம், வைட்டமின் B12 மற்றும் தைராய்டு பரிசோதனைகளைத் தொடர்ந்து செய்யவும்.',
      needTwoAssessments:
        'அடிப்படை ஒப்பீடுகளைக் காண வெவ்வேறு நாட்களில் குறைந்தது இரண்டு அறிவாற்றல் மதிப்பீடுகளையாவது முடிக்கவும்.',
      narrativePair: (prevDate, latestDate, dirText, prevPct, latestPct, funcPct) =>
        `${prevDate} மற்றும் ${latestDate} இடையே, அறிவாற்றல் பணி துல்லியம் ${dirText} (${prevPct}% → ${latestPct}%), மேலும் சுய-அறிக்கை அன்றாடச் செயல்பாடு ${funcPct}% ஆகும். குறிப்பு: அன்றாட மாற்றங்கள் தூக்கம், மன அழுத்தம் அல்லது பயிற்சிப் பழக்கத்தைப் பிரதிபலிக்கலாம்.`,
      dirImproved: (d) => `+${d}% மேம்பட்டுள்ளது`,
      dirShifted: (d) => `${d}% மாறியுள்ளது`,
      dirUnchanged: 'மாற்றமின்றி உள்ளது',
      narrativeSingle: (date, taskPct, funcPct) =>
        `${date} அன்று A–E பிரிவுகளில் ${taskPct}% பணி துல்லியத்துடனும் ${funcPct}% சுய-அறிக்கை அன்றாட நம்பிக்கையுடனும் அடிப்படை பதிவு செய்யப்பட்டது.`,
    },
  }

  const rs = reportStrings[lang] ?? reportStrings.en

  const areasRequiringAttention: string[] = []
  if (sleepStatus === 'Needs attention') {
    areasRequiringAttention.push(rs.lowSleep(avgSleepHours7d))
  }
  if (avgStress7d >= 3.5) {
    areasRequiringAttention.push(rs.highStress(avgStress7d))
  }
  if (avgSteps7d > 0 && avgSteps7d < 6500) {
    areasRequiringAttention.push(rs.lowSteps(avgSteps7d))
  }
  if (taskStatus === 'Needs attention') {
    areasRequiringAttention.push(rs.taskDip)
  }
  if (areasRequiringAttention.length === 0) {
    areasRequiringAttention.push(rs.noFlags)
  }

  const clinicalFollowUpSuggestions: string[] = [rs.clinicalBase1, rs.clinicalBase2]
  if (state.familyHistory.some((f) => f.condition === 'Hypertension' || f.condition === 'Diabetes')) {
    clinicalFollowUpSuggestions.push(rs.clinicalCardio)
  }

  let changeNarrative = rs.needTwoAssessments
  if (latest && prev && taskDeltaPct !== null) {
    const dirText =
      taskDeltaPct > 0
        ? rs.dirImproved(taskDeltaPct)
        : taskDeltaPct < 0
          ? rs.dirShifted(taskDeltaPct)
          : rs.dirUnchanged
    changeNarrative = rs.narrativePair(
      prev.date,
      latest.date,
      dirText,
      prev.taskPerformancePct,
      latest.taskPerformancePct,
      latest.functionalQuestionnairePct
    )
  } else if (latest) {
    changeNarrative = rs.narrativeSingle(
      latest.date,
      latest.taskPerformancePct,
      latest.functionalQuestionnairePct
    )
  }

  return {
    generatedAt: new Date().toLocaleString(t.speechLocale),
    latestAssessmentDate: latest?.date ?? t.dashboard.noSessionYet,
    taskStatus,
    sleepStatus,
    lifestyleStatus,
    functionalStatus,
    familyContextStatus,
    avgSleepHours7d,
    avgSleepQuality7d,
    avgSteps7d,
    avgExerciseMins7d,
    avgStress7d,
    latestTaskPct,
    previousTaskPct,
    taskDeltaPct,
    latestFunctionalPct,
    areasRequiringAttention,
    clinicalFollowUpSuggestions,
    changeNarrative,
  }
}

export interface BrainPhysicalSuggestion {
  id: string
  pillar: 'Physical Activity' | 'Brain Exercise' | 'Sleep & Recovery' | 'Nutrition & Hydration'
  pillarLabel: string
  title: string
  duration: string
  actionPlan: string
  whySuggested: string
}

export function generateBrainAndPhysicalPlan(
  state: NeuroCareState,
  session?: CognitiveAssessmentSession
): BrainPhysicalSuggestion[] {
  const lang = state.user.preferredLanguage ?? 'en'
  const report = computeBrainHealthReport(state)
  const targetSession =
    session ??
    [...state.assessments].sort((a, b) => b.completedAt.localeCompare(a.completedAt))[0]

  const memoryPct =
    targetSession?.categories.find((c) => c.categoryId === 'memory')?.accuracyPct ?? 85
  const attentionPct =
    targetSession?.categories.find((c) => c.categoryId === 'attention')?.accuracyPct ?? 85
  const execPct =
    targetSession?.categories.find((c) => c.categoryId === 'executive')?.accuracyPct ?? 85

  const pillarsByLang: Record<LanguageCode, Record<BrainPhysicalSuggestion['pillar'], string>> = {
    en: {
      'Physical Activity': 'Physical Activity',
      'Brain Exercise': 'Brain Exercise',
      'Sleep & Recovery': 'Sleep & Recovery',
      'Nutrition & Hydration': 'Nutrition & Hydration',
    },
    kn: {
      'Physical Activity': 'ದೈಹಿಕ ಚಟುವಟಿಕೆ',
      'Brain Exercise': 'ಮೆದುಳಿನ ವ್ಯಾಯಾಮ',
      'Sleep & Recovery': 'ನಿದ್ರೆ ಮತ್ತು ಚೇತರಿಕೆ',
      'Nutrition & Hydration': 'ಪೋಷಣೆ ಮತ್ತು ಜಲಸಂಚಯನ',
    },
    hi: {
      'Physical Activity': 'शारीरिक गतिविधि',
      'Brain Exercise': 'मस्तिष्क अभ्यास',
      'Sleep & Recovery': 'नींद और विश्राम',
      'Nutrition & Hydration': 'पोषण और जलयोजन',
    },
    ar: {
      'Physical Activity': 'النشاط البدني',
      'Brain Exercise': 'تمرين الدماغ',
      'Sleep & Recovery': 'النوم والتعافي',
      'Nutrition & Hydration': 'التغذية والترطيب',
    },
    ta: {
      'Physical Activity': 'உடல் செயல்பாடு',
      'Brain Exercise': 'மூளைப் பயிற்சி',
      'Sleep & Recovery': 'தூக்கம் & மீட்பு',
      'Nutrition & Hydration': 'உணவு & நீர்ச்சத்து',
    },
  }

  const pLabels = pillarsByLang[lang] ?? pillarsByLang.en
  const lowSteps = report.avgSteps7d < 7000
  const stressOrAttn = report.avgStress7d >= 3 || attentionPct < 85

  const localizedPlan: Record<LanguageCode, Omit<BrainPhysicalSuggestion, 'pillar' | 'pillarLabel'>[]> = {
    en: [
      {
        id: 'bp-1',
        title: lowSteps
          ? 'Brisk 30-Minute Morning Walk (Vascular Boost)'
          : 'Dual-Task Brisk Walk + Coordination Routine',
        duration: '30 mins / day',
        actionPlan: lowSteps
          ? `Aim to lift your 7-day average (${report.avgSteps7d.toLocaleString()} steps) toward 8,000 steps with two 15-minute brisk walks after meals.`
          : 'Maintain your strong step routine and add 5 minutes of heel-to-toe balance or arm-swing coordination drills to engage cerebellum & motor networks.',
        whySuggested:
          'Aerobic physical exercise stimulates cerebral blood flow and neurotrophic factors supporting memory encoding and processing speed.',
      },
      {
        id: 'bp-2',
        title: stressOrAttn
          ? 'Surya Namaskar + Anulom Vilom Breathwork'
          : 'Resistance & Mobility Stretching Circuit',
        duration: '15 mins',
        actionPlan: stressOrAttn
          ? 'Perform 6 slow rounds of Surya Namaskar followed by 5 minutes of alternate-nostril breathing (Anulom Vilom) before deep focus work.'
          : 'Add gentle bodyweight squats, wall pushups, and thoracic spine mobility twice weekly to sustain metabolic and posture health.',
        whySuggested:
          attentionPct < 85
            ? 'Your attention score can benefit from calming autonomic arousal before focused tasks.'
            : 'Strength and mobility training complement aerobic walking for healthy blood pressure and glucose regulation.',
      },
      memoryPct < 85
        ? {
            id: 'bp-3',
            title: 'Spaced Word & Visual Association Practice',
            duration: '10 mins · 3x/week',
            actionPlan:
              'Play Word Recall or Image Recall in Memory Games, and group new names/lists into vivid mental stories to strengthen recall pathways.',
            whySuggested: `Memory domain recorded ${memoryPct}% — active spaced recall builds stronger encoding strategies.`,
          }
        : execPct < 85
          ? {
              id: 'bp-3',
              title: 'Task-Switching & Pattern Matrix Challenge',
              duration: '10 mins · 3x/week',
              actionPlan:
                'Practice Pattern Recognition Matrix and try cooking a new recipe or solving alternating number-letter puzzles without multitasking.',
              whySuggested: `Executive switching recorded ${execPct}% — structured novelty helps exercise cognitive flexibility.`,
            }
          : {
              id: 'bp-3',
              title: 'Novel Skill & Bilingual Reading Reserve',
              duration: '15 mins / day',
              actionPlan:
                'Keep your strong cognitive baseline sharp by learning a new musical rhythm, language phrase, or strategy game in a distraction-free window.',
              whySuggested: 'Novel mental engagement sustains cognitive reserve across healthy aging.',
            },
      report.avgSleepHours7d < 7.0
        ? {
            id: 'bp-4',
            title: 'Consistent 7.5-Hour Sleep Window & Digital Sunset',
            duration: 'Nightly',
            actionPlan: `Your 7-day average (${report.avgSleepHours7d}h) is slightly under target (${state.user.sleepHabitTargetHours}h). Power down screens 30 mins earlier and keep a steady wake alarm.`,
            whySuggested: 'Deep sleep consolidates daytime memories and clears metabolic byproducts.',
          }
        : {
            id: 'bp-4',
            title: 'Hydration + Soaked Walnuts, Greens & Turmeric Habit',
            duration: 'Daily habit',
            actionPlan:
              'Stay steady at 8 glasses of water (2L), pair soaked walnuts & almonds in the morning with leafy greens (palak/moringa) and fermented curd.',
            whySuggested: 'Steady hydration and vascular-friendly whole foods prevent afternoon mental fatigue.',
          },
    ],
    kn: [
      {
        id: 'bp-1',
        title: lowSteps ? '30-ನಿಮಿಷ ಬೆಳಗಿನ ಚುರುಕಾದ ನಡಿಗೆ' : 'ದ್ವಿ-ಕಾರ್ಯ ನಡಿಗೆ + ಸಮತೋಲನ ಅಭ್ಯಾಸ',
        duration: '30 ನಿಮಿಷ / ದಿನ',
        actionPlan: lowSteps
          ? `ಭೋಜನದ ನಂತರ ಎರಡು 15-ನಿಮಿಷದ ಚುರುಕಾದ ನಡಿಗೆಯೊಂದಿಗೆ ನಿಮ್ಮ 7-ದಿನದ ಸರಾಸರಿಯನ್ನು (${report.avgSteps7d.toLocaleString()} ಹೆಜ್ಜೆ) 8,000 ಹೆಜ್ಜೆಗಳಿಗೆ ಏರಿಸಿ.`
          : 'ನಿಮ್ಮ ಉತ್ತಮ ನಡಿಗೆ ದಿನಚರಿಯನ್ನು ಮುಂದುವರಿಸಿ ಮತ್ತು ಸಮತೋಲನ ಹಾಗೂ ತೋಳಿನ ಚಲನೆಯ ವ್ಯಾಯಾಮಗಳನ್ನು 5 ನಿಮಿಷ ಸೇರಿಸಿ.',
        whySuggested: 'ಏರೋಬಿಕ್ ದೈಹಿಕ ವ್ಯಾಯಾಮವು ಮೆದುಳಿಗೆ ರಕ್ತಸಂಚಾರವನ್ನು ಹೆಚ್ಚಿಸಿ ನೆನಪು ಮತ್ತು ವೇಗವನ್ನು ಬೆಂಬಲಿಸುತ್ತದೆ.',
      },
      {
        id: 'bp-2',
        title: stressOrAttn ? 'ಸೂರ್ಯ ನಮಸ್ಕಾರ + ಅನುಲೋಮ ವಿಲೋಮ ಉಸಿರಾಟ' : 'ಲಘು ಬಲ ಮತ್ತು ಚಲನಶೀಲತೆ ವ್ಯಾಯಾಮ',
        duration: '15 ನಿಮಿಷ',
        actionPlan: stressOrAttn
          ? 'ಏಕಾಗ್ರತೆಯ ಕೆಲಸದ ಮೊದಲು 6 ನಿಧಾನ ಸುತ್ತಿನ ಸೂರ್ಯ ನಮಸ್ಕಾರ ಮತ್ತು 5 ನಿಮಿಷ ಅನುಲೋಮ ವಿಲೋಮ ಪ್ರಾಣಾಯಾಮ ಮಾಡಿ.'
          : 'ವಾರಕ್ಕೆ ಎರಡು ಬಾರಿ ಲಘು ಸ್ಕ್ವಾಟ್ಸ್, ವಾಲ್ ಪುಷ್-ಅಪ್ ಮತ್ತು ಬೆನ್ನಿನ ನಮ್ಯತೆ ವ್ಯಾಯಾಮ ಸೇರಿಸಿ.',
        whySuggested:
          attentionPct < 85
            ? 'ಗಮನ ಕಾರ್ಯಕ್ಷಮತೆಗೆ ಶಾಂತವಾದ ಉಸಿರಾಟ ಮತ್ತು ವಿಶ್ರಾಂತಿ ನೆರವಾಗುತ್ತದೆ.'
            : 'ಬಲ ಮತ್ತು ನಮ್ಯತೆ ವ್ಯಾಯಾಮವು ಆರೋಗ್ಯಕರ ರಕ್ತದೊತ್ತಡ ಮತ್ತು ಚಯಾಪಚಯವನ್ನು ಬೆಂಬಲಿಸುತ್ತದೆ.',
      },
      memoryPct < 85
        ? {
            id: 'bp-3',
            title: 'ಅಂತರದ ಪದ ಮತ್ತು ದೃಶ್ಯ ನೆನಪಿನ ಅಭ್ಯಾಸ',
            duration: '10 ನಿಮಿಷ · ವಾರಕ್ಕೆ 3x',
            actionPlan: 'ಮೆಮೊರಿ ಆಟಗಳಲ್ಲಿ Word Recall ಅಥವಾ Image Recall ಆಡಿ, ಹೊಸ ಹೆಸರುಗಳನ್ನು ದೃಶ್ಯ ಕಥೆಗಳಾಗಿ ಜೋಡಿಸಿ.',
            whySuggested: `ನೆನಪಿನ ವಿಭಾಗ ${memoryPct}% ದಾಖಲಾಗಿದೆ — ಸಕ್ರಿಯ ಪುನರಾವರ್ತನೆ ನೆನಪಿನ ಮಾರ್ಗಗಳನ್ನು ಬಲಪಡಿಸುತ್ತದೆ.`,
          }
        : execPct < 85
          ? {
              id: 'bp-3',
              title: 'ಕಾರ್ಯ ಬದಲಾವಣೆ ಮತ್ತು ಪ್ಯಾಟರ್ನ್ ಮ್ಯಾಟ್ರಿಕ್ಸ್ ಸವಾಲು',
              duration: '10 ನಿಮಿಷ · ವಾರಕ್ಕೆ 3x',
              actionPlan: 'ಪ್ಯಾಟರ್ನ್ ಗುರುತಿಸುವಿಕೆ ಅಭ್ಯಾಸ ಮಾಡಿ ಹಾಗೂ ಒಂದೇ ಸಮಯದಲ್ಲಿ ಒಂದು ಹೊಸ ಕೆಲಸದ ಮೇಲೆ ಗಮನ ಕೇಂದ್ರೀಕರಿಸಿ.',
              whySuggested: `ಕಾರ್ಯನಿರ್ವಾಹಕ ವಿಭಾಗ ${execPct}% ದಾಖಲಾಗಿದೆ — ರಚನಾತ್ಮಕ ನವೀನತೆ ಅರಿವಿನ ನಮ್ಯತೆಯನ್ನು ಹೆಚ್ಚಿಸುತ್ತದೆ.`,
            }
          : {
              id: 'bp-3',
              title: 'ಹೊಸ ಕೌಶಲ್ಯ ಮತ್ತು ದ್ವಿಭಾಷಾ ಓದು',
              duration: '15 ನಿಮಿಷ / ದಿನ',
              actionPlan: 'ಪ್ರತಿದಿನ 15 ನಿಮಿಷ ಹೊಸ ಭಾಷಾ ಪದ, ಸಂಗೀತ ಲಯ ಅಥವಾ ತಂತ್ರ ಆಟವನ್ನು ಶಾಂತ ವಾತಾವರಣದಲ್ಲಿ ಅಭ್ಯಾಸ ಮಾಡಿ.',
              whySuggested: 'ಹೊಸ ಮಾನಸಿಕ ಚಟುವಟಿಕೆಯು ದೀರ್ಘಕಾಲದ ಅರಿವಿನ ಮೀಸಲನ್ನು ಬಲವಾಗಿರಿಸುತ್ತದೆ.',
            },
      report.avgSleepHours7d < 7.0
        ? {
            id: 'bp-4',
            title: 'ನಿಯಮಿತ 7.5 ಗಂಟೆ ನಿದ್ರೆ ಮತ್ತು ಪರದೆ ವಿರಾಮ',
            duration: 'ಪ್ರತಿ ರಾತ್ರಿ',
            actionPlan: `ನಿಮ್ಮ 7-ದಿನದ ಸರಾಸರಿ (${report.avgSleepHours7d}h) ಗುರಿಗಿಂತ (${state.user.sleepHabitTargetHours}h) ಸ್ವಲ್ಪ ಕಡಿಮೆ ಇದೆ. 30 ನಿಮಿಷ ಮುಂಚೆ ಪರದೆ ನಿಲ್ಲಿಸಿ.`,
            whySuggested: 'ಆಳವಾದ ನಿದ್ರೆ ಹಗಲಿನ ನೆನಪುಗಳನ್ನು ಗಟ್ಟಿಗೊಳಿಸುತ್ತದೆ ಮತ್ತು ಮೆದುಳಿನ ಆಯಾಸವನ್ನು ನಿವಾರಿಸುತ್ತದೆ.',
          }
        : {
            id: 'bp-4',
            title: 'ನೀರು + ನೆನೆಸಿದ ವಾಲ್‌ನಟ್, ಸೊಪ್ಪು ಮತ್ತು ಅರಿಶಿನ ಅಭ್ಯಾಸ',
            duration: 'ದೈನಂದಿನ ಅಭ್ಯಾಸ',
            actionPlan: 'ದಿನಕ್ಕೆ 8 ಲೋಟ ನೀರು (2L) ಕುಡಿಯಿರಿ, ಬೆಳಿಗ್ಗೆ ನೆನೆಸಿದ ವಾಲ್‌ನಟ್-ಬಾದಾಮಿ ಹಾಗೂ ಹಸಿರು ಸೊಪ್ಪು-ಮೊಸರು ಸೇವಿಸಿ.',
            whySuggested: 'ಸಮರ್ಪಕ ಜಲಸಂಚಯನ ಮತ್ತು ಪೋಷಣೆ ಮಧ್ಯಾಹ್ನದ ಮಾನಸಿಕ ಆಯಾಸವನ್ನು ತಡೆಯುತ್ತದೆ.',
          },
    ],
    hi: [
      {
        id: 'bp-1',
        title: lowSteps ? 'सुबह 30 मिनट की तेज़ सैर (रक्त प्रवाह बूस्ट)' : 'डुअल-टास्क तेज़ सैर + संतुलन अभ्यास',
        duration: '30 मिनट / दिन',
        actionPlan: lowSteps
          ? `भोजन के बाद दो 15-मिनट की तेज़ सैर के साथ अपने 7-दिन के औसत (${report.avgSteps7d.toLocaleString()} कदम) को 8,000 कदम की ओर बढ़ाएं।`
          : 'अपनी अच्छी सैर की दिनचर्या बनाए रखें और 5 मिनट संतुलन एवं समन्वय अभ्यास जोड़ें।',
        whySuggested: 'एरोबिक व्यायाम मस्तिष्क में रक्त प्रवाह बढ़ाता है जो स्मृति और गति का समर्थन करता है।',
      },
      {
        id: 'bp-2',
        title: stressOrAttn ? 'सूर्य नमस्कार + अनुलोम-विलोम श्वसन' : 'लचीलापन और हल्का स्ट्रेंथ सर्किट',
        duration: '15 मिनट',
        actionPlan: stressOrAttn
          ? 'एकाग्रता वाले काम से पहले 6 धीमे सूर्य नमस्कार और 5 मिनट अनुलोम-विलोम प्राणायाम करें।'
          : 'हफ्ते में दो बार हल्के स्क्वाट्स, वॉल पुश-अप और रीढ़ की गतिशीलता का अभ्यास करें।',
        whySuggested:
          attentionPct < 85
            ? 'ध्यान कार्य से पहले मन को शांत करने से एकाग्रता बेहतर होती है।'
            : 'स्ट्रेंथ और मोबिलिटी अभ्यास स्वस्थ रक्तचाप और चयापचय में सहायक हैं।',
      },
      memoryPct < 85
        ? {
            id: 'bp-3',
            title: 'अंतराल पर शब्द व दृश्य स्मृति अभ्यास',
            duration: '10 मिनट · सप्ताह में 3x',
            actionPlan: 'मेमोरी गेम्स में Word Recall या Image Recall खेलें और नए नामों को मन में कहानियों से जोड़ें।',
            whySuggested: `स्मृति स्कोर ${memoryPct}% दर्ज हुआ — सक्रिय दोहराव याददाश्त मार्गों को मजबूत करता है।`,
          }
        : execPct < 85
          ? {
              id: 'bp-3',
              title: 'टास्क-स्विचिंग व पैटर्न मैट्रिक्स चुनौती',
              duration: '10 मिनट · सप्ताह में 3x',
              actionPlan: 'Pattern Recognition खेलें और बिना मल्टीटास्किंग किए नई पहेली या रेसिपी आज़माएं।',
              whySuggested: `कार्यकारी लचीलापन ${execPct}% दर्ज हुआ — संरचित नवीनता दिमाग की लचक बढ़ाती है।`,
            }
          : {
              id: 'bp-3',
              title: 'नया कौशल व द्विभाषी पठन अभ्यास',
              duration: '15 मिनट / दिन',
              actionPlan: 'बिना ध्यान भटके रोज़ 15 मिनट कोई नया भाषा शब्द, संगीत ताल या रणनीति खेल सीखें।',
              whySuggested: 'नवीन मानसिक जुड़ाव स्वस्थ उम्र बढ़ने में संज्ञानात्मक रिजर्व बनाए रखता है।',
            },
      report.avgSleepHours7d < 7.0
        ? {
            id: 'bp-4',
            title: 'नियमित 7.5-घंटे नींद व डिजिटल सनसेट',
            duration: 'प्रति रात',
            actionPlan: `आपका 7-दिन औसत (${report.avgSleepHours7d}h) लक्ष्य (${state.user.sleepHabitTargetHours}h) से थोड़ा कम है। सोने से 30 मिनट पहले स्क्रीन बंद करें।`,
            whySuggested: 'गहरी नींद दिन की यादों को सहेजती है और मानसिक थकान साफ करती है।',
          }
        : {
            id: 'bp-4',
            title: 'हाइड्रेशन + भीगे अखरोट, हरी पत्तेदार सब्ज़ी व हल्दी',
            duration: 'दैनिक आदत',
            actionPlan: 'दिन में 8 गिलास पानी (2L) पिएं, सुबह भीगे अखरोट-बादाम के साथ पालक/सहजन और ताज़ा दही शामिल करें।',
            whySuggested: 'नियमित पानी और संतुलित आहार दोपहर की मानसिक थकान से बचाते हैं।',
          },
    ],
    ar: [
      {
        id: 'bp-1',
        title: lowSteps ? 'المشي الصباحي السريع لمدة 30 دقيقة' : 'المشي السريع + تمارين التوازن والتنسيق',
        duration: '30 دقيقة / يوم',
        actionPlan: lowSteps
          ? `ارفع متوسطك في 7 أيام (${report.avgSteps7d.toLocaleString()} خطوة) نحو 8,000 خطوة عبر جولتين سريعتين مدة كل منهما 15 دقيقة بعد الوجبات.`
          : 'حافظ على روتين الخطوات القوي وأضف 5 دقائق من تمارين التوازن وحركة الذراعين لتحفيز الشبكات الحركية.',
        whySuggested: 'التمارين الهوائية تنشط تدفق الدم الدماغي وتدعم تثبيت الذاكرة وسرعة المعالجة.',
      },
      {
        id: 'bp-2',
        title: stressOrAttn ? 'تمارين التنفس العميق والتمدد الصباحي' : 'تمارين المقاومة الخفيفة والمرونة',
        duration: '15 دقيقة',
        actionPlan: stressOrAttn
          ? 'مارس 6 جولات بطيئة من التمدد مع 5 دقائق من التنفس المتناوب قبل مهام التركيز العميق.'
          : 'أضف القرفصاء الخفيف وتمدد الظهر مرتين أسبوعياً لدعم ضغط الدم والتمثيل الغذائي.',
        whySuggested:
          attentionPct < 85
            ? 'يساعد تهدئة التوتر على تحسين دقة الانتباه قبل المهام الذهنية.'
            : 'تكمل تمارين القوة والمرونة المشي الهوائي لصحة الأوعية الدموية.',
      },
      memoryPct < 85
        ? {
            id: 'bp-3',
            title: 'تدريب التذكر المتباعد والربط البصري',
            duration: '10 دقائق · 3 مرات أسبوعياً',
            actionPlan: 'العب تذكر الكلمات أو الصور، واربط الأسماء الجديدة بقصص ذهنية واضحة لتقوية التذكر.',
            whySuggested: `سجّل مجال الذاكرة ${memoryPct}% — الاسترجاع النشط المتباعد يقوي مسارات الحفظ.`,
          }
        : execPct < 85
          ? {
              id: 'bp-3',
              title: 'تحدي التبديل بين المهام ومصفوفة الأنماط',
              duration: '10 دقائق · 3 مرات أسبوعياً',
              actionPlan: 'تدرّب على تمييز الأنماط وحل ألغاز الأرقام والحروف المتناوبة دون تشتت.',
              whySuggested: `سجلت المرونة التنفيذية ${execPct}% — التنوع المنظم يدعم المرونة الإدراكية.`,
            }
          : {
              id: 'bp-3',
              title: 'تعلم مهارة جديدة والقراءة ثنائية اللغة',
              duration: '15 دقيقة / يوم',
              actionPlan: 'حافظ على نشاط خطك الأساسي بتعلم عبارة جديدة أو لعبة استراتيجية في وقت هادئ.',
              whySuggested: 'المشاركة الذهنية المتجددة تدعم الاحتياطي الإدراكي.',
            },
      report.avgSleepHours7d < 7.0
        ? {
            id: 'bp-4',
            title: 'نافذة نوم ثابتة (7.5 ساعة) وغروب رقمي',
            duration: 'ليلياً',
            actionPlan: `متوسط 7 أيام (${report.avgSleepHours7d} س) أقل قليلاً من الهدف (${state.user.sleepHabitTargetHours} س). أوقف الشاشات قبل النوم بـ 30 دقيقة.`,
            whySuggested: 'النوم العميق يثبت الذكريات اليومية ويزيل إرهاق الدماغ.',
          }
        : {
            id: 'bp-4',
            title: 'الترطيب + الجوز المنقوع والخضروات الورقية',
            duration: 'عادة يومية',
            actionPlan: 'حافظ على 8 أكواب ماء (2 لتر)، وتناول الجوز واللوز المنقوع صباحاً مع السبانخ والزبادي.',
            whySuggested: 'الترطيب المستمر والغذاء الداعم للأوعية يقللان إرهاق الظهيرة الذهني.',
          },
    ],
    ta: [
      {
        id: 'bp-1',
        title: lowSteps ? 'காலை 30 நிமிட வேக நடைப்பயிற்சி' : 'இரு-பணி நடை + சமநிலை ஒருங்கிணைப்புப் பயிற்சி',
        duration: '30 நிமிடம் / நாள்',
        actionPlan: lowSteps
          ? `உணவுக்குப் பிறகு 15 நிமிட வேக நடையாக இரு முறை நடந்து உங்கள் 7-நாள் சராசரியை (${report.avgSteps7d.toLocaleString()} படிகள்) 8,000 படிகளாக உயர்த்துங்கள்.`
          : 'உங்கள் சிறந்த நடைப்பயிற்சியுடன் 5 நிமிட குதிகால்-விரல் சமநிலை மற்றும் கை அசைவுப் பயிற்சியைச் சேர்க்கவும்.',
        whySuggested: 'ஏரோபிக் உடற்பயிற்சி மூளை இரத்த ஓட்டத்தையும் நினைவாற்றல் வேகத்தையும் தூண்டுகிறது.',
      },
      {
        id: 'bp-2',
        title: stressOrAttn ? 'சூரிய நமஸ்காரம் + அனுலோம் விலோம் மூச்சுப்பயிற்சி' : 'இலகுவான தசை வலிமை & நெகிழ்வுப் பயிற்சி',
        duration: '15 நிமிடம்',
        actionPlan: stressOrAttn
          ? 'கவனம் தேவைப்படும் வேலைக்கு முன் 6 மெதுவான சூரிய நமஸ்காரம் மற்றும் 5 நிமிட மாற்று நாசி மூச்சுப்பயிற்சி செய்யுங்கள்.'
          : 'வாரம் இருமுறை இலகுவான குந்துகை, சுவர் புஷ்-அப் மற்றும் முதுகு நெகிழ்வுப் பயிற்சிகளைச் சேர்க்கவும்.',
        whySuggested:
          attentionPct < 85
            ? 'கவனப் பணிகளுக்கு முன் அமைதியான மூச்சுப்பயிற்சி மனதை ஒருமுகப்படுத்த உதவும்.'
            : 'வலிமைப் பயிற்சிகள் ஆரோக்கியமான இரத்த அழுத்தம் மற்றும் வளர்சிதை மாற்றத்திற்கு உதவுகின்றன.',
      },
      memoryPct < 85
        ? {
            id: 'bp-3',
            title: 'இடைவெளிச் சொல் & காட்சி நினைவுப் பயிற்சி',
            duration: '10 நிமிடம் · வாரம் 3x',
            actionPlan: 'Memory Games-இல் Word Recall அல்லது Image Recall விளையாடி, புதிய பெயர்களைக் காட்சிக் கதைகளாக நினைவுபடுத்துங்கள்.',
            whySuggested: `நினைவாற்றல் பிரிவு ${memoryPct}% பதிவானது — இடைவெளி நினைவுகூரல் நினைவுப் பாதைகளை வலுப்படுத்தும்.`,
          }
        : execPct < 85
          ? {
              id: 'bp-3',
              title: 'பணி-மாற்றம் & வடிவ அணி சவால்',
              duration: '10 நிமிடம் · வாரம் 3x',
              actionPlan: 'Pattern Recognition பயிற்சி செய்து, பல வேலைகளை ஒரே நேரத்தில் செய்யாமல் புதிய புதிர்களைத் தீர்க்கவும்.',
              whySuggested: `செயலாக்க மாற்றம் ${execPct}% பதிவானது — ஒழுங்கமைந்த புதுமை அறிவாற்றல் நெகிழ்வுத்தன்மையைப் பயிற்றுவிக்கும்.`,
            }
          : {
              id: 'bp-3',
              title: 'புதிய திறன் & இருமொழி வாசிப்புப் பயிற்சி',
              duration: '15 நிமிடம் / நாள்',
              actionPlan: 'கவனச்சிதறலின்றி தினமும் 15 நிமிடம் ஒரு புதிய மொழிச் சொல், இசைத் தாளம் அல்லது உத்தி விளையாட்டைப் பழகுங்கள்.',
              whySuggested: 'புதிய மன ஈடுபாடு ஆரோக்கியமான முதுமையில் அறிவாற்றல் சேமிப்பைப் பாதுகாக்கும்.',
            },
      report.avgSleepHours7d < 7.0
        ? {
            id: 'bp-4',
            title: 'சீரான 7.5-மணி தூக்கம் & டிஜிட்டல் அஸ்தமனம்',
            duration: 'இரவு தோறும்',
            actionPlan: `உங்கள் 7-நாள் சராசரி (${report.avgSleepHours7d}h) இலக்கை (${state.user.sleepHabitTargetHours}h) விடச் சற்று குறைவு. தூங்கும் முன் 30 நிமிடம் திரையை நிறுத்தவும்.`,
            whySuggested: 'ஆழ்ந்த தூக்கம் பகல் நினைவுகளை நிலைப்படுத்தி மூளைச் சோர்வை நீக்குகிறது.',
          }
        : {
            id: 'bp-4',
            title: 'நீர்ச்சத்து + ஊறவைத்த வால்நட், கீரை & மஞ்சள் பழக்கம்',
            duration: 'தினசரி பழக்கம்',
            actionPlan: 'தினமும் 8 டம்ளர் தண்ணீர் (2L) குடியுங்கள்; காலையில் ஊறவைத்த வால்நட்-பாதாம், பசலை/முருங்கைக் கீரை மற்றும் தயிர் சேர்த்துக்கொள்ளுங்கள்.',
            whySuggested: 'சீரான நீர்ச்சத்தும் சத்தான உணவும் மதிய நேர மனச்சோர்வைத் தடுக்கின்றன.',
          },
    ],
  }

  const pillarOrder: BrainPhysicalSuggestion['pillar'][] = [
    'Physical Activity',
    'Physical Activity',
    'Brain Exercise',
    report.avgSleepHours7d < 7.0 ? 'Sleep & Recovery' : 'Nutrition & Hydration',
  ]

  const items = localizedPlan[lang] ?? localizedPlan.en
  return items.map((item, idx) => {
    const pillar = pillarOrder[idx]
    return {
      ...item,
      pillar,
      pillarLabel: pLabels[pillar],
    }
  })
}

const LOCALIZED_REPLIES: Record<
  LanguageCode,
  Record<
    | 'memory'
    | 'sleep'
    | 'attention'
    | 'physical'
    | 'nutrition'
    | 'stress'
    | 'progress'
    | 'greeting'
    | 'clinical'
    | 'safety_refusal',
    (r: ComputedReportSummary, statuses: Record<ReportStatusLabel, string>) => {
      reply: string
      followUps: string[]
    }
  >
> = {
  en: {
    safety_refusal: () => ({
      reply:
        'I cannot check medical illnesses or tell you which medicine or tablet to take.\n\nOnly your doctor can safely check your health and advise medicines after meeting you. **If this is a sudden emergency (chest pain, weakness, fainting, or trouble speaking), call 112 or 108 immediately.** You can also dial our Website Care Desk at **+91 1800-599-0112** or open **Clinical Support** to book a doctor visit.',
      followUps: [
        'Book a doctor appointment',
        'How can I improve my memory?',
        'What is the connection between sleep and brain health?',
      ],
    }),
    memory: (r) => ({
      reply: `Here are 4 simple daily habits to keep your memory strong:\n\n1. **Sleep Well Every Night:** Good rest helps your brain save the day’s memories clearly (your average: **${r.avgSleepHours7d} hours**).\n2. **Brisk Aerobic Movement (Daily Walk):** Walk comfortably for 20 to 30 minutes each day to keep fresh blood flowing to your brain (your average: **${r.avgSteps7d.toLocaleString()} steps/day**).\n3. **Play Gentle Memory Games:** Play our Word Recall and Card Pairs games 2 or 3 times a week.\n4. **Keep Healthy Basics Steady:** Drink plenty of water, eat soaked almonds or walnuts, and ask your doctor to check Vitamin B12 and blood pressure regularly.\n\n*(Simple wellness guide for daily life — always ask your doctor for personal medical care.)*`,
      followUps: [
        'Give me physical exercises for brain wellness',
        'What is the connection between sleep and brain health?',
        'Check my progress and trends',
      ],
    }),
    sleep: (r) => ({
      reply: `Good sleep is like a gentle night-time recharge for your mind:\n\n1. **Why Sleep Helps:** Deep rest washes away tiredness so you wake up fresh and remember things better.\n2. **Your Recent Sleep:** You averaged **${r.avgSleepHours7d} hours/night** (sleep quality: **${r.avgSleepQuality7d} out of 5**).\n3. **3 Easy Bedtime Steps:** Go to bed at the same time each night, put away bright phone or TV screens 30 minutes early, and get 10 minutes of morning sunlight.\n\n*(Simple wellness guide for daily life — talk with a doctor if sleeplessness keeps bothering you.)*`,
      followUps: [
        'Give me physical exercises for brain wellness',
        'How can I improve my concentration?',
      ],
    }),
    attention: (r) => ({
      reply: `Here are 3 easy ways to focus calmly without getting tired:\n\n1. **One Thing at a Time:** Work on one small task for 20–30 minutes, then take a 5-minute break to stretch and sip water.\n2. **Slow Calm Breathing:** Your recent stress average is **${r.avgStress7d} out of 5** — take 5 minutes of slow breathing (breathe in gently, breathe out slowly).\n3. **Short Walk Break:** A 10-minute gentle walk wakes up your attention quickly.\n\n*(Simple wellness guide for daily life — not medical advice.)*`,
      followUps: [
        'Give me physical exercises for brain wellness',
        'How can I improve my memory?',
      ],
    }),
    physical: (r) => ({
      reply: `Gentle daily movement keeps both your body and mind young:\n\n1. **Morning or Evening Walk (20–30 mins):** Your average is **${r.avgSteps7d.toLocaleString()} steps/day**. Slowly build toward 7,500–8,500 comfortable steps.\n2. **Simple Yoga & Stretching (10–15 mins):** Gentle neck, shoulder, and breathing exercises loosen stiffness.\n3. **Safe Balance & Strength:** Stand holding a sturdy chair for gentle heel raises or wall push-ups twice a week.\n4. **Stand Up Every Hour:** Stand and walk inside your room for 2 minutes every hour.\n\n*(Go at a comfortable pace — ask your doctor before starting heavy exercises.)*`,
      followUps: [
        'What lifestyle & Indian food habits help brain health?',
        'Check my progress and trends',
      ],
    }),
    nutrition: () => ({
      reply: `Simple everyday food & water habits for healthy elders:\n\n1. **Morning Nuts:** Eat 4 soaked walnuts and 5 soaked almonds in the morning.\n2. **Fresh Home Meals:** Include green leafy vegetables (spinach, drumstick leaves), dal, soft millets (ragi/jowar), and fresh homemade curd.\n3. **Warm & Light Evening:** Limit heavy fried snacks or sugar late at night; warm milk with a pinch of turmeric feels soothing.\n4. **Sip Water Often:** Drink 7–8 glasses of clean water through the day.\n\n*(Simple daily food guide — follow any special diet from your doctor first.)*`,
      followUps: [
        'Give me physical exercises for brain wellness',
        'How can I improve my memory?',
      ],
    }),
    stress: (r) => ({
      reply: `Keeping your mind peaceful helps your sleep and memory (your stress average: **${r.avgStress7d} out of 5**):\n\n1. **Slow Deep Breathing (5–10 mins):** Sit comfortably, close your eyes, and breathe in and out slowly.\n2. **Call Family or Walk Outside:** Talking with loved ones or taking a quiet evening walk lifts your mood.\n3. **Peaceful Evening Routine:** Listen to calm music or prayers before sleeping instead of watching worrying news.\n\n*(Simple wellness guide for daily life.)*`,
      followUps: [
        'What is the connection between sleep and brain health?',
        'Give me physical exercises for brain wellness',
      ],
    }),
    progress: (r, st) => ({
      reply: `Here is your easy-to-read NeuroCare summary:\n\n• **Memory & Thinking Tasks:** **${r.latestTaskPct ?? 'Not done yet'}%** (*${st[r.taskStatus]}*)\n• **Everyday Routine Check:** **${r.latestFunctionalPct ?? 'Not done yet'}%** (*${st[r.functionalStatus]}*)\n• **Last 7 Nights of Sleep:** **${r.avgSleepHours7d} hours/night** (*${st[r.sleepStatus]}*)\n• **Daily Movement:** **${r.avgSteps7d.toLocaleString()} steps/day** (${r.avgExerciseMins7d} mins activity)\n\nSmall changes from day to day are completely normal when you feel tired or busy.\n\n*(Personal wellness summary — not a medical diagnosis.)*`,
      followUps: [
        'Give me physical exercises for brain wellness',
        'How can I improve my memory?',
      ],
    }),
    greeting: (r) => ({
      reply: `Hello! I am NeuroCare AI, your friendly voice and brain wellness helper.\n\nToday at a glance: your 7-day sleep average is **${r.avgSleepHours7d} hours/night** and daily walk averages **${r.avgSteps7d.toLocaleString()} steps**. Ask me anytime about:\n\n1. **Keeping Memory Strong** (easy daily habits and memory games)\n2. **Better Sleep & Peaceful Mind** (bedtime tips and relaxation)\n3. **Safe Walking & Healthy Food** (simple steps for older adults)\n4. **Doctors & My Progress** (checking scores or booking Clinical Support visits)`,
      followUps: [
        'How can I improve my memory?',
        'Check my progress and trends',
      ],
    }),
    clinical: (r) => ({
      reply: `Would you like to talk to a doctor? Open **Clinical Support** from the menu on the left:\n\n1. **Find Nearby Doctors:** See kind neurologists and memory doctors near your city.\n2. **Choose Online Video or In-Clinic Visit:** Talk from home by video or meet the doctor in person.\n3. **Share Your Summary Easily:** Attach your **${r.latestTaskPct ?? 'N/A'}%** check-in and **${r.avgSleepHours7d} hours** sleep summary so the doctor knows how you are doing.\n\n*(Appointments are managed by our Admin team. For urgent chest pain, sudden weakness, or emergencies, go to the nearest hospital right away.)*`,
      followUps: [
        'Check my progress and trends',
        'Give me physical exercises for brain wellness',
      ],
    }),
  },
  kn: {
    safety_refusal: () => ({
      reply:
        'ನಾನು ಯಾವುದೇ ಕಾಯಿಲೆಯನ್ನು ಪತ್ತೆಹಚ್ಚಲು ಅಥವಾ ಮಾತ್ರೆ–ಔಷಧಿಗಳನ್ನು ಬರೆದುಕೊಡಲು ಸಾಧ್ಯವಿಲ್ಲ.\n\nನಿಮ್ಮ ವೈದ್ಯರು ಮಾತ್ರ ಪರೀಕ್ಷೆ ಮಾಡಿ ಸರಿಯಾದ ಚಿಕಿತ್ಸೆ ನೀಡಬಲ್ಲರು. **ಇದು ತೀವ್ರ ತುರ್ತು ಸ್ಥಿತಿಯಾಗಿದ್ದರೆ (ಎದೆ ನೋವು, ದೌರ್ಬಲ್ಯ, ಮೂರ್ಛೆ ಅಥವಾ ಮಾತು ತೊದಲುವುದು) ತಕ್ಷಣ 112 ಅಥವಾ 108 ಕ್ಕೆ ಕರೆ ಮಾಡಿ.** ವೆಬ್‌ಸೈಟ್ ಆರೈಕೆ ಕೇಂದ್ರ **+91 1800-599-0112** ಅಥವಾ **ವೈದ್ಯಕೀಯ ಬೆಂಬಲ (Clinical Support)** ಪುಟವನ್ನು ಸಹ ಬಳಸಬಹುದು.',
      followUps: [
        'ಮೆದುಳಿನ ಆರೋಗ್ಯಕ್ಕೆ ದೈಹಿಕ ವ್ಯಾಯಾಮ ಸಲಹೆ ನೀಡಿ',
        'ನನ್ನ ನೆನಪಿನ ಶಕ್ತಿಯನ್ನು ಹೇಗೆ ಸುಧಾರಿಸಬಹುದು?',
      ],
    }),
    memory: (r) => ({
      reply: `ನೆನಪಿನ ಶಕ್ತಿಯನ್ನು ಚೆನ್ನಾಗಿ ಇಟ್ಟುಕೊಳ್ಳಲು 4 ಸುಲಭ ದಾರಿಗಳು:\n\n1. **ರಾತ್ರಿ ಚೆನ್ನಾಗಿ ನಿದ್ದೆ ಮಾಡಿ:** ಒಳ್ಳೆಯ ನಿದ್ದೆ ನಿಮ್ಮ ಮೆದುಳಿಗೆ ವಿಶ್ರಾಂತಿ ನೀಡಿ ನೆನಪು ಉಳಿಸಿಕೊಳ್ಳಲು ಸಹಾಯ ಮಾಡುತ್ತದೆ (ನಿಮ್ಮ ಸರಾಸರಿ: **${r.avgSleepHours7d} ಗಂಟೆ**).\n2. **ಪ್ರತಿದಿನ ನಿಧಾನವಾಗಿ ನಡೆಯಿರಿ:** ಬೆಳಿಗ್ಗೆ ಅಥವಾ ಸಂಜೆ 20–30 ನಿಮಿಷ ನಡಿಗೆ ಮಾಡಿದರೆ ಮೆದುಳಿಗೆ ತಾಜಾ ರಕ್ತ ಸಿಗುತ್ತದೆ (ನಿಮ್ಮ ಸರಾಸರಿ: **${r.avgSteps7d.toLocaleString()} ಹೆಜ್ಜೆಗಳು**).\n3. **ಸರಳ ನೆನಪಿನ ಆಟ ಆಡಿ:** ವಾರದಲ್ಲಿ 2–3 ಬಾರಿ ನಮ್ಮ ಪದ ಮತ್ತು ಜೋಡಿ ಕಾರ್ಡ್ ಆಟಗಳನ್ನು ಆಡಿ.\n4. **ನೀರು ಮತ್ತು ಬಾದಾಮಿ:** ದಿನಕ್ಕೆ 7–8 ಲೋಟ ನೀರು ಕುಡಿಯಿರಿ, ಬೆಳಿಗ್ಗೆ ನೆನೆಸಿದ ಬಾದಾಮಿ–ವಾಲ್‌ನಟ್ ತಿನ್ನಿ ಮತ್ತು ವೈದ್ಯರ ಬಳಿ ಬಿಪಿ ಹಾಗೂ ವಿಟಮಿನ್ B12 ಪರೀಕ್ಷಿಸಿ.\n\n*(ದೈನಂದಿನ ಆರೈಕೆಗಾಗಿ ಸರಳ ಮಾಹಿತಿ — ವೈದ್ಯಕೀಯ ಸಲಹೆಗೆ ನಿಮ್ಮ ವೈದ್ಯರನ್ನು ಕೇಳಿ.)*`,
      followUps: [
        'ಮೆದುಳಿನ ಆರೋಗ್ಯಕ್ಕೆ ದೈಹಿಕ ವ್ಯಾಯಾಮ ಸಲಹೆ ನೀಡಿ',
        'ನಿದ್ರೆ ಮತ್ತು ಮೆದುಳಿನ ಆರೋಗ್ಯದ ನಡುವೆ ಏನು ಸಂಬಂಧ?',
      ],
    }),
    sleep: (r) => ({
      reply: `ಒಳ್ಳೆಯ ನಿದ್ದೆ ನಿಮ್ಮ ಮೆದುಳಿಗೆ ಶಕ್ತಿ ಕೊಡುತ್ತದೆ:\n\n1. **ನಿದ್ದೆಯ ಲಾಭ:** ರಾತ್ರಿ ಚೆನ್ನಾಗಿ ನಿದ್ದೆ ಮಾಡಿದರೆ ಬೆಳಿಗ್ಗೆ ಮನಸ್ಸು ಹಗುರಾಗಿ, ನೆನಪು ಮತ್ತು ಗಮನ ಚೆನ್ನಾಗಿರುತ್ತದೆ.\n2. **ನಿಮ್ಮ ಇತ್ತೀಚಿನ ನಿದ್ದೆ:** ಕಳೆದ 7 ದಿನಗಳಲ್ಲಿ ಸರಾಸರಿ **${r.avgSleepHours7d} ಗಂಟೆ** (ಗುಣಮಟ್ಟ **${r.avgSleepQuality7d}/5**).\n3. **ಸುಲಭ 3 ಅಭ್ಯಾಸಗಳು:** ದಿನವೂ ಒಂದೇ ಸಮಯಕ್ಕೆ ಮಲಗಿ, ಮಲಗುವ 30 ನಿಮಿಷ ಮೊದಲು ಫೋನ್–ಟಿವಿ ನಿಲ್ಲಿಸಿ, ಬೆಳಿಗ್ಗೆ 10 ನಿಮಿಷ ಬಿಸಿಲಿನಲ್ಲಿ ಕೂರಿ.\n\n*(ಸರಳ ದೈನಂದಿನ ಮಾರ್ಗದರ್ಶನ — ನಿದ್ದೆ ಬಾರದಿದ್ದರೆ ವೈದ್ಯರನ್ನು ಕೇಳಿ.)*`,
      followUps: [
        'ಏಕಾಗ್ರತೆಯನ್ನು ಹೇಗೆ ಹೆಚ್ಚಿಸಬಹುದು?',
        'ಮೆದುಳಿನ ಆರೋಗ್ಯಕ್ಕೆ ದೈಹಿಕ ವ್ಯಾಯಾಮ ಸಲಹೆ ನೀಡಿ',
      ],
    }),
    attention: (r) => ({
      reply: `ಮನಸ್ಸನ್ನು ಶಾಂತವಾಗಿ ಮತ್ತು ಗಮನವಿಟ್ಟು ಕೆಲಸ ಮಾಡಲು 3 ಸುಲಭ ಸಲಹೆಗಳು:\n\n1. **ಒಮ್ಮೆಗೆ ಒಂದು ಕೆಲಸ:** 20–30 ನಿಮಿಷ ಒಂದೇ ಕೆಲಸ ಮಾಡಿ, ನಂತರ 5 ನಿಮಿಷ ಎದ್ದು ನೀರು ಕುಡಿದು ವಿಶ್ರಾಂತಿ ಪಡೆಯಿರಿ.\n2. **ನಿಧಾನವಾದ ಉಸಿರಾಟ:** ನಿಮ್ಮ ಒತ್ತಡ ಮಟ್ಟ **${r.avgStress7d}/5** ಇದೆ — ದಿನಕ್ಕೆ 5 ನಿಮಿಷ ನಿಧಾನವಾಗಿ ಉಸಿರು ತೆಗೆದು ಬಿಡಿ (ಅನುಲೋಮ ವಿಲೋಮ).\n3. **ಸಣ್ಣ ನಡಿಗೆ:** ಮಧ್ಯಾಹ್ನ 10 ನಿಮಿಷ ನಿಧಾನವಾಗಿ ನಡೆದರೆ ಮನಸ್ಸು ಮತ್ತೆ ಚುರುಕಾಗುತ್ತದೆ.`,
      followUps: [
        'ಮೆದುಳಿನ ಆರೋಗ್ಯಕ್ಕೆ ದೈಹಿಕ ವ್ಯಾಯಾಮ ಸಲಹೆ ನೀಡಿ',
        'ನನ್ನ ನೆನಪಿನ ಶಕ್ತಿಯನ್ನು ಹೇಗೆ ಸುಧಾರಿಸಬಹುದು?',
      ],
    }),
    physical: (r) => ({
      reply: `ಹಿರಿಯರಿಗೆ ಸುರಕ್ಷಿತ ಮತ್ತು ಸುಲಭ ದೈಹಿಕ ವ್ಯಾಯಾಮ ಸಲಹೆಗಳು:\n\n1. **ಚುರುಕಾದ ನಡಿಗೆ (20–30 ನಿಮಿಷ):** ನಿಮ್ಮ ಸರಾಸರಿ **${r.avgSteps7d.toLocaleString()} ಹೆಜ್ಜೆಗಳು**. ಆರಾಮವಾಗಿ ದಿನಕ್ಕೆ 7,500–8,500 ಹೆಜ್ಜೆಗಳತ್ತ ನಡೆಯಿರಿ.\n2. **ಸರಳ ಯೋಗ ಮತ್ತು ಮೈ ಮುರಿಯುವುದು (10–15 ನಿಮಿಷ):** ಕತ್ತು, ಭುಜದ ಸುಲಭ ಚಲನೆ ಮತ್ತು ಉಸಿರಾಟದ ಅಭ್ಯಾಸ ಮಾಡಿ.\n3. **ಕುರ್ಚಿ ಹಿಡಿದು ಸಮತೋಲನ ವ್ಯಾಯಾಮ:** ವಾರಕ್ಕೆ 2 ಬಾರಿ ಗಟ್ಟಿಯಾದ ಕುರ್ಚಿ ಹಿಡಿದು ನಿಧಾನವಾಗಿ ಕಾಲು ಮೇಲಕ್ಕೆತ್ತಿ ಇಳಿಸಿ.\n4. **ಪ್ರತಿ ಗಂಟೆಗೂ ಎದ್ದೇಳಿ:** ಒಂದೇ ಕಡೆ ಹೆಚ್ಚು ಹೊತ್ತು ಕೂರದೆ ಪ್ರತಿ ಗಂಟೆಗೆ 2 ನಿಮಿಷ ಮನೆಯಲ್ಲೇ ನಡೆಯಿರಿ.\n\n*(ನಿಮ್ಮ ದೇಹಕ್ಕೆ ಹಿತವಾದ ವೇಗದಲ್ಲಿ ಮಾಡಿ — ಕಷ್ಟವಾದರೆ ವೈದ್ಯರನ್ನು ಕೇಳಿ.)*`,
      followUps: [
        'ನನ್ನ ಪ್ರಗತಿ ಮತ್ತು ವರದಿ ತೋರಿಸಿ',
        'ನಿದ್ರೆ ಮತ್ತು ಮೆದುಳಿನ ಆರೋಗ್ಯದ ನಡುವೆ ಏನು ಸಂಬಂಧ?',
      ],
    }),
    nutrition: () => ({
      reply: `ಹಿರಿಯರಿಗೆ ಮನೆಯಲ್ಲೇ ಸುಲಭವಾದ ಆಹಾರ ಮತ್ತು ನೀರಿನ ಅಭ್ಯಾಸಗಳು:\n\n1. **ಬೆಳಗಿನ ಪೋಷಣೆ:** ಬೆಳಿಗ್ಗೆ 4 ನೆನೆಸಿದ ವಾಲ್‌ನಟ್ ಮತ್ತು 5 ನೆನೆಸಿದ ಬಾದಾಮಿ ತಿನ್ನಿ.\n2. **ತಾಜಾ ಮನೆ ಊಟ:** ಪಾಲಕ್, ನುಗ್ಗೆಸೊಪ್ಪು, ಬೇಳೆ, ರಾಗಿ ಅಥವಾ ಜೋಳದ ರೊಟ್ಟಿ ಮತ್ತು ತಾಜಾ ಮೊಸರು ಸೇವಿಸಿ.\n3. **ರಾತ್ರಿ ಹಗುರ ಊಟ:** ರಾತ್ರಿ ಎಣ್ಣೆಯುಕ್ತ ತಿಂಡಿ ಕಡಿಮೆ ಮಾಡಿ; ಮಲಗುವ ಮೊದಲು ಚಿಟಿಕೆ ಅರಿಶಿನ ಹಾಕಿದ ಬೆಚ್ಚಗಿನ ಹಾಲು ಕುಡಿಯಬಹುದು.\n4. **ನೀರು ಮರೆಯಬೇಡಿ:** ದಿನಕ್ಕೆ 7–8 ಲೋಟ ಶುದ್ಧ ನೀರು ಕುಡಿಯಿರಿ.`,
      followUps: ['ಮೆದುಳಿನ ಆರೋಗ್ಯಕ್ಕೆ ದೈಹಿಕ ವ್ಯಾಯಾಮ ಸಲಹೆ ನೀಡಿ'],
    }),
    stress: (r) => ({
      reply: `ಮನಸ್ಸನ್ನು ಶಾಂತವಾಗಿ ಇಟ್ಟುಕೊಳ್ಳಲು ಸುಲಭ ದಾರಿಗಳು (ನಿಮ್ಮ ಒತ್ತಡ: **${r.avgStress7d}/5**):\n\n1. **ನಿಧಾನ ಉಸಿರಾಟ (5–10 ನಿಮಿಷ):** ಆರಾಮವಾಗಿ ಕುಳಿತು ಕಣ್ಣು ಮುಚ್ಚಿ ನಿಧಾನವಾಗಿ ಉಸಿರಾಡಿ.\n2. **ಕುಟುಂಬದೊಂದಿಗೆ ಮಾತು ಮತ್ತು ನಡಿಗೆ:** ಸಂಜೆ ಫೋನ್ ಇಲ್ಲದೆ ಮಕ್ಕಳು ಅಥವಾ ಸ್ನೇಹಿತರೊಂದಿಗೆ 15–20 ನಿಮಿಷ ನಡೆದು ಮಾತನಾಡಿ.\n3. **ರಾತ್ರಿ ನೆಮ್ಮದಿ:** ಮಲಗುವ ಮುನ್ನ ಶಾಂತ ಸಂಗೀತ ಅಥವಾ ಪ್ರಾರ್ಥನೆ ಕೇಳಿ.`,
      followUps: ['ನಿದ್ರೆ ಮತ್ತು ಮೆದುಳಿನ ಆರೋಗ್ಯದ ನಡುವೆ ಏನು ಸಂಬಂಧ?'],
    }),
    progress: (r, st) => ({
      reply: `ನಿಮ್ಮ NeuroCare ಸುಲಭ ಪ್ರಗತಿ ಸಾರಾಂಶ:\n\n• **ನೆನಪು ಮತ್ತು ಮೆದುಳಿನ ಆಟದ ಪರೀಕ್ಷೆ:** **${r.latestTaskPct ?? 'ಇನ್ನೂ ಮಾಡಿಲ್ಲ'}%** (${st[r.taskStatus]})\n• **ದೈನಂದಿನ ಕೆಲಸಗಳ ಪರೀಕ್ಷೆ:** **${r.latestFunctionalPct ?? 'ಇನ್ನೂ ಮಾಡಿಲ್ಲ'}%** (${st[r.functionalStatus]})\n• **ಕಳೆದ 7 ದಿನಗಳ ನಿದ್ದೆ:** **${r.avgSleepHours7d} ಗಂಟೆ/ರಾತ್ರಿ** (${st[r.sleepStatus]})\n• **ದಿನದ ನಡಿಗೆ:** **${r.avgSteps7d.toLocaleString()} ಹೆಜ್ಜೆಗಳು/ದಿನ**\n\nಕೆಲವು ದಿನ ಸುಸ್ತು ಇದ್ದಾಗ ಸ್ವಲ್ಪ ಏರುಪೇರು ಆಗುವುದು ಸಹಜ — ಚಿಂತೆ ಬೇಡ.\n\n*(ಸರಳ ದೈನಂದಿನ ಸಾರಾಂಶ — ವೈದ್ಯಕೀಯ ವರದಿಯಲ್ಲ.)*`,
      followUps: ['ಮೆದುಳಿನ ಆರೋಗ್ಯಕ್ಕೆ ದೈಹಿಕ ವ್ಯಾಯಾಮ ಸಲಹೆ ನೀಡಿ'],
    }),
    greeting: (r) => ({
      reply: `ನಮಸ್ಕಾರ! ನಾನು NeuroCare AI, ನಿಮ್ಮ ಧ್ವನಿ ಮತ್ತು ಆರೋಗ್ಯದ ಗೆಳೆಯ.\n\nಇಂದಿನ ಚಿಕ್ಕ ಮಾಹಿತಿ: ನಿಮ್ಮ ಕಳೆದ 7 ದಿನಗಳ ನಿದ್ದೆ **${r.avgSleepHours7d} ಗಂಟೆ** ಮತ್ತು ದಿನದ ನಡಿಗೆ **${r.avgSteps7d.toLocaleString()} ಹೆಜ್ಜೆಗಳು**. ನೀವು ನನ್ನನ್ನು ಕೇಳಬಹುದು:\n\n1. **ನೆನಪಿನ ಶಕ್ತಿ ಹೆಚ್ಚಿಸುವ ಸುಲಭ ಅಭ್ಯಾಸಗಳು**\n2. **ರಾತ್ರಿ ಚೆನ್ನಾಗಿ ನಿದ್ದೆ ಮತ್ತು ಮನಸ್ಸಿಗೆ ನೆಮ್ಮದಿ**\n3. **ಹಿರಿಯರಿಗೆ ಸುರಕ್ಷಿತ ನಡಿಗೆ ಮತ್ತು ಮನೆ ಊಟ**\n4. **ವೈದ್ಯರ ಭೇಟಿ ಮತ್ತು ನಿಮ್ಮ ಪ್ರಗತಿ ವಿವರ**`,
      followUps: [
        'ನನ್ನ ನೆನಪಿನ ಶಕ್ತಿಯನ್ನು ಹೇಗೆ ಸುಧಾರಿಸಬಹುದು?',
        'ನನ್ನ ಪ್ರಗತಿ ಮತ್ತು ವರದಿ ತೋರಿಸಿ',
      ],
    }),
    clinical: (r) => ({
      reply: `ವೈದ್ಯರೊಂದಿಗೆ ಮಾತನಾಡಲು ಮೆನುವಿನಲ್ಲಿ **ವೈದ್ಯಕೀಯ ಬೆಂಬಲ (Clinical Support)** ತೆರೆಯಿರಿ:\n\n1. **ಹತ್ತಿರದ ವೈದ್ಯರನ್ನು ಹುಡುಕಿ:** ನಿಮ್ಮ ಊರಿಗೆ ಸಮೀಪದ ನರವಿಜ್ಞಾನಿ ಮತ್ತು ತಜ್ಞ ವೈದ್ಯರ ಪಟ್ಟಿ ನೋಡಿ.\n2. **ವೀಡಿಯೊ ಅಥವಾ ಕ್ಲಿನಿಕ್ ಭೇಟಿ:** ಮನೆಯಿಂದಲೇ ಫೋನ್ ವೀಡಿಯೊ ಕರೆ ಅಥವಾ ನೇರ ಕ್ಲಿನಿಕ್ ಭೇಟಿ ಆಯ್ಕೆಮಾಡಿ.\n3. **ವರದಿ ಕಳುಹಿಸಿ:** ನಿಮ್ಮ **${r.latestTaskPct ?? 'ಲಭ್ಯವಿಲ್ಲ'}%** ಪರೀಕ್ಷೆ ಮತ್ತು **${r.avgSleepHours7d} ಗಂಟೆ** ನಿದ್ದೆಯ ವಿವರವನ್ನು ಸುಲಭವಾಗಿ ವೈದ್ಯರಿಗೆ ಹಂಚಿಕೊಳ್ಳಿ.`,
      followUps: [
        'ನನ್ನ ಪ್ರಗತಿ ಮತ್ತು ವರದಿ ತೋರಿಸಿ',
        'ಮೆದುಳಿನ ಆರೋಗ್ಯಕ್ಕೆ ದೈಹಿಕ ವ್ಯಾಯಾಮ ಸಲಹೆ ನೀಡಿ',
      ],
    }),
  },
  hi: {
    safety_refusal: () => ({
      reply:
        'मैं किसी बीमारी की जांच नहीं कर सकता और न ही कोई दवा या गोली बता सकता हूँ।\n\nकेवल आपके डॉक्टर ही जांच करके सही दवा और सलाह दे सकते हैं। **यदि कोई अचानक गंभीर आपात स्थिति हो (सीने में दर्द, कमज़ोरी, चक्कर या बोलने में दिक्कत) तो तुरंत 112 या 108 पर कॉल करें।** वेबसाइट सहायता डेस्क **+91 1800-599-0112** या **चिकित्सा सहायता (Clinical Support)** पेज का भी उपयोग करें।',
      followUps: [
        'मस्तिष्क के लिए शारीरिक व्यायाम के सुझाव दें',
        'मैं अपनी याददाश्त कैसे सुधार सकता हूँ?',
      ],
    }),
    memory: (r) => ({
      reply: `याददाश्त को मजबूत रखने के 4 बहुत आसान तरीके:\n\n1. **रात को अच्छी नींद लें:** गहरी नींद दिमाग को दिन की बातें याद रखने में मदद करती है (आपका औसत: **${r.avgSleepHours7d} घंटे**)।\n2. **रोज़ 20–30 मिनट टहलें:** सुबह या शाम आराम से टहलने से दिमाग में ताज़ा खून और ऊर्जा पहुँचती है (आपका औसत: **${r.avgSteps7d.toLocaleString()} कदम/दिन**)।\n3. **हल्के मेमोरी गेम खेलें:** हफ्ते में 2–3 बार शब्द और कार्ड मिलाने वाले आसान गेम खेलें।\n4. **पानी और खान-पान:** दिन में 7–8 गिलास पानी पिएं, भीगे बादाम-अखरोट खाएं और डॉक्टर से विटामिन B12 व ब्लड प्रेशर चेक कराते रहें।\n\n*(रोज़मर्रा की आसान देखभाल के लिए — किसी भी इलाज के लिए अपने डॉक्टर से पूछें।)*`,
      followUps: [
        'मस्तिष्क के लिए शारीरिक व्यायाम के सुझाव दें',
        'नींद और मस्तिष्क स्वास्थ्य के बीच क्या संबंध है?',
      ],
    }),
    sleep: (r) => ({
      reply: `अच्छी नींद आपके दिमाग को आराम और नई ताकत देती है:\n\n1. **नींद का फायदा:** रात की पूरी नींद से सुबह मन हल्का रहता है और चीज़ें आसानी से याद रहती हैं।\n2. **आपकी हालिया नींद:** पिछले 7 दिनों का औसत **${r.avgSleepHours7d} घंटे/रात** है (गुणवत्ता **${r.avgSleepQuality7d}/5**)।\n3. **3 आसान आदतें:** रोज़ एक तय समय पर सोएं, सोने से 30 मिनट पहले मोबाइल-टीवी बंद कर दें और सुबह 10 मिनट धूप में बैठें।\n\n*(आसान दैनिक सलाह — अगर नींद की परेशानी लगातार रहे तो डॉक्टर से मिलें।)*`,
      followUps: [
        'मैं अपनी एकाग्रता कैसे बढ़ा सकता हूँ?',
        'मस्तिष्क के लिए शारीरिक व्यायाम के सुझाव दें',
      ],
    }),
    attention: (r) => ({
      reply: `ध्यान लगाने और मन शांत रखने के 3 आसान उपाय:\n\n1. **एक बार में एक काम:** 20–30 मिनट एक काम करें, फिर 5 मिनट उठकर पानी पिएं और आराम करें।\n2. **धीरे-धीरे सांस लें:** आपका तनाव स्तर **${r.avgStress7d}/5** है — रोज़ 5 मिनट आराम से अनुलोम-विलोम करें।\n3. **10 मिनट की सैर:** थोड़ी देर टहलने से दिमाग फिर से तरोताज़ा हो जाता है।`,
      followUps: [
        'मस्तिष्क के लिए शारीरिक व्यायाम के सुझाव दें',
        'मैं अपनी याददाश्त कैसे सुधार सकता हूँ?',
      ],
    }),
    physical: (r) => ({
      reply: `बड़ों के लिए सुरक्षित और आसान व्यायाम सुझाव:\n\n1. **तेज़ चलना (20–30 मिनट):** आपका औसत **${r.avgSteps7d.toLocaleString()} कदम** है — आराम से 7,500–8,500 कदम की कोशिश करें।\n2. **हल्का योग और स्ट्रेचिंग (10–15 मिनट):** गर्दन, कंधों को धीरे घुमाएं और आराम से प्राणायाम करें।\n3. **कुर्सी के सहारे संतुलन अभ्यास:** हफ्ते में 2 बार मजबूत कुर्सी पकड़कर पैरों की हल्की एक्सरसाइज़ करें।\n4. **हर घंटे उठें:** लगातार बैठे न रहें — हर घंटे 2 मिनट कमरे में टहल लें।\n\n*(अपनी सुविधा के अनुसार धीरे करें — ज़्यादा मेहनत से पहले डॉक्टर से पूछें।)*`,
      followUps: [
        'मेरी प्रगति और रिपोर्ट दिखाएं',
        'नींद और मस्तिष्क स्वास्थ्य के बीच क्या संबंध है?',
      ],
    }),
    nutrition: () => ({
      reply: `बड़ों के लिए घर के सरल और सेहतमंद खाने की आदतें:\n\n1. **सुबह का पोषण:** सुबह 4 भीगे अखरोट और 5 भीगे बादाम खाएं।\n2. **ताज़ा घर का खाना:** हरी पत्तेदार सब्ज़ियाँ (पालक, मेथी), दाल, रागी या बाजरे की रोटी और ताज़ा दही लें।\n3. **हल्का रात का खाना:** रात को तला-भुना कम खाएं; सोने से पहले चुटकी भर हल्दी वाला गुनगुना दूध पी सकते हैं।\n4. **खूब पानी पिएं:** दिन भर में 7–8 गिलास साफ पानी पिएं।`,
      followUps: ['मस्तिष्क के लिए शारीरिक व्यायाम के सुझाव दें'],
    }),
    stress: (r) => ({
      reply: `मन को शांत और खुश रखने के सरल तरीके (तनाव औसत: **${r.avgStress7d}/5**):\n\n1. **गहरी और धीमी सांस (5–10 मिनट):** आराम से बैठकर आँखें बंद करें और धीरे-धीरे सांस लें।\n2. **परिवार से बात और टहलना:** शाम को बिना फोन के परिवार या दोस्तों के साथ 15–20 मिनट टहलें और बातें करें।\n3. **सोने से पहले शांति:** रात को चिंता वाली खबरें देखने की बजाय मधुर संगीत या भजन सुनें।`,
      followUps: ['नींद और मस्तिष्क स्वास्थ्य के बीच क्या संबंध है?'],
    }),
    progress: (r, st) => ({
      reply: `आपका आसान NeuroCare स्वास्थ्य सारांश:\n\n• **याददाश्त व सोच का खेल/जांच:** **${r.latestTaskPct ?? 'अभी नहीं हुआ'}%** (${st[r.taskStatus]})\n• **रोज़मर्रा के काम की जांच:** **${r.latestFunctionalPct ?? 'अभी नहीं हुआ'}%** (${st[r.functionalStatus]})\n• **पिछले 7 दिनों की नींद:** **${r.avgSleepHours7d} घंटे/रात** (${st[r.sleepStatus]})\n• **रोज़ की सैर:** **${r.avgSteps7d.toLocaleString()} कदम/दिन**\n\nथकान होने पर नंबरों में थोड़ा उतार-चढ़ाव बिल्कुल सामान्य है।\n\n*(आसान व्यक्तिगत सारांश — चिकित्सा निदान नहीं।)*`,
      followUps: ['मस्तिष्क के लिए शारीरिक व्यायाम के सुझाव दें'],
    }),
    greeting: (r) => ({
      reply: `नमस्ते! मैं NeuroCare AI हूँ, आपकी आवाज़ और स्वास्थ्य का सरल साथी।\n\nआज की एक झलक: आपकी औसत नींद **${r.avgSleepHours7d} घंटे** और रोज़ की सैर **${r.avgSteps7d.toLocaleString()} कदम** है। आप मुझसे पूछ सकते हैं:\n\n1. **याददाश्त तेज़ रखने के आसान उपाय**\n2. **अच्छी नींद और मन की शांति**\n3. **बड़ों के लिए सुरक्षित सैर और घर का खाना**\n4. **डॉक्टर अपॉइंटमेंट और आपकी रिपोर्ट**`,
      followUps: [
        'मैं अपनी याददाश्त कैसे सुधार सकता हूँ?',
        'मेरी प्रगति और रिपोर्ट दिखाएं',
      ],
    }),
    clinical: (r) => ({
      reply: `डॉक्टर से सलाह लेने के लिए बाईं ओर **चिकित्सा सहायता (Clinical Support)** खोलें:\n\n1. **नज़दीकी डॉक्टर चुनें:** अपने शहर के पास अच्छे न्यूरोलॉजिस्ट और विशेषज्ञ खोजें।\n2. **वीडियो कॉल या क्लिनिक भेंट:** घर बैठे ऑनलाइन बात करें या क्लिनिक जाकर मिलें।\n3. **रिपोर्ट आसानी से भेजें:** अपनी **${r.latestTaskPct ?? 'उपलब्ध नहीं'}%** जांच और **${r.avgSleepHours7d} घंटे** नींद का सारांश डॉक्टर के साथ साझा करें।`,
      followUps: [
        'मेरी प्रगति और रिपोर्ट दिखाएं',
        'मस्तिष्क के लिए शारीरिक व्यायाम के सुझाव दें',
      ],
    }),
  },
  ar: {
    safety_refusal: () => ({
      reply:
        'لا أستطيع تشخيص الأمراض أو كتابة أي أدوية أو حبوب.\n\nالطبيب المختص فقط هو من يفحصك ويحدد العلاج المناسب لك. **في الحالات الطارئة المفاجئة (ألم الصدر، ضعف مفاجئ، إغماء أو صعوبة الكلام) اتصل بالرقم 112 أو 108 فوراً.** يمكنك أيضاً الاتصال بمكتب دعم الموقع **+91 1800-599-0112** أو فتح **الدعم الطبي (Clinical Support)**.',
      followUps: [
        'اقترح تمارين بدنية لدعم صحة الدماغ',
        'كيف يمكنني تحسين ذاكرتي؟',
      ],
    }),
    memory: (r) => ({
      reply: `4 خطوات بسيطة ومريحة لتقوية الذاكرة كل يوم:\n\n1. **نوم مريح ليلاً:** النوم الجيد يساعد الدماغ على حفظ ذكريات اليوم بوضوح (متوسطك: **${r.avgSleepHours7d} ساعة**).\n2. **المشي اللطيف يومياً:** المشي لمدة 20 إلى 30 دقيقة ينشط الدورة الدموية (متوسطك: **${r.avgSteps7d.toLocaleString()} خطوة/يوم**).\n3. **ألعاب الذاكرة الخفيفة:** العب ألعاب الكلمات والبطاقات مرتين أو ثلاث مرات في الأسبوع.\n4. **الماء والمكسرات والفحوصات:** اشرب الماء جيداً، وتناول الجوز واللوز، وافحص فيتامين B12 وضغط الدم عند الطبيب.\n\n*(إرشاد يومي مبسط — استشر طبيبك دائماً للعلاج الطبي.)*`,
      followUps: [
        'اقترح تمارين بدنية لدعم صحة الدماغ',
        'ما العلاقة بين النوم وصحة الدماغ؟',
      ],
    }),
    sleep: (r) => ({
      reply: `النوم المريح يجدد نشاط العقل والذاكرة:\n\n1. **فائدة النوم:** خلال النوم العميق يرتاح الدماغ فتستيقظ نشيطاً وأكثر تركيزاً.\n2. **متوسط نومك الحالي:** **${r.avgSleepHours7d} ساعة كل ليلة** (الجودة: **${r.avgSleepQuality7d}/5**).\n3. **3 خطوات سهلة قبل النوم:** نم واستيقظ في وقت ثابت، وأغلق الهاتف أو التلفاز قبل النوم بنصف ساعة، واجلس قليلاً في شمس الصباح.\n\n*(نصيحة يومية سهلة — راجع الطبيب إذا استمر الأرق.)*`,
      followUps: [
        'كيف يمكنني زيادة تركيزي؟',
        'اقترح تمارين بدنية لدعم صحة الدماغ',
      ],
    }),
    attention: (r) => ({
      reply: `3 طرق سهلة للحفاظ على التركيز والهدوء:\n\n1. **عمل واحد في كل مرة:** ركز على مهمة بسيطة لـ 20 دقيقة ثم ارتح 5 دقائق واشرب كوب ماء.\n2. **تنفس هادئ وبطيء:** متوسط التوتر لديك **${r.avgStress7d}/5** — تنفس ببطء وعمق لمدة 5 دقائق يومياً.\n3. **مشي قصير:** المشي لمدة 10 دقائق يعيد النشاط والانتباه بسرعة.`,
      followUps: [
        'اقترح تمارين بدنية لدعم صحة الدماغ',
        'كيف يمكنني تحسين ذاكرتي؟',
      ],
    }),
    physical: (r) => ({
      reply: `حركة آمنة وسهلة لكبار السن لصحة الجسم والعقل:\n\n1. **المشي السريع أو اللطيف (20–30 دقيقة):** متوسطك الحالي **${r.avgSteps7d.toLocaleString()} خطوة** — حاول الوصول تدريجياً إلى 7,500 خطوة يومياً.\n2. **تمدد وتنفس (10–15 دقيقة):** حرّك الكتفين والرقبة بلطف مع تنفس مريح.\n3. **توازن آمن:** قف بجانب كرسي ثابت وارفع كعبيك ببطء لتقوية الساقين مرتين أسبوعياً.\n4. **انهض كل ساعة:** لا تجلس طويلاً، امشِ في الغرفة دقيقتين كل ساعة.\n\n*(تحرك بالسرعة التي تريحك — واستشر الطبيب قبل التمارين القوية.)*`,
      followUps: [
        'اعرض ملخص تقدمي ونتائجي',
        'ما العلاقة بين النوم وصحة الدماغ؟',
      ],
    }),
    nutrition: () => ({
      reply: `عادات غذاء وشرب بسيطة ومفيدة لكبار السن:\n\n1. **صباحاً:** تناول 4 حبات جوز و5 حبات لوز منقوعة.\n2. **طعام البيت الطازج:** الخضار الورقية كالسبانخ، والعدس والحبوب الكاملة والزبادي الطازج.\n3. **عشاء خفيف:** تجنب الأطعمة الدسمة والسكريات ليلاً؛ كوب حليب دافئ يريح الجسم.\n4. **شرب الماء:** اشرب 7 إلى 8 أكواب من الماء النقي يومياً.`,
      followUps: ['اقترح تمارين بدنية لدعم صحة الدماغ'],
    }),
    stress: (r) => ({
      reply: `لتهدئة البال والنوم بهدوء (متوسط التوتر: **${r.avgStress7d}/5**):\n\n1. **تنفس بطيء (5–10 دقائق):** اجلس مرتاحاً وأغمض عينيك وتنفس بهدوء.\n2. **الحديث مع العائلة والمشي:** المشي مساءً مع الأهل بدون هاتف يبعث البهجة.\n3. **هدوء المساء:** استمع لتلاوة هادئة أو موسيقى لطيفة قبل النوم.`,
      followUps: ['ما العلاقة بين النوم وصحة الدماغ؟'],
    }),
    progress: (r, st) => ({
      reply: `ملخصك السهل في NeuroCare:\n\n• **تمارين الذاكرة والتفكير:** **${r.latestTaskPct ?? 'لم يُجرَ بعد'}%** (${st[r.taskStatus]})\n• **الاعتماد اليومي:** **${r.latestFunctionalPct ?? 'لم يُجرَ بعد'}%** (${st[r.functionalStatus]})\n• **نوم آخر 7 أيام:** **${r.avgSleepHours7d} ساعة/ليلة** (${st[r.sleepStatus]})\n• **المشي اليومي:** **${r.avgSteps7d.toLocaleString()} خطوة/يوم**\n\nالتغير البسيط من يوم لآخر طبيعي جداً عند التعب.\n\n*(ملخص يومي مبسط — وليس تشخيصاً طبياً.)*`,
      followUps: ['اقترح تمارين بدنية لدعم صحة الدماغ'],
    }),
    greeting: (r) => ({
      reply: `مرحباً! أنا مساعد NeuroCare الصوتي والرفيق السهل لصحة دماغك.\n\nلمحة اليوم: متوسط نومك **${r.avgSleepHours7d} ساعة** والمشي **${r.avgSteps7d.toLocaleString()} خطوة يومياً**. اسألني في أي وقت عن:\n\n1. **طرق سهلة لتقوية الذاكرة**\n2. **نوم مريح وهدوء البال**\n3. **مشي آمن وطعام صحي لكبار السن**\n4. **حجز موعد طبيب ومتابعة تقدمك**`,
      followUps: [
        'كيف يمكنني تحسين ذاكرتي؟',
        'اعرض ملخص تقدمي ونتائجي',
      ],
    }),
    clinical: (r) => ({
      reply: `لحجز موعد مع طبيب، افتح **الدعم الطبي (Clinical Support)** من القائمة:\n\n1. **أطباء قريبون منك:** اعثر على أطباء الأعصاب والذاكرة القريبين من مدينتك.\n2. **فيديو من البيت أو زيارة العيادة:** اختر الطريقة التي تناسبك.\n3. **مشاركة ملخصك بسهولة:** أرفق نتيجة **${r.latestTaskPct ?? 'غير متوفر'}%** ومتوسط النوم **${r.avgSleepHours7d} ساعة** ليطلع عليها الطبيب.`,
      followUps: [
        'اعرض ملخص تقدمي ونتائجي',
        'اقترح تمارين بدنية لدعم صحة الدماغ',
      ],
    }),
  },
  ta: {
    safety_refusal: () => ({
      reply:
        'என்னால் எந்த நோயையும் கண்டறியவோ மாத்திரை மருந்துகளை எழுதிக் கொடுக்கவோ முடியாது.\n\nஉங்கள் மருத்துவர் மட்டுமே நேரில் பரிசோதித்து சரியான மருந்து வழங்க முடியும். **திடீர் அவசர நிலை ஏற்பட்டால் (நெஞ்சு வலி, ஒரு பக்கம் பலவீனம், மயக்கம் அல்லது பேச்சு குழறுதல்) உடனே 112 அல்லது 108 ஐ அழைக்கவும்.** இணையதள உதவி மையம் **+91 1800-599-0112** அல்லது **மருத்துவ உதவி (Clinical Support)** பக்கத்தையும் அணுகலாம்.',
      followUps: [
        'மூளை நலனுக்கான உடற்பயிற்சி ஆலோசனைகள் தாருங்கள்',
        'என் நினைவாற்றலை எவ்வாறு மேம்படுத்துவது?',
      ],
    }),
    memory: (r) => ({
      reply: `நினைவாற்றலை நல்ல நிலையில் வைத்திருக்க 4 எளிய வழிகள்:\n\n1. **இரவு நன்றாகத் தூங்குங்கள்:** நல்ல தூக்கம் அன்றைய நினைவுகளை மனதில் பதிய வைக்கிறது (உங்கள் சராசரி: **${r.avgSleepHours7d} மணி நேரம்**).\n2. **தினமும் மெதுவாக நடங்கள்:** காலை அல்லது மாலை 20–30 நிமிடம் நடந்தால் மூளைக்குப் புத்துணர்ச்சி கிடைக்கும் (உங்கள் சராசரி: **${r.avgSteps7d.toLocaleString()} படிகள்**).\n3. **எளிய நினைவு விளையாட்டுகள்:** வாரம் 2–3 முறை சொல் மற்றும் அட்டை பொருத்தும் விளையாட்டுகளை விளையாடுங்கள்.\n4. **தண்ணீர் & பாதாம்:** தினமும் 7–8 டம்ளர் தண்ணீர் குடியுங்கள், ஊறவைத்த பாதாம்–வால்நட் சாப்பிடுங்கள், வைட்டமின் B12 & ரத்த அழுத்தம் பரிசோதியுங்கள்.\n\n*(தினசரி நலனுக்கான எளிய தகவல் — மருத்துவ ஆலோசனைக்கு மருத்துவரை அணுகுங்கள்.)*`,
      followUps: [
        'மூளை நலனுக்கான உடற்பயிற்சி ஆலோசனைகள் தாருங்கள்',
        'தூக்கத்திற்கும் மூளை ஆரோக்கியத்திற்கும் என்ன தொடர்பு?',
      ],
    }),
    sleep: (r) => ({
      reply: `நல்ல தூக்கம் மூளைக்கு ஓய்வும் புத்துணர்ச்சியும் தரும்:\n\n1. **தூக்கத்தின் நன்மை:** இரவு நன்றாகத் தூங்கினால் காலை சுறுசுறுப்பாகவும் நினைவு தெளிவாகவும் இருக்கும்.\n2. **உங்கள் சமீபத்திய தூக்கம்:** கடந்த 7 நாட்களில் சராசரி **${r.avgSleepHours7d} மணி நேரம்** (தரம் **${r.avgSleepQuality7d}/5**).\n3. **3 எளிய பழக்கங்கள்:** தினமும் ஒரே நேரத்தில் தூங்குங்கள், தூங்குவதற்கு 30 நிமிடம் முன் கைபேசி–டிவியை அணைத்துவிடுங்கள், காலை 10 நிமிடம் இளம் வெயிலில் அமருங்கள்.\n\n*(எளிய தினசரி வழிகாட்டல் — தூக்கமின்மை தொடர்ந்தால் மருத்துவரைக் கேளுங்கள்.)*`,
      followUps: [
        'என் கவனத்தை எவ்வாறு அதிகரிப்பது?',
        'மூளை நலனுக்கான உடற்பயிற்சி ஆலோசனைகள் தாருங்கள்',
      ],
    }),
    attention: (r) => ({
      reply: `மனதை அமைதியாகவும் கவனமாகவும் வைத்திருக்க 3 எளிய வழிகள்:\n\n1. **ஒரே நேரத்தில் ஒரு வேலை:** 20–30 நிமிடம் ஒரு வேலை செய்துவிட்டு 5 நிமிடம் தண்ணீர் குடித்து ஓய்வு எடுங்கள்.\n2. **மெதுவான மூச்சுப்பயிற்சி:** உங்கள் மன அழுத்தம் **${r.avgStress7d}/5** — தினமும் 5 நிமிடம் மெதுவாக மூச்சு இழுத்து விடுங்கள்.\n3. **சிறு நடை:** 10 நிமிடம் மெதுவாக நடந்தால் மனச் சோர்வு உடனே நீங்கும்.`,
      followUps: [
        'மூளை நலனுக்கான உடற்பயிற்சி ஆலோசனைகள் தாருங்கள்',
        'என் நினைவாற்றலை எவ்வாறு மேம்படுத்துவது?',
      ],
    }),
    physical: (r) => ({
      reply: `முதியோருக்குப் பாதுகாப்பான மற்றும் எளிய உடற்பயிற்சி ஆலோசனைகள்:\n\n1. **வேக நடைப்பயிற்சி (20–30 நிமிடம்):** உங்கள் சராசரி **${r.avgSteps7d.toLocaleString()} படிகள்**. வசதிக்கேற்ப 7,500–8,500 படிகள் நடக்க முயற்சி செய்யுங்கள்.\n2. **எளிய யோகா & நீட்டிப்பு (10–15 நிமிடம்):** கழுத்து, தோள்பட்டை சுழற்சி மற்றும் மூச்சுப்பயிற்சி செய்யுங்கள்.\n3. **நாற்காலி பிடித்த சமநிலை பயிற்சி:** வாரம் 2 முறை உறுதியான நாற்காலியைப் பிடித்து மெதுவாகக் குதிகாலை உயர்த்தி இறக்குங்கள்.\n4. **மணிக்கு ஒரு முறை எழுங்கள்:** தொடர்ந்து உட்காராமல் மணிக்கு ஒரு முறை 2 நிமிடம் அறையில் நடங்கள்.\n\n*(உங்களுக்கு எளிதான வேகத்தில் செய்யுங்கள் — சிரமம் இருந்தால் மருத்துவரைக் கேளுங்கள்.)*`,
      followUps: [
        'என் முன்னேற்றம் & அறிக்கையைக் காட்டு',
        'தூக்கத்திற்கும் மூளை ஆரோக்கியத்திற்கும் என்ன தொடர்பு?',
      ],
    }),
    nutrition: () => ({
      reply: `முதியோருக்கு எளிய வீட்டு உணவு மற்றும் தண்ணீர் பழக்கங்கள்:\n\n1. **காலைச் சத்து:** காலை 4 ஊறவைத்த வால்நட் மற்றும் 5 ஊறவைத்த பாதாம் சாப்பிடுங்கள்.\n2. **புதிய வீட்டு உணவு:** கீரைகள் (பசலை, முருங்கை), பருப்பு, ராகி அல்லது கம்பு மற்றும் வீட்டுத் தயிர் சேருங்கள்.\n3. **இரவு எளிய உணவு:** இரவு எண்ணெய் உணவுகளைக் குறைத்து, தூங்குவதற்கு முன் சிட்டிகை மஞ்சள் போட்ட வெதுவெதுப்பான பால் குடிக்கலாம்.\n4. **தண்ணீர் மறக்காதீர்கள்:** தினமும் 7–8 டம்ளர் சுத்தமான தண்ணீர் குடியுங்கள்.`,
      followUps: ['மூளை நலனுக்கான உடற்பயிற்சி ஆலோசனைகள் தாருங்கள்'],
    }),
    stress: (r) => ({
      reply: `மனதை அமைதியாகவும் மகிழ்ச்சியாகவும் வைத்திருக்க (மன அழுத்தம்: **${r.avgStress7d}/5**):\n\n1. **மெதுவான மூச்சு (5–10 நிமிடம்):** வசதியாக உட்கார்ந்து கண் மூடி மெதுவாக மூச்சு விடுங்கள்.\n2. **குடும்பத்துடன் பேச்சு & நடை:** மாலை கைபேசி இன்றி குடும்பத்தினருடன் 15–20 நிமிடம் நடந்து பேசுங்கள்.\n3. **இரவு அமைதி:** தூங்குவதற்கு முன் அமைதியான இசை அல்லது பக்திப் பாடல்கள் கேளுங்கள்.`,
      followUps: ['தூக்கத்திற்கும் மூளை ஆரோக்கியத்திற்கும் என்ன தொடர்பு?'],
    }),
    progress: (r, st) => ({
      reply: `உங்கள் எளிய NeuroCare சுருக்கம்:\n\n• **நினைவாற்றல் & சிந்தனைப் பயிற்சி:** **${r.latestTaskPct ?? 'இன்னும் இல்லை'}%** (${st[r.taskStatus]})\n• **அன்றாடச் செயல் திறன்:** **${r.latestFunctionalPct ?? 'இன்னும் இல்லை'}%** (${st[r.functionalStatus]})\n• **கடந்த 7 நாட்கள் தூக்கம்:** **${r.avgSleepHours7d} மணி/இரவு** (${st[r.sleepStatus]})\n• **தினசரி நடை:** **${r.avgSteps7d.toLocaleString()} படிகள்/நாள்**\n\nசோர்வாக இருக்கும் நாட்களில் சிறிய மாற்றம் வருவது இயல்பே — கவலைப்பட வேண்டாம்.\n\n*(எளிய தனிப்பட்ட சுருக்கம் — மருத்துவ பரிசோதனை அல்ல.)*`,
      followUps: ['மூளை நலனுக்கான உடற்பயிற்சி ஆலோசனைகள் தாருங்கள்'],
    }),
    greeting: (r) => ({
      reply: `வணக்கம்! நான் NeuroCare AI, உங்கள் குரல் & நலத் தோழன்.\n\nஇன்றைய சுருக்கம்: உங்கள் சராசரி தூக்கம் **${r.avgSleepHours7d} மணி** மற்றும் நடை **${r.avgSteps7d.toLocaleString()} படிகள்**. என்னிடம் எப்போதும் கேட்கலாம்:\n\n1. **நினைவாற்றலைக் காக்கும் எளிய பழக்கங்கள்**\n2. **நல்ல தூக்கம் & மன அமைதி**\n3. **முதியோருக்குப் பாதுகாப்பான நடை & வீட்டு உணவு**\n4. **மருத்துவர் சந்திப்பு & உங்கள் முன்னேற்றம்**`,
      followUps: [
        'என் நினைவாற்றலை எவ்வாறு மேம்படுத்துவது?',
        'என் முன்னேற்றம் & அறிக்கையைக் காட்டு',
      ],
    }),
    clinical: (r) => ({
      reply: `மருத்துவரிடம் பேச இடது பக்க மெனுவில் **மருத்துவ உதவி (Clinical Support)** திறக்கவும்:\n\n1. **அருகிலுள்ள மருத்துவர்கள்:** உங்கள் ஊருக்கு அருகிலுள்ள நரம்பியல் நிபுணர்களைப் பாருங்கள்.\n2. **வீடியோ அழைப்பு அல்லது நேரில் சந்திப்பு:** வீட்டிலிருந்தே பேசலாம் அல்லது கிளினிக் செல்லலாம்.\n3. **சுருக்கத்தை எளிதாகப் பகிருங்கள்:** உங்கள் **${r.latestTaskPct ?? 'இல்லை'}%** மதிப்பெண் மற்றும் **${r.avgSleepHours7d} மணி** தூக்கச் சுருக்கத்தை மருத்துவருக்கு அனுப்பலாம்.`,
      followUps: [
        'என் முன்னேற்றம் & அறிக்கையைக் காட்டு',
        'மூளை நலனுக்கான உடற்பயிற்சி ஆலோசனைகள் தாருங்கள்',
      ],
    }),
  },
}

export function generateSimulatedAIResponse(
  prompt: string,
  state: NeuroCareState,
  preferredLangOverride?: LanguageCode
): {
  reply: string
  englishSummary: string
  followUps: string[]
  mlIntent: string
  mlConfidence: number
  language: LanguageCode
} {
  const report = computeBrainHealthReport(state)
  const fallbackLang = preferredLangOverride ?? state.user.preferredLanguage
  const classification = classifyIntentWithTFIDF(
    prompt,
    state.mlTrainingSamples,
    fallbackLang
  )

  const lang = classification.detectedLanguage
  const langStatuses = (TRANSLATIONS[lang] ?? TRANSLATIONS.en).statusLabels
  const enStatuses = TRANSLATIONS.en.statusLabels

  if (classification.intent === 'custom' && classification.customAnswer) {
    return {
      reply: `${classification.customAnswer}\n\n*(ML · ${classification.confidence}%)*`,
      englishSummary: classification.customAnswer,
      followUps: LOCALIZED_REPLIES[lang].physical(report, langStatuses).followUps,
      mlIntent: 'custom-trained',
      mlConfidence: classification.confidence,
      language: lang,
    }
  }

  const intentKey =
    classification.intent === 'custom' ? 'progress' : classification.intent
  const handler = LOCALIZED_REPLIES[lang][intentKey]
  const res = handler(report, langStatuses)
  const enRes = LOCALIZED_REPLIES.en[intentKey](report, enStatuses)

  return {
    reply: res.reply,
    englishSummary: enRes.reply,
    followUps: res.followUps,
    mlIntent: intentKey,
    mlConfidence: classification.confidence,
    language: lang,
  }
}
