import type { EmergencyHelplineId } from '@/data/emergencyHelplines'
import type {
  AssessmentCategoryId,
  FamilyCondition,
  GameType,
  LanguageCode,
  PatientSetupChecklist,
  RecommendationCategory,
  ReportStatusLabel,
  SpecialistCategory,
  UserProfile,
} from '@/types/neurocare'

export interface LanguageOption {
  code: LanguageCode
  label: string
  nativeLabel: string
  speechLocale: string
  dir: 'ltr' | 'rtl'
}

export interface CommonBundle {
  dir: 'ltr' | 'rtl'
  speechLocale: string
  tagline: string
  brandSub: string
  nonDiagnosticMode: string
  localStorageNote: string
  demoProfile: string
  viewLandingPage: string
  signOut: string
  notificationsTitle: string
  markAllRead: string
  noMatchingSearch: string
  openMenuAria: string
  closeMenuAria: string
  demoModeBadge: string
  sampleLabel: string
  personalLabel: string
  sampleDataBadge: string
  personalSessionBadge: string
  pending: string
  active: string
  completed: string
  completedToday: string
  markCompleted: string
  cancel: string
  save: string
  reset: string
  back: string
  next: string
  submit: string
  details: string
  viewAll: string
  closeModal: string
  yesDeleteAll: string
  units: {
    hrs: string
    hrsPerNight: string
    mins: string
    minsPerDay: string
    steps: string
    stepsPerDay: string
    glasses: string
    ml: string
    sessions: string
    entries: string
    digits: string
    items: string
    words: string
    moves: string
    ms: string
    yrs: string
    agePrefix: string
    yearsSuffix: string
  }
  greetingPrefix: {
    morning: string
    afternoon: string
    evening: string
  }
  welcomeSubtitle: string
  navGroups: {
    coreMonitoring: string
    sleepLifestyle: string
    insightsSupport: string
    careOperations: string
  }
  nav: {
    overview: string
    assessment: string
    games: string
    analytics: string
    sleep: string
    lifestyle: string
    family: string
    report: string
    recommendations: string
    history: string
    assistant: string
    clinical: string
    admin: string
    settings: string
  }
  mobileNav: {
    overview: string
    assess: string
    games: string
    analytics: string
    aiChat: string
  }
  searchCategories: {
    page: string
    assessment: string
    game: string
    report: string
    wellness: string
    assistant: string
    care: string
    admin: string
    records: string
    settings: string
    patient: string
  }
  cta: {
    startAssessment: string
    exploreFeatures: string
    searchPlaceholder: string
    downloadPdf: string
    launchDemo: string
    adminPortal: string
  }
  statusLabels: Record<ReportStatusLabel, string>
  domainBadges: {
    taskPerformance: string
    task: string
    questionnaire: string
    measuredLogged: string
    measuredSelfReport: string
    nonDiagnostic: string
    simulatedAiDemo: string
  }
  disclaimer: {
    title: string
    compactText: string
    fullText: string
  }
  authErrors: {
    invalidEmail: string
    passwordShort: string
    passwordMismatch: string
    nameRequired: string
    invalidPhone: string
    phoneOtpRequired: string
    otpRequired: string
    otpInvalidPrefix: string
    otpExpired: string
    otpLocked: string
    otpCooldownPrefix: string
    smsGatewayError: string
    consentRequired: string
    unableSignIn: string
    couldNotCreate: string
  }
  categoryNames: Record<AssessmentCategoryId, string>
  recCategories: Record<'All' | RecommendationCategory, string>
  specialistCategories: Record<SpecialistCategory, string>
  familyConditionNames: Record<FamilyCondition, string>
  activityLevels: Record<UserProfile['activityLevel'], { label: string; desc: string }>
  wearableNone: string
  assessmentContextSampleNotes: Record<string, string>
  goalLookup: Record<string, { label: string; domain: string }>
  recLookup: Record<
    string,
    {
      title: string
      description: string
      culturalTag: string
      frequency: string
      durationLabel: string
      rationale: string
    }
  >
  notifLookup: Record<string, { title: string; message: string; timeLabel: string }>
  doctorDetails: Record<
    string,
    {
      name: string
      credentials: string
      clinic: string
      city: string
      nextSlot: string
      bio: string
      languages: string
    }
  >
  cohortPatientNotes: Record<
    string,
    {
      city: string
      lastActive: string
      physicalSuggestion: string
      cognitiveSuggestion: string
    }
  >
  coordinatorNoteLookup: Record<string, { author: string; text: string }>
  familyRelativeCommon: Record<string, string>
  sleepNoteCommon: Record<string, string>
  sleepRefreshed: Record<'Refreshed' | 'Moderate' | 'Fatigued', string>
  emergencyHelp: {
    headerAria: string
    headerBtnShort: string
    headerBtn: string
    sidebarTitle: string
    sidebarSub: string
    openAllBtn: string
    modalTitle: string
    modalSub: string
    criticalBannerTitle: string
    criticalBannerDesc: string
    fastSignsTitle: string
    fastSigns: string[]
    trustedContactTitle: string
    trustedContactCallBtn: string
    trustedContactMissing: string
    editTrustedBtn: string
    helplinesHeading: string
    callNowBtn: string
    copyBtn: string
    copiedBtn: string
    websiteDeskNote: string
    clinicalSupportBtn: string
    nationalTag: string
    websiteDemoTag: string
    helplineDetails: Record<
      EmergencyHelplineId,
      {
        title: string
        availability: string
        desc: string
      }
    >
    clinicalCardBadge: string
    clinicalCardTitle: string
    clinicalCardDesc: string
    quickCall112: string
    quickCall108: string
    quickCallElder: string
    viewAllEmergencyBtn: string
    footerEmergencyTitle: string
    footerEmergencyNote: string
    loginFooterPrompt: string
  }
}

export interface MarketingAuthBundle {
  illustration: {
    headerTitle: string
    samplePill: string
    taskPerfLabel: string
    taskPerfVal: string
    sleepMeasuredLabel: string
    sleepMeasuredVal: string
    dailyActivityLabel: string
    dailyActivityVal: string
    selfReportLabel: string
    selfReportVal: string
    trustNote: string
  }
  landing: {
    navWhy: string
    navHow: string
    navFeatures: string
    navFaq: string
    dashboardShort: string
    openDashboard: string
    signIn: string
    getStarted: string
    heroHeadlinePrefix: string
    heroHeadlineAccent: string
    heroSupportText: string
    trustPrivacy: string
    trustNonDiag: string
    trustCultural: string
    whyBadge: string
    whyHeading: string
    whySubheading: string
    whyCards: { title: string; desc: string }[]
    howBadge: string
    howHeading: string
    howSteps: { step: string; title: string; desc: string }[]
    aiMonitorBadge: string
    aiMonitorHeading: string
    aiMonitorDesc: string
    aiMonitorBullets: string[]
    exploreLiveDashBtn: string
    previewChartTitle: string
    previewChartSub: string
    previewChartBadge: string
    previewSeriesName: string
    pillarCards: { title: string; desc: string }[]
    faqBadge: string
    faqHeading: string
    faqs: { q: string; a: string }[]
    footerDesc: string
    footerPlatform: string
    footerLinks: { overview: string; assessment: string; admin: string; signIn: string; createAccount: string }
    footerContactTitle: string
    footerCity: string
    footerProtoLabel: string
    footerCopy: string
    footerEthics: string
  }
  login: {
    welcomeTitle: string
    welcomeSub: string
    emailLabel: string
    emailPlaceholder: string
    passwordLabel: string
    passwordPlaceholder: string
    showPasswordAria: string
    hidePasswordAria: string
    signInBtn: string
    quickAccess: string
    enterDemoBtn: string
    openAdminBtn: string
    newPrompt: string
    createAccountLink: string
    footerLocalNote: string
  }
  register: {
    title: string
    subtitle: string
    safetyBadge: string
    stepDetails: string
    stepPhoneOtp: string
    stepSafeAccount: string
    fullNameLabel: string
    fullNamePlaceholder: string
    emailLabel: string
    emailPlaceholder: string
    passwordLabel: string
    passwordPlaceholder: string
    confirmPasswordLabel: string
    confirmPasswordPlaceholder: string
    passwordsMatch: string
    passwordsMismatch: string
    togglePwAria: string
    strengthStrong: string
    strengthFair: string
    strengthShort: string
    cityLabel: string
    cityPlaceholder: string
    ageRangeLabel: string
    preferredLangLabel: string
    phoneSectionTitle: string
    phoneSectionDesc: string
    countryCodeAria: string
    phoneLabel: string
    phonePlaceholder: string
    sendOtpBtn: string
    sendingOtpBtn: string
    resendOtpBtn: string
    resendInPrefix: string
    otpInputLabel: string
    otpPlaceholder: string
    verifyOtpBtn: string
    verifyingOtpBtn: string
    changePhoneBtn: string
    smsGatewaySentTitle: string
    smsGatewayHint: string
    localSmsConfigHint: string
    demoSmsTitle: string
    demoSmsBodyPrefix: string
    demoSmsExpiryPrefix: string
    phoneVerifiedBadge: string
    phoneVerifiedDesc: string
    safetyContactToggle: string
    emergencyNameLabel: string
    emergencyNamePlaceholder: string
    emergencyPhoneLabel: string
    emergencyPhonePlaceholder: string
    securityBannerTitle: string
    securityBannerDesc: string
    consentLabel: string
    submitBtn: string
    optionalStepNote: string
    alreadyHaveAcct: string
    signInLink: string
  }
  onboarding: {
    stepBadge: string // e.g. "Step {step} of {total}"
    step1Title: string
    step1Sub: string
    cityLabel: string
    cityPlaceholder: string
    goalsQuestion: string
    goalOptions: string[]
    step2Title: string
    step2Sub: string
    sleepTargetLabel: string
    activityBaselineLabel: string
    recommendedTag: string
    step3Title: string
    step3Sub: string
    mentalNoteLabel: string
    mentalNotePlaceholder: string
    healthContextLabel: string
    conditionOptions: string[]
    nonePreferNot: string
    step4Title: string
    step4Sub: string
    addFamilyToggleTitle: string
    addFamilyToggleSub: string
    conditionLabel: string
    relativeLabel: string
    relativePlaceholder: string
    approxAgeLabel: string
    approxAgePlaceholder: string
    genomicSafeguardTitle: string
    genomicSafeguardDesc: string
    step5Title: string
    step5Sub: string
    wearableToggleTitle: string
    wearableToggleSub: string
    demoSyncSuffix: string
    consentItems: {
      healthTitle: string
      healthDesc: string
      familyTitle: string
      familyDesc: string
      reportTitle: string
      reportDesc: string
    }
    skipToDashBtn: string
    nextStepBtn: string
    completeSetupBtn: string
  }
}

export interface DashboardAssessmentGamesBundle {
  dashboard: {
    sampleBaselineBadge: string
    syncSuffix: string
    playGamesBtn: string
    newCheckInBtn: string
    latestAssessment: string
    tasksAELabel: string
    datePrefix: string
    noSessionYet: string
    memoryPerformance: string
    recalledLabel: string
    practiceGamesLabel: string
    loggedRunsLabel: string
    sleepQuality: string
    ratingLabel: string
    targetLabel: string
    physicalActivity: string
    activeExerciseLabel: string
    mentalWellness: string
    moodLabel: string
    stressLabel: string
    functionalQShort: string
    brainProgress: string
    brainProgressDesc: string
    weeklyBtn: string
    monthlyComparisonBtn: string
    tabs: {
      weekly: string
      cognitive: string
      sleep: string
      lifestyle: string
    }
    chartLabels: {
      sleepHrsAxis: string
      stepsKAxis: string
      walkingSeries: string
      sleepSeries: string
      cognitiveTasksSeries: string
      functionalSeries: string
      exerciseSeries: string
      stressSeries: string
    }
    baselineInsightLabel: string
    baselineLast7: string
    baseline14Day: string
    baselineAdvice: string
    deepAnalyticsBtn: string
    reminderBadge: string
    recommendedMorning: string
    reminderTitle: string
    reminderDesc: string
    startCheckInBtn: string
    dailyGoal: string
    recommendedActivities: string
    recommendedActivitiesSub: string
    recentActivity: string
    recentActivitySub: string
    fullHistoryBtn: string
    activityFeed: {
      assessmentTitle: string
      playedSuffix: string
      sleepTitle: string
      lifestyleTitle: string
      accuracySuffix: string
      assessmentKind: string
      gameKind: string
      sleepKind: string
      lifestyleKind: string
    }
  }
  assessment: {
    badge: string
    subtitle: string
    sectionProgress: string
    beforeBeginTitle: string
    beforeBeginDesc: string
    introCards: {
      code: string
      title: string
      desc: string
      isTask: boolean
    }[]
    transparencyTitle: string
    transparencyDesc: string
    beginBtn: string
    categoryTaskPrefix: string
    categoryQuestPrefix: string
    stageA: {
      title: string
      studyDesc: string
      recallDesc: string
      readyBtn: string
      selectedCounter: string
      submitContinueBtn: string
      targets: string[]
      options: string[]
    }
    stageB: {
      title: string
      descPrefix: string
      descHighlight: string
      descSuffix: string
      trialCounter: string
      colorChoices: { key: string; label: string }[]
      trialDisplayWords: string[] // localized color words
    }
    stageC: {
      title: string
      desc: string
      matchLabel: string
      matchesSoFar: string
    }
    stageD: {
      title: string
      desc: string
      questions: { prompt: string; options: string[]; answerIdx: number }[]
    }
    stageE: {
      title: string
      desc: string
      nextTarget: string
      progressLabel: string
      slipsLabel: string
      sequence: string[]
    }
    stageF: {
      title: string
      desc: string
      questions: string[]
      ratingDifficult: string
      ratingModerate: string
      ratingEffortless: string
      completeBtn: string
    }
    complete: {
      title: string
      dateLabel: string
      totalTimeLabel: string
      retakeBtn: string
      viewAnalyticsBtn: string
      objectiveTasksBadge: string
      prevSessionPrefix: string
      baselineEstablished: string
      questionnaireBadge: string
      dailyConfDesc: string
      completionTimeBadge: string
      recordedLocallyDesc: string
      domainBreakdownTitle: string
      domainBreakdownDesc: string
      resultSeriesLabel: string
      planTitle: string
      planDesc: string
      askVoiceCoachBtn: string
      whySuggestedLabel: string
      logActivityBtn: string
      openReportBtn: string
    }
  }
  gamesPage: {
    badge: string
    title: string
    subtitle: string
    sessionsLogged: string
    historicalResultsTitle: string
    pastSessionsFor: string
    emptyHistory: string
    lastPrefix: string
    accSuffix: string
    catalog: Record<GameType, { title: string; subtitle: string; domain: string; metricLabel: string }>
    common: {
      playAgain: string
      savedBanner: string
    }
    numberSeq: {
      desc: string
      bullets: string[]
      startBtn: string
      levelBadge: string
      recallBadge: string
      memorizeHint: string
      placeholder: string
      submitBtn: string
      maxDigitSpan: string
      roundsCleared: string
      gameScore: string
      correctFeedback: string
      wrongFeedback: string
    }
    imageRecall: {
      desc: string
      bullets: string[]
      startBtn: string
      memorizeBadge: string
      remainingSuffix: string
      selectBadge: string
      submitBtn: string
      resultText: string
      items: Record<string, string>
    }
    patternRec: {
      desc: string
      bullets: string[]
      startBtn: string
      roundBadge: string
      watchPattern: string
      selectTiles: string
      gridCellAria: string
      resultText: string
    }
    wordRecall: {
      desc: string
      bullets: string[]
      startBtn: string
      studyBadge: string
      leftSuffix: string
      readyBufferBtn: string
      bufferBadge: string
      bufferQuestion: string
      selectBadge: string
      submitBtn: string
      resultText: string
      wordSets: { targets: string[]; distractors: string[] }[]
    }
    reactionTime: {
      desc: string
      bullets: string[]
      startBtn: string
      trialBadge: string
      previousPrefix: string
      waitGreen: string
      tapNow: string
      tooEarly: string
      retryTrial: string
      trialComplete: string
      nextTrial: string
      meanLatency: string
      fastestTrial: string
      allTrials: string
    }
    memoryPairs: {
      desc: string
      bullets: string[]
      startBtn: string
      previewBadge: string
      startNowBtn: string
      pairsMatchedBadge: string
      movesBadge: string
      cardAria: string
      movesMetricLabel: string
      efficiencyLabel: string
      durationLabel: string
      remainingSuffix: string
    }
    objectLocation: {
      desc: string
      bullets: string[]
      startBtn: string
      studyBadge: string
      readyBtn: string
      remainingSuffix: string
      recallBadge: string
      wherePlacedQuestion: string
      resultText: string
      selectedPrefix: string
      correctPlacePrefix: string
      items: Record<string, string>
      places: Record<string, string>
    }
  }
}

export interface HealthAnalyticsReportsBundle {
  sleepPage: {
    badge: string
    title: string
    subtitle: string
    sevenDayAvg: string
    logTitle: string
    logDesc: string
    savedMsg: string
    dateLabel: string
    bedtimeLabel: string
    wakeTimeLabel: string
    computedDuration: string
    qualityQuestion: string
    morningFeeling: string
    nightAwakenings: string
    screenCheckbox: string
    notesLabel: string
    notesPlaceholder: string
    saveBtn: string
    chartTitle: string
    chartDescPrefix: string
    chartDescSuffix: string
    qualitySeries: string
    durationSeries: string
    tipsTitle: string
    tips: { title: string; desc: string }[]
  }
  lifestylePage: {
    badge: string
    title: string
    subtitle: string
    logTitle: string
    logDesc: string
    savedMsg: string
    dateLabel: string
    exerciseLabel: string
    stepsLabel: string
    hydrationTitle: string
    hydrationTarget: string
    addGlassBtn: string
    foodHabitsLabel: string
    nutritionQuality: string
    foodTags: { id: string; label: string }[]
    socialLabel: string
    relaxationLabel: string
    stressLabel: string
    moodLabel: string
    saveBtn: string
    chartTitle: string
    chartDesc: string
    stepsSeries: string
    stressSeries: string
    tiles: {
      latestWalking: string
      latestHydration: string
      socialTime: string
      relaxation: string
    }
    whyTitle: string
    whyDesc: string
  }
  familyPage: {
    badge: string
    title: string
    subtitle: string
    safeguardTitle: string
    safeguardBody1: string
    safeguardBold: string
    safeguardBody2: string
    formTitle: string
    formDesc: string
    conditionLabel: string
    relationshipLabel: string
    relationshipPlaceholder: string
    onsetAgeLabel: string
    onsetAgePlaceholder: string
    notesLabel: string
    notesPlaceholder: string
    saveBtn: string
    recordsTitle: string
    recordsDesc: string
    emptyText: string
    onsetPrefix: string
    removeAria: string
    consentCardTitle: string
    includePdfTitle: string
    includePdfDesc: string
    genomicTitle: string
    genomicDesc: string
    genomicPlaceholder: string
    genomicProtectedNote: string
  }
  analyticsPage: {
    badge: string
    title: string
    subtitle: string
    weeklyFilter: string
    monthlyFilter: string
    interpretBold: string
    interpretReminder: string
    interpretNoDeclineBold: string
    cardTasksTitle: string
    vsPriorSession: string
    baselineEstablished: string
    cardFuncTitle: string
    selfReportedIndep: string
    cardSleepTitle: string
    avgQuality7d: string
    cardLifestyleTitle: string
    avgStress7d: string
    charts: {
      c1Title: string
      c1Desc: string
      c1Series: string
      c2Title: string
      c2Desc: string
      c2Bar: string
      c2Line: string
      c3Title: string
      c3Desc: string
      c3Bar: string
      c3Line: string
      c4Title: string
      c4Desc: string
      c4Bar: string
      c5Title: string
      c5Desc: string
      c5Mood: string
      c5Stress: string
      c6Title: string
      c6Desc: string
      c6Bar: string
    }
    timelineTitle: string
    timelineDesc: string
    routineNoteFallback: string
    tasksShort: string
    funcQShort: string
  }
  reportPage: {
    title: string
    preparedFor: string
    generatedAt: string
    printViewBtn: string
    legendTitle: string
    sec1Title: string
    sec1Sub: string
    objTaskAcc: string
    funcQuest: string
    gameRuns: string
    sec2Title: string
    sec2Sub: string
    noSessionInfo: string
    sec3Title: string
    avgSteps7d: string
    avgExercise7d: string
    avgStress7d: string
    sec4Title: string
    avgSleep7d: string
    targetShort: string
    sleepQualityLabel: string
    sec5Title: string
    ageBracket: string
    docConditions: string
    noneListed: string
    wearableSync: string
    notConnected: string
    sec6Title: string
    noFamilyIncluded: string
    onsetPrefix: string
    genomicDisabledNote: string
    sec7Title: string
    sec8Title: string
    sec9Title: string
    sec10Title: string
    pdfLabels: {
      bannerTitle: string
      bannerSub: string
      disclaimerHeading: string
      disclaimerText: string
      sec1: string
      sec2: string
      sec3: string
      sec4: string
      sec5: string
      sec6: string
      sec7: string
      taskTypeLabel: string
      questTypeLabel: string
    }
  }
  recommendationsPage: {
    badge: string
    title: string
    subtitle: string
    completedHabits: string
    whyHelps: string
    completedOnPrefix: string
    tapToTrack: string
  }
  historyPage: {
    badge: string
    title: string
    subtitle: string
    exportCsvBtn: string
    newAssessmentBtn: string
    allRecordsTab: string
    assessmentsTab: string
    gamesTab: string
    assessmentsCardTitle: string
    assessmentsCardDesc: string
    durationLabel: string
    routineFallback: string
    gamesCardTitle: string
    tableHeaders: {
      date: string
      game: string
      keyMetric: string
      accuracy: string
      time: string
      source: string
    }
    modalTitlePrefix: string
    kpis: {
      latestTasksTitle: string
      latestFuncTitle: string
      todayActivityTitle: string
      gamesAvgTitle: string
      vsPrior: string
      baselineTag: string
      selfReportedSub: string
      todayDoneSub: string
      noTodaySub: string
      acrossRunsPrefix: string
      runsUnit: string
    }
    todayHub: {
      panelTitle: string
      panelSubtitle: string
      completedTodayBadge: string
      pendingTodayBadge: string
      todaySummaryLine: string
      noTodayTitle: string
      noTodayDesc: string
      startTodayBtn: string
      practiceGamesBtn: string
      logSleepBtn: string
      checklistLabels: {
        assessment: string
        game: string
        sleep: string
        lifestyle: string
      }
      strongestLabel: string
      focusNextLabel: string
      nextSupportTitle: string
      nextSupportSubtitle: string
      sleepReminderTip: string
      sleepOnTrackTip: string
      viewReportBtn: string
      disclaimerNote: string
      domainShort: Record<AssessmentCategoryId, string>
      domainTips: Record<AssessmentCategoryId, string>
    }
    charts: {
      progressTitle: string
      progressDesc: string
      tasksSeries: string
      functionalSeries: string
      baselineLineLabel: string
      domainTitle: string
      domainDesc: string
      selectedSeries: string
      baselineSeries: string
      compareSelectLabel: string
      latestOptionSuffix: string
      gamesTitle: string
      gamesDesc: string
      gameAccuracySeries: string
      gameDurationSeries: string
      durationUnitSec: string
      emptyAssessmentsTitle: string
      emptyAssessmentsDesc: string
      emptyGamesTitle: string
      emptyGamesDesc: string
      goToGamesBtn: string
    }
    sessionExtras: {
      baselineBadge: string
      vsBaselineLabel: string
      inspectInChartBtn: string
      modalSummaryTitle: string
    }
  }
}

export interface AssistantClinicalAdminProfileBundle {
  assistantPage: {
    badgeMl: string
    badgeLangs: string
    title: string
    subtitle: string
    trainModelBtn: string
    resetBtn: string
    voiceChatLangLabel: string
    autoSpeakLabel: string
    dualEnglishLabel: string
    easyReadLabel: string
    langGuaranteeHint: string
    testVoiceBtn: string
    testingVoiceBtn: string
    voiceEngineNative: string
    voiceEnginePhonetic: string
    voiceSpeedRates: {
      calm: string
      normal: string
      brisk: string
    }
    safetyBold: string
    safetyText: string
    safetyNeverDiagnose: string
    mlBadgePrefix: string
    speakBtn: string
    stopSpeaking: string
    listenVoice: string
    listeningNow: string
    typingIndicator: string
    inputPlaceholder: string
    sendBtn: string
    initialGreeting: string
    starterPrompts: string[]
    voiceErrors: {
      noSpeechApi: string
      micBlocked: string
      micNoSpeech: string
      micNoDevice: string
      micServiceBlocked: string
      langFallback: string
      micStartFailed: string
      noTtsApi: string
      spokenSuccessPrefix: string
    }
    trainModal: {
      title: string
      subtitle: string
      probeTitle: string
      probePlaceholder: string
      intentLabel: string
      confidenceLabel: string
      langLabel: string
      teachHeading: string
      intentCategoryLabel: string
      languageFieldLabel: string
      intents: {
        custom: string
        physical: string
        memory: string
        sleep: string
        attention: string
        nutrition: string
        stress: string
        greeting: string
        clinical: string
      }
      samplePhraseLabel: string
      samplePhrasePlaceholder: string
      customResponseLabel: string
      customResponsePlaceholder: string
      addRetrainBtn: string
      corpusSizePrefix: string
      corpusSamplesSuffix: string
      deleteAria: string
    }
  }
  clinicalPage: {
    badge: string
    title: string
    subtitle: string
    noticeBold: string
    noticeBody1: string
    noticeSampleProfiles: string
    noticeBody2: string
    bookingConfirmedPrefix: string
    bookingCodePrefix: string
    searchPlaceholder: string
    nearLocationTitle: string
    nearYouLabel: string
    useLocationBtn: string
    locationDetected: string
    locationFallback: string
    allCities: string
    nearMeOnly: string
    nearYouBadge: string
    allModes: string
    onlineFilter: string
    offlineFilter: string
    sampleProviderBadge: string
    adminManagedBadge: string
    pausedBadge: string
    experienceSuffix: string
    doctorsFoundSuffix: string
    noDoctorsMatch: string
    resetFiltersBtn: string
    localityPinPrefix: string
    nextDemoSlot: string
    languagesLabel: string
    requestApptBtn: string
    bookOnlineQuick: string
    bookOfflineQuick: string
    uploadTitle: string
    uploadDesc: string
    uploadClickPrompt: string
    uploadLocalNote: string
    uploadedPrefix: string
    sharedLabel: string
    privateLabel: string
    historyTitle: string
    historyDesc: string
    modeVideo: string
    modeInClinic: string
    modeOnlineDesc: string
    modeOfflineDescPrefix: string
    modeUnavailable: string
    statusConfirmed: string
    statusPending: string
    statusCompleted: string
    reasonPrefix: string
    consentedShareText: string
    reportNotSharedText: string
    adminStatusHint: string
    modalTitle: string
    modalProviderSuffix: string
    preferredDate: string
    quickDateToday: string
    quickDateTomorrow: string
    quickDatePlus2: string
    quickDatePlus3: string
    timeSlot: string
    consultMode: string
    patientCityLabel: string
    bookingSummaryLabel: string
    discussionGoals: string
    discussionPlaceholder: string
    shareSummaryTitle: string
    shareSummaryDesc: string
    confirmDemoBtn: string
  }
  adminPage: {
    badgePortal: string
    badgeCohort: string
    title: string
    subtitle: string
    enrollBtn: string
    ethicsBold: string
    ethicsText: string
    nudgeActiveUser: string
    nudgeSentPrefix: string
    kpi: {
      cohortBadge: string
      trackedPatients: string
      fullyActivatedSuffix: string
      setupRateBadge: string
      meanActivation: string
      followUpBadge: string
      needsAttentionTitle: string
      followUpHint: string
      sleepCohortBadge: string
      activeSleepAvg: string
      sleepHint: string
    }
    funnelTitle: string
    funnelDesc: string
    funnelSeries: string
    langChartTitle: string
    langChartDesc: string
    langSeries: string
    trackerTitle: string
    trackerDesc: string
    searchPlaceholder: string
    statusFilters: {
      all: string
      incomplete: string
      active: string
      attention: string
    }
    allLanguagesFilter: string
    tableHeaders: {
      patient: string
      langCity: string
      setupActivation: string
      tasksFunc: string
      sleepSteps: string
      status: string
      actions: string
    }
    noWearable: string
    noSleepLog: string
    noSteps: string
    sleepShortSuffix: string
    nudgeBtn: string
    inspectBtn: string
    activeSelfSuffix: string
    liveSessionNow: string
    enrolledJustNow: string
    setupSteps: Record<keyof PatientSetupChecklist, string>
    inspector: {
      defaultTitle: string
      enrolledPrefix: string
      tasksCard: string
      funcQCard: string
      sleepAvgCard: string
      dailyStepsCard: string
      checklistHeading: string
      physicalFocusTitle: string
      cognitiveFocusTitle: string
      notesTitle: string
      notesPlaceholder: string
      saveNoteBtn: string
      noNotes: string
    }
    enrollModal: {
      title: string
      subtitle: string
      fullName: string
      fullNamePlaceholder: string
      email: string
      emailPlaceholder: string
      language: string
      ageRange: string
      city: string
      wearableDevice: string
      noneYet: string
      enrollSubmitBtn: string
    }
    doctorOps: {
      addDoctorBtn: string
      rosterTitle: string
      rosterDesc: string
      activeDoctorsLabel: string
      citiesCoveredLabel: string
      totalBookingsLabel: string
      pendingBookingsLabel: string
      filterCityAll: string
      addedByAdminBadge: string
      sampleDocBadge: string
      activeStatus: string
      pausedStatus: string
      togglePauseBtn: string
      toggleActivateBtn: string
      removeDoctorBtn: string
      slotsLabel: string
      modeOnlineTag: string
      modeOfflineTag: string
      appointmentsTitle: string
      appointmentsDesc: string
      noAppointments: string
      apptHeaders: {
        booking: string
        doctor: string
        schedule: string
        mode: string
        report: string
        status: string
        actions: string
      }
      confirmApptBtn: string
      completeApptBtn: string
      pendingApptBtn: string
      sharedYes: string
      sharedNo: string
      patientFromPrefix: string
      addedBannerPrefix: string
      statusUpdatedBannerPrefix: string
      doctorModal: {
        title: string
        subtitle: string
        fullName: string
        fullNamePlaceholder: string
        specialty: string
        credentials: string
        credentialsPlaceholder: string
        clinic: string
        clinicPlaceholder: string
        city: string
        cityPlaceholder: string
        locality: string
        localityPlaceholder: string
        consultModes: string
        modeBoth: string
        modeOnlineOnly: string
        modeOfflineOnly: string
        languages: string
        languagesPlaceholder: string
        experienceYears: string
        feeInr: string
        nextSlot: string
        nextSlotPlaceholder: string
        availableSlots: string
        bio: string
        bioPlaceholder: string
        submitBtn: string
      }
    }
    auth: {
      gateBadge: string
      gateTitle: string
      gateSubtitle: string
      emailLabel: string
      emailPlaceholder: string
      passwordLabel: string
      passwordPlaceholder: string
      showPasswordAria: string
      hidePasswordAria: string
      signInBtn: string
      invalidError: string
      securityNote: string
      verifiedBadge: string
      lockPortalBtn: string
    }
    cohortGraphs: {
      comparisonTitle: string
      comparisonDesc: string
      tasksBar: string
      funcBar: string
      setupBar: string
      tapBarHint: string
    }
    patientTracker: {
      tapHint: string
      viewActivityBtn: string
      tabGraphsOverview: string
      tabAllActivities: string
      tabSetupNotes: string
      todayActiveBadge: string
      todayActivityCountLabel: string
      sleepAndStepsTitle: string
      sleepAndStepsDesc: string
      cogTrendTitle: string
      cogTrendDesc: string
      domainRadarTitle: string
      domainRadarDesc: string
      sleepSeries: string
      stepsSeries: string
      tasksSeries: string
      funcSeries: string
      strongestSkillLabel: string
      focusAreaLabel: string
      noAssessmentsYet: string
      noWellnessYet: string
      filterAll: string
      activityKinds: {
        assessment: string
        game: string
        sleep: string
        lifestyle: string
        appointment: string
        assistant: string
      }
      templates: {
        completedDrill: string
        nightlyRest: string
        dailyWalk: string
      }
      emptyActivities: string
    }
  }
  profilePage: {
    badge: string
    title: string
    subtitle: string
    logoutBtn: string
    personalCardTitle: string
    savedMsg: string
    fullName: string
    email: string
    phoneNumber: string
    phoneVerifiedBadge: string
    emergencyContactName: string
    emergencyContactPhone: string
    ageRange: string
    preferredLang: string
    cityLocation: string
    sleepGoal: string
    activityLevel: string
    optionalHealthNotes: string
    healthNotesPlaceholder: string
    saveChangesBtn: string
    privacyCardTitle: string
    privacyCardDesc: string
    connectedProviderPrefix: string
    privacyItems: {
      wearableTitle: string
      familyTitle: string
      familyDesc: string
      reportTitle: string
      reportDesc: string
      analyticsTitle: string
      analyticsDesc: string
    }
    notifCardTitle: string
    notifItems: {
      assessmentTitle: string
      assessmentDesc: string
      sleepTitle: string
      sleepDesc: string
      goalTitle: string
      goalDesc: string
    }
    portabilityTitle: string
    portabilityDesc: string
    downloadJsonBtn: string
    restoreSampleBtn: string
    deleteAcctBtn: string
    deleteModalTitle: string
    deleteModalSub: string
    deleteModalBody: string
  }
}

export type FullTranslationBundle = CommonBundle &
  MarketingAuthBundle &
  DashboardAssessmentGamesBundle &
  HealthAnalyticsReportsBundle &
  AssistantClinicalAdminProfileBundle

