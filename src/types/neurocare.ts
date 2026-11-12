export type LanguageCode = 'en' | 'kn' | 'hi' | 'ar' | 'ta'

export type AgeRange = '18-29' | '30-44' | '45-54' | '55-64' | '65+'

export type ReportStatusLabel =
  | 'Stable'
  | 'Changed'
  | 'Needs attention'
  | 'Insufficient information'

export type DataDomainKind =
  | 'Task Performance'
  | 'Questionnaire Response'
  | 'Measured / Logged Health'

export interface UserConsents {
  healthProfileConsent: boolean
  familyHistoryConsent: boolean
  wearableSyncConsent: boolean
  clinicianReportShareConsent: boolean
  genomicDataConsent: boolean
  analyticsImprovementConsent: boolean
}

export interface NotificationPrefs {
  assessmentReminders: boolean
  sleepCheckInReminders: boolean
  dailyGoalNudges: boolean
  clinicalUpdates: boolean
}

export interface UserProfile {
  id: string
  fullName: string
  email: string
  phoneNumber?: string
  phoneVerified?: boolean
  emergencyContactName?: string
  emergencyContactPhone?: string
  ageRange: AgeRange
  preferredLanguage: LanguageCode
  city: string
  primaryGoals: string[]
  sleepHabitTargetHours: number
  activityLevel: 'Sedentary' | 'Light' | 'Moderate' | 'Active'
  mentalWellnessBaseline: string
  medicalConditions: string[]
  wearableConnected: boolean
  wearableProvider: 'None' | 'Apple Health' | 'Google Fit' | 'Fitbit' | 'Oura Ring'
  onboardingCompleted: boolean
  consents: UserConsents
  notificationPrefs: NotificationPrefs
  createdAt: string
}

export interface SleepLog {
  id: string
  date: string // YYYY-MM-DD
  durationHours: number
  qualityRating: 1 | 2 | 3 | 4 | 5
  bedtime: string // HH:mm
  wakeTime: string // HH:mm
  awakenings: number
  refreshedRating: 'Refreshed' | 'Moderate' | 'Fatigued'
  screenBeforeBed: boolean
  notes?: string
  isSample?: boolean
}

export interface LifestyleLog {
  id: string
  date: string // YYYY-MM-DD
  exerciseMinutes: number
  walkingSteps: number
  hydrationGlasses: number
  foodQualityRating: 1 | 2 | 3 | 4 | 5
  foodTags: string[]
  socialMinutes: number
  stressLevel: 1 | 2 | 3 | 4 | 5
  moodLevel: 1 | 2 | 3 | 4 | 5
  relaxationMinutes: number
  notes?: string
  isSample?: boolean
}

export type AssessmentCategoryId =
  | 'memory'
  | 'attention'
  | 'processing'
  | 'language'
  | 'executive'
  | 'functional'

export interface AssessmentCategoryResult {
  categoryId: AssessmentCategoryId
  domainType: 'task' | 'questionnaire'
  label: string
  rawScore: number
  maxScore: number
  accuracyPct: number
  avgReactionMs?: number
  completionSeconds: number
  detailSummary: string
}

export interface CognitiveAssessmentSession {
  id: string
  date: string // YYYY-MM-DD
  completedAt: string // ISO
  totalDurationSeconds: number
  taskPerformancePct: number // Categories A-E objective tasks only
  functionalQuestionnairePct: number // Category F self-report only
  categories: AssessmentCategoryResult[]
  contextNote?: string
  isSample?: boolean
}

export type GameType =
  | 'number-sequence'
  | 'image-recall'
  | 'pattern-recognition'
  | 'word-recall'
  | 'reaction-time'
  | 'memory-pairs'
  | 'object-location'

export interface GameResult {
  id: string
  gameType: GameType
  gameName: string
  date: string
  completedAt: string
  score: number
  metricLabel: string
  metricValue: string
  accuracyPct: number
  durationSeconds: number
  levelReached: number
  isSample?: boolean
}

export type FamilyCondition =
  | 'Dementia'
  | "Alzheimer's Disease"
  | 'Stroke'
  | 'Diabetes'
  | 'Hypertension'
  | 'Other Neurological Condition'

export interface FamilyHistoryEntry {
  id: string
  condition: FamilyCondition
  relative: string
  approximateAgeOfOnset?: string
  notes?: string
  addedAt: string
  isSample?: boolean
}

export interface FamilyPrivacySettings {
  includeInClinicianReport: boolean
  genomicInfoProvided: boolean
  genomicConsentAccepted: boolean
  genomicNotes?: string
}

export type RecommendationCategory =
  | 'Cognitive'
  | 'Sleep'
  | 'Physical Activity'
  | 'Stress Management'
  | 'Nutrition'
  | 'Social'
  | 'Clinical Follow-up'

export interface RecommendationItem {
  id: string
  category: RecommendationCategory
  title: string
  description: string
  culturalTag: string
  frequency: string
  durationLabel: string
  rationale: string
  completed: boolean
  completedAt?: string
}

export type SpecialistCategory =
  | 'All'
  | 'Neurologist'
  | 'Cognitive Neuropsychologist'
  | 'Geriatric Psychiatrist'
  | 'Sleep Specialist'
  | 'Preventive Lifestyle Physician'

export type ConsultationChannel = 'online' | 'offline'

export interface DoctorProfile {
  id: string
  name: string
  specialty: Exclude<SpecialistCategory, 'All'>
  credentials: string
  hospitalOrClinic: string
  city: string
  locality?: string
  languages: string[]
  experienceYears: number
  consultationFeeInr: number
  nextAvailableSlot: string
  bio: string
  consultationModes?: ConsultationChannel[]
  availableSlots?: string[]
  acceptingBookings?: boolean
  addedByAdmin?: boolean
  isSampleProvider?: boolean
}

export interface UploadedReport {
  id: string
  fileName: string
  fileSizeKb: number
  category: string
  uploadedAt: string
  sharedWithClinician: boolean
}

export interface ConsultationRecord {
  id: string
  bookingCode?: string
  doctorId: string
  doctorName: string
  specialty: string
  date: string
  timeSlot: string
  mode: 'Video Tele-consult' | 'In-clinic'
  status: 'Confirmed (Demo)' | 'Completed (Sample)' | 'Pending Review (Demo)'
  sharedAssessmentReport: boolean
  reason: string
  patientName?: string
  patientCity?: string
  clinicCity?: string
  clinicLocality?: string
  hospitalOrClinic?: string
  isSample?: boolean
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  englishSummary?: string
  timestamp: string
  suggestedFollowUps?: string[]
  safetyNotice?: string
  mlIntent?: string
  mlConfidence?: number
  language?: LanguageCode
}

export type MLIntentId =
  | 'memory'
  | 'sleep'
  | 'attention'
  | 'physical'
  | 'nutrition'
  | 'stress'
  | 'progress'
  | 'greeting'
  | 'clinical'
  | 'safety_refusal'
  | 'custom'

export interface MLTrainingSample {
  id: string
  intent: MLIntentId
  phrase: string
  language: LanguageCode
  customAnswer?: string
  isDefault?: boolean
}

export interface PatientSetupChecklist {
  accountCreated: boolean
  onboardingCompleted: boolean
  wearableSynced: boolean
  baselineAssessmentDone: boolean
  sleepTrackingActive: boolean
  lifestyleTrackingActive: boolean
  familyContextReviewed: boolean
}

export interface CoordinatorNote {
  id: string
  patientId: string
  author: string
  text: string
  createdAt: string
}

export interface AdminPatientRecord {
  id: string
  fullName: string
  email: string
  phoneNumber?: string
  phoneVerified?: boolean
  emergencyContactName?: string
  emergencyContactPhone?: string
  ageRange: AgeRange
  city: string
  preferredLanguage: LanguageCode
  enrolledDate: string
  lastActiveLabel: string
  status: ReportStatusLabel
  setupChecklist: PatientSetupChecklist
  latestTaskAccuracyPct: number | null
  latestFunctionalPct: number | null
  avgSleepHours7d: number
  avgSteps7d: number
  avgStress7d: number
  assessmentsCount: number
  gamesPlayedCount: number
  wearableProvider: UserProfile['wearableProvider']
  physicalFocusSuggestion: string
  cognitiveFocusSuggestion: string
  nudgeSentCount: number
  isSampleCohort: boolean
}

export interface AppNotification {
  id: string
  title: string
  message: string
  timeLabel: string
  kind: 'reminder' | 'insight' | 'clinical' | 'goal'
  read: boolean
  route: string
}

export interface DailyGoalItem {
  id: string
  label: string
  domain: string
  completed: boolean
}

export interface NeuroCareState {
  isAuthenticated: boolean
  user: UserProfile
  sleepLogs: SleepLog[]
  lifestyleLogs: LifestyleLog[]
  assessments: CognitiveAssessmentSession[]
  gameResults: GameResult[]
  familyHistory: FamilyHistoryEntry[]
  familyPrivacy: FamilyPrivacySettings
  recommendations: RecommendationItem[]
  uploadedReports: UploadedReport[]
  doctors: DoctorProfile[]
  consultations: ConsultationRecord[]
  chatHistory: ChatMessage[]
  notifications: AppNotification[]
  dailyGoals: DailyGoalItem[]
  mlTrainingSamples: MLTrainingSample[]
  adminCohort: AdminPatientRecord[]
  coordinatorNotes: CoordinatorNote[]
}

