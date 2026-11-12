import type { Session } from '@supabase/supabase-js'
import schemaSql from '../../supabase/migrations/20261112000000_neurocare_schema.sql?raw'
import { SUPABASE_CONFIG, supabase, testSupabaseGateway } from '@/services/supabaseClient'
import type { AgeRange, LanguageCode, NeuroCareState } from '@/types/neurocare'

export type CloudSyncStatus =
  | 'local-only'
  | 'syncing'
  | 'synced'
  | 'schema-missing'
  | 'needs-verification'
  | 'error'

export const NEUROCARE_SCHEMA_SQL = schemaSql

export function isSyntheticDemoEmail(email: string): boolean {
  const lower = email.trim().toLowerCase()
  return (
    lower.endsWith('@example.com') ||
    lower.endsWith('@example.org') ||
    lower.endsWith('@example.net') ||
    lower.endsWith('@neurocare-demo.in') ||
    lower.endsWith('.local')
  )
}

function isMissingSchemaError(
  err: { code?: string; message?: string; status?: number } | null | undefined,
  status?: number
): boolean {
  if (status === 404) return true
  if (!err) return false
  return (
    err.code === 'PGRST205' ||
    err.code === '42P01' ||
    Boolean(err.message?.includes('schema cache')) ||
    Boolean(err.message?.includes('does not exist'))
  )
}

export async function getActiveSupabaseSession(): Promise<Session | null> {
  if (!supabase) return null
  const { data } = await supabase.auth.getSession()
  return data.session ?? null
}

export async function signUpSupabaseAccount(payload: {
  email: string
  password: string
  fullName: string
  phoneNumber?: string
  city?: string
  ageRange?: AgeRange
  preferredLanguage?: LanguageCode
}): Promise<{
  ok: boolean
  session: Session | null
  needsEmailConfirmation?: boolean
  error?: string
}> {
  if (!supabase) {
    return { ok: false, session: null, error: 'Supabase not configured' }
  }
  const { data, error } = await supabase.auth.signUp({
    email: payload.email.trim(),
    password: payload.password,
    options: {
      data: {
        full_name: payload.fullName.trim(),
        phone_number: payload.phoneNumber?.trim() || null,
        city: payload.city?.trim() || null,
        age_range: payload.ageRange || '45-54',
        preferred_language: payload.preferredLanguage || 'en',
      },
    },
  })
  if (error) {
    return { ok: false, session: null, error: error.message }
  }
  return {
    ok: true,
    session: data.session ?? null,
    needsEmailConfirmation: !data.session && Boolean(data.user),
  }
}

export async function signInSupabaseAccount(
  email: string,
  password: string
): Promise<{
  ok: boolean
  session: Session | null
  error?: string
}> {
  if (!supabase) {
    return { ok: false, session: null, error: 'Supabase not configured' }
  }
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  })
  if (error) {
    return { ok: false, session: null, error: error.message }
  }
  return { ok: true, session: data.session ?? null }
}

export async function signOutSupabaseAccount(): Promise<void> {
  if (!supabase) return
  await supabase.auth.signOut().catch(() => undefined)
}

export async function pullCloudState(userId: string): Promise<{
  ok: boolean
  state?: Partial<NeuroCareState>
  updatedAt?: string
  schemaMissing?: boolean
  error?: string
}> {
  if (!supabase) {
    return { ok: false, error: 'Supabase not configured' }
  }
  const { data, error } = await supabase
    .from('neurocare_snapshots')
    .select('state, updated_at')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) {
    if (isMissingSchemaError(error)) {
      return { ok: false, schemaMissing: true, error: error.message }
    }
    return { ok: false, error: error.message }
  }

  if (!data || !data.state) {
    return { ok: true }
  }

  return {
    ok: true,
    state: data.state as Partial<NeuroCareState>,
    updatedAt: data.updated_at as string,
  }
}

export async function pushCloudState(
  userId: string,
  state: NeuroCareState
): Promise<{
  ok: boolean
  syncedAt?: string
  schemaMissing?: boolean
  error?: string
}> {
  if (!supabase) {
    return { ok: false, error: 'Supabase not configured' }
  }

  const nowIso = new Date().toISOString()

  const { error: snapErr } = await supabase.from('neurocare_snapshots').upsert(
    {
      user_id: userId,
      email: state.user.email,
      state,
      updated_at: nowIso,
    },
    { onConflict: 'user_id' }
  )

  if (snapErr) {
    if (isMissingSchemaError(snapErr)) {
      return { ok: false, schemaMissing: true, error: snapErr.message }
    }
    return { ok: false, error: snapErr.message }
  }

  // Also sync normalized relational tables cleanly in parallel (RLS enforced per auth.uid())
  const ops: Promise<unknown>[] = []

  ops.push(
    Promise.resolve(
      supabase.from('profiles').upsert(
        {
          id: userId,
          full_name: state.user.fullName,
          email: state.user.email,
          phone_number: state.user.phoneNumber ?? null,
          phone_verified: Boolean(state.user.phoneVerified),
          emergency_contact_name: state.user.emergencyContactName ?? null,
          emergency_contact_phone: state.user.emergencyContactPhone ?? null,
          age_range: state.user.ageRange,
          preferred_language: state.user.preferredLanguage,
          city: state.user.city,
          primary_goals: state.user.primaryGoals,
          sleep_habit_target_hours: state.user.sleepHabitTargetHours,
          activity_level: state.user.activityLevel,
          mental_wellness_baseline: state.user.mentalWellnessBaseline,
          medical_conditions: state.user.medicalConditions,
          wearable_connected: state.user.wearableConnected,
          wearable_provider: state.user.wearableProvider,
          onboarding_completed: state.user.onboardingCompleted,
          consents: state.user.consents,
          notification_prefs: state.user.notificationPrefs,
          updated_at: nowIso,
        },
        { onConflict: 'id' }
      )
    )
  )

  if (state.sleepLogs.length > 0) {
    ops.push(
      Promise.resolve(
        supabase.from('sleep_logs').upsert(
          state.sleepLogs.map((s) => ({
            id: `${userId}_${s.id}`,
            user_id: userId,
            date: s.date,
            duration_hours: s.durationHours,
            quality_rating: s.qualityRating,
            bedtime: s.bedtime,
            wake_time: s.wakeTime,
            awakenings: s.awakenings,
            refreshed_rating: s.refreshedRating,
            screen_before_bed: s.screenBeforeBed,
            notes: s.notes ?? null,
            is_sample: Boolean(s.isSample),
          })),
          { onConflict: 'id' }
        )
      )
    )
  }

  if (state.lifestyleLogs.length > 0) {
    ops.push(
      Promise.resolve(
        supabase.from('lifestyle_logs').upsert(
          state.lifestyleLogs.map((l) => ({
            id: `${userId}_${l.id}`,
            user_id: userId,
            date: l.date,
            exercise_minutes: l.exerciseMinutes,
            walking_steps: l.walkingSteps,
            hydration_glasses: l.hydrationGlasses,
            food_quality_rating: l.foodQualityRating,
            food_tags: l.foodTags,
            social_minutes: l.socialMinutes,
            stress_level: l.stressLevel,
            mood_level: l.moodLevel,
            relaxation_minutes: l.relaxationMinutes,
            notes: l.notes ?? null,
            is_sample: Boolean(l.isSample),
          })),
          { onConflict: 'id' }
        )
      )
    )
  }

  if (state.assessments.length > 0) {
    ops.push(
      Promise.resolve(
        supabase.from('cognitive_assessments').upsert(
          state.assessments.map((a) => ({
            id: `${userId}_${a.id}`,
            user_id: userId,
            date: a.date,
            completed_at: a.completedAt,
            total_duration_seconds: a.totalDurationSeconds,
            task_performance_pct: a.taskPerformancePct,
            functional_questionnaire_pct: a.functionalQuestionnairePct,
            categories: a.categories,
            context_note: a.contextNote ?? null,
            is_sample: Boolean(a.isSample),
          })),
          { onConflict: 'id' }
        )
      )
    )
  }

  if (state.gameResults.length > 0) {
    ops.push(
      Promise.resolve(
        supabase.from('game_results').upsert(
          state.gameResults.map((g) => ({
            id: `${userId}_${g.id}`,
            user_id: userId,
            game_type: g.gameType,
            game_name: g.gameName,
            date: g.date,
            completed_at: g.completedAt,
            score: g.score,
            metric_label: g.metricLabel,
            metric_value: g.metricValue,
            accuracy_pct: g.accuracyPct,
            duration_seconds: g.durationSeconds,
            level_reached: g.levelReached,
            is_sample: Boolean(g.isSample),
          })),
          { onConflict: 'id' }
        )
      )
    )
  }

  if (state.familyHistory.length > 0) {
    ops.push(
      Promise.resolve(
        supabase.from('family_history_entries').upsert(
          state.familyHistory.map((f) => ({
            id: `${userId}_${f.id}`,
            user_id: userId,
            condition: f.condition,
            relative: f.relative,
            approximate_age_of_onset: f.approximateAgeOfOnset ?? null,
            notes: f.notes ?? null,
            added_at: f.addedAt,
            is_sample: Boolean(f.isSample),
          })),
          { onConflict: 'id' }
        )
      )
    )
  }

  if (state.consultations.length > 0) {
    ops.push(
      Promise.resolve(
        supabase.from('consultations').upsert(
          state.consultations.map((c) => ({
            id: `${userId}_${c.id}`,
            user_id: userId,
            booking_code: c.bookingCode ?? null,
            doctor_id: c.doctorId,
            doctor_name: c.doctorName,
            specialty: c.specialty,
            date: c.date,
            time_slot: c.timeSlot,
            mode: c.mode,
            status: c.status,
            shared_assessment_report: c.sharedAssessmentReport,
            reason: c.reason,
            patient_name: c.patientName ?? null,
            patient_city: c.patientCity ?? null,
            clinic_city: c.clinicCity ?? null,
            clinic_locality: c.clinicLocality ?? null,
            hospital_or_clinic: c.hospitalOrClinic ?? null,
            is_sample: Boolean(c.isSample),
          })),
          { onConflict: 'id' }
        )
      )
    )
  }

  await Promise.allSettled(ops)

  return { ok: true, syncedAt: nowIso }
}

export async function probeSupabaseBackend(): Promise<{
  gatewayOk: boolean
  schemaReady: boolean
  error?: string
}> {
  const gw = await testSupabaseGateway()
  if (!gw.ok || !supabase) {
    return { gatewayOk: false, schemaReady: false, error: gw.error }
  }
  try {
    // Query a schema-defined table readable by anon+authenticated (GET returns JSON PGRST205 when uninitialized)
    const { error, status } = await supabase
      .from('doctors')
      .select('id')
      .limit(1)

    if (error && isMissingSchemaError(error, status)) {
      return {
        gatewayOk: true,
        schemaReady: false,
        error: error.message || 'Database tables not initialized yet (PGRST205)',
      }
    }
    if (status === 404) {
      return {
        gatewayOk: true,
        schemaReady: false,
        error: 'Database tables not initialized yet (HTTP 404)',
      }
    }
    return { gatewayOk: true, schemaReady: true }
  } catch (err) {
    return {
      gatewayOk: true,
      schemaReady: false,
      error: err instanceof Error ? err.message : 'Unable to verify database tables',
    }
  }
}

export interface CloudSyncLabels {
  title: string
  subtitle: string
  projectIdLabel: string
  endpointLabel: string
  statusLabels: Record<CloudSyncStatus, string>
  testBtn: string
  syncNowBtn: string
  pullBtn: string
  copySqlBtn: string
  copiedSqlBtn: string
  sqlGuideTitle: string
  sqlGuideDesc: string
  connectTitle: string
  emailPlaceholder: string
  passwordPlaceholder: string
  signInBtn: string
  signUpBtn: string
  disconnectBtn: string
  connectedAsPrefix: string
  lastSyncedPrefix: string
  notConfigured: string
  readyMessage: string
}

export const CLOUD_SYNC_LABELS: Record<LanguageCode, CloudSyncLabels> = {
  en: {
    title: 'Supabase Backend & Cloud Database Sync',
    subtitle: `Project ${SUPABASE_CONFIG.projectId || 'Supabase'} — save cognitive scores, sleep logs, lifestyle metrics, and appointments to Postgres with Row-Level Security.`,
    projectIdLabel: 'Project ID',
    endpointLabel: 'REST Endpoint',
    statusLabels: {
      'local-only': 'Local Browser Mode (Sign in to sync to Supabase)',
      syncing: 'Syncing with Supabase...',
      synced: 'Connected & Synced to Supabase Cloud',
      'schema-missing': 'API Reachable — Run Setup SQL in Supabase Studio',
      'needs-verification': 'Check your email to confirm Supabase Auth before syncing',
      error: 'Cloud Sync Paused (Saved safely locally)',
    },
    testBtn: 'Test Connection',
    syncNowBtn: 'Sync Now',
    pullBtn: 'Load Cloud Data',
    copySqlBtn: 'Copy Setup SQL',
    copiedSqlBtn: 'SQL Copied!',
    sqlGuideTitle: 'One-Time Database Table Setup',
    sqlGuideDesc:
      'Open your Supabase Dashboard → SQL Editor, paste the copied schema SQL, and click Run once to create all 9 NeuroCare tables with RLS protection.',
    connectTitle: 'Connect Supabase Cloud Session',
    emailPlaceholder: 'Your email address',
    passwordPlaceholder: 'Password (min 6 chars)',
    signInBtn: 'Sign In to Cloud',
    signUpBtn: 'Create Cloud Account',
    disconnectBtn: 'Disconnect Cloud Session',
    connectedAsPrefix: 'Signed in to cloud as',
    lastSyncedPrefix: 'Last synced:',
    notConfigured: 'Add VITE_SUPABASE_URL & VITE_SUPABASE_PUBLISHABLE_KEY in .env.local',
    readyMessage: 'Supabase API & tables verified ready.',
  },
  kn: {
    title: 'Supabase ಬ್ಯಾಕೆಂಡ್ ಮತ್ತು ಕ್ಲೌಡ್ ಡೇಟಾಬೇಸ್ ಸಿಂಕ್',
    subtitle: `ಪ್ರಾಜೆಕ್ಟ್ ${SUPABASE_CONFIG.projectId || 'Supabase'} — ನಿಮ್ಮ ನಿದ್ರೆ, ಜೀವನಶೈಲಿ ಮತ್ತು ಅರಿವಿನ ದಾಖಲೆಗಳನ್ನು RLS ಭದ್ರತೆಯೊಂದಿಗೆ Postgres ನಲ್ಲಿ ಉಳಿಸಿ.`,
    projectIdLabel: 'ಪ್ರಾಜೆಕ್ಟ್ ಐಡಿ',
    endpointLabel: 'REST ಎಂಡ್‌ಪಾಯಿಂಟ್',
    statusLabels: {
      'local-only': 'ಸ್ಥಳೀಯ ಬ್ರೌಸರ್ ಮೋಡ್ (ಕ್ಲೌಡ್ ಸಿಂಕ್‌ಗೆ ಸೈನ್ ಇನ್ ಮಾಡಿ)',
      syncing: 'Supabase ನೊಂದಿಗೆ ಸಿಂಕ್ ಆಗುತ್ತಿದೆ...',
      synced: 'Supabase ಕ್ಲೌಡ್‌ಗೆ ಸಂಪರ್ಕಗೊಂಡಿದೆ ಮತ್ತು ಸಿಂಕ್ ಆಗಿದೆ',
      'schema-missing': 'API ಸಿದ್ಧವಾಗಿದೆ — Supabase SQL ಎಡಿಟರ್‌ನಲ್ಲಿ Setup SQL ರನ್ ಮಾಡಿ',
      'needs-verification': 'ಸಿಂಕ್ ಮಾಡುವ ಮೊದಲು ನಿಮ್ಮ ಇಮೇಲ್ ದೃಢೀಕರಿಸಿ',
      error: 'ಕ್ಲೌಡ್ ಸಿಂಕ್ ವಿಫಲವಾಗಿದೆ (ಸ್ಥಳೀಯವಾಗಿ ಸುರಕ್ಷಿತವಾಗಿ ಉಳಿಸಲಾಗಿದೆ)',
    },
    testBtn: 'ಸಂಪರ್ಕ ಪರೀಕ್ಷಿಸಿ',
    syncNowBtn: 'ಈಗ ಸಿಂಕ್ ಮಾಡಿ',
    pullBtn: 'ಕ್ಲೌಡ್ ಡೇಟಾ ಲೋಡ್ ಮಾಡಿ',
    copySqlBtn: 'Setup SQL ನಕಲಿಸಿ',
    copiedSqlBtn: 'SQL ನಕಲಿಸಲಾಗಿದೆ!',
    sqlGuideTitle: 'ಒಂದು ಬಾರಿಯ ಡೇಟಾಬೇಸ್ ಟೇಬಲ್ ಸೆಟಪ್',
    sqlGuideDesc:
      'Supabase Dashboard → SQL Editor ತೆರೆದು, ನಕಲಿಸಿದ SQL ಅನ್ನು ಪೇಸ್ಟ್ ಮಾಡಿ ಮತ್ತು Run ಒತ್ತಿ.',
    connectTitle: 'Supabase ಕ್ಲೌಡ್ ಖಾತೆ ಸಂಪರ್ಕಿಸಿ',
    emailPlaceholder: 'ನಿಮ್ಮ ಇಮೇಲ್ ವಿಳಾಸ',
    passwordPlaceholder: 'ಪಾಸ್‌ವರ್ಡ್ (ಕನಿಷ್ಠ 6 ಅಕ್ಷರಗಳು)',
    signInBtn: 'ಕ್ಲೌಡ್‌ಗೆ ಸೈನ್ ಇನ್',
    signUpBtn: 'ಕ್ಲೌಡ್ ಖಾತೆ ರಚಿಸಿ',
    disconnectBtn: 'ಕ್ಲೌಡ್ ಸಂಪರ್ಕ ಕಡಿತಗೊಳಿಸಿ',
    connectedAsPrefix: 'ಕ್ಲೌಡ್‌ಗೆ ಸೈನ್ ಇನ್ ಆಗಿದೆ:',
    lastSyncedPrefix: 'ಕೊನೆಯ ಸಿಂಕ್:',
    notConfigured: '.env.local ನಲ್ಲಿ Supabase ಕೀಗಳನ್ನು ಸೇರಿಸಿ',
    readyMessage: 'Supabase API ಮತ್ತು ಡೇಟಾಬೇಸ್ ಟೇಬಲ್‌ಗಳು ಸಿದ್ಧವಾಗಿವೆ.',
  },
  hi: {
    title: 'Supabase बैकएंड और क्लाउड डेटाबेस सिंक',
    subtitle: `प्रोजेक्ट ${SUPABASE_CONFIG.projectId || 'Supabase'} — संज्ञानात्मक स्कोर, नींद और जीवनशैली डेटा को RLS सुरक्षा के साथ Postgres में सहेजें।`,
    projectIdLabel: 'प्रोजेक्ट आईडी',
    endpointLabel: 'REST एंडपॉइंट',
    statusLabels: {
      'local-only': 'लोकल ब्राउज़र मोड (सिंक करने के लिए साइन इन करें)',
      syncing: 'Supabase से सिंक हो रहा है...',
      synced: 'Supabase क्लाउड से जुड़ा और सिंक हुआ',
      'schema-missing': 'API चालू है — Supabase SQL Editor में Setup SQL चलाएँ',
      'needs-verification': 'सिंक से पहले अपना ईमेल सत्यापित करें',
      error: 'क्लाउड सिंक रुका हुआ है (लोकल में सुरक्षित सहेजा गया)',
    },
    testBtn: 'कनेक्शन जाँचें',
    syncNowBtn: 'अभी सिंक करें',
    pullBtn: 'क्लाउड डेटा लोड करें',
    copySqlBtn: 'Setup SQL कॉपी करें',
    copiedSqlBtn: 'SQL कॉपी हुआ!',
    sqlGuideTitle: 'एक-बार डेटाबेस टेबल सेटअप',
    sqlGuideDesc:
      'Supabase Dashboard → SQL Editor खोलें, कॉपी किया गया SQL पेस्ट करें और Run दबाएँ।',
    connectTitle: 'Supabase क्लाउड खाता जोड़ें',
    emailPlaceholder: 'आपका ईमेल पता',
    passwordPlaceholder: 'पासवर्ड (न्यूनतम 6 अक्षर)',
    signInBtn: 'क्लाउड साइन इन',
    signUpBtn: 'क्लाउड खाता बनाएँ',
    disconnectBtn: 'क्लाउड सत्र हटाएँ',
    connectedAsPrefix: 'क्लाउड में साइन इन:',
    lastSyncedPrefix: 'अंतिम सिंक:',
    notConfigured: '.env.local में Supabase कुंजी जोड़ें',
    readyMessage: 'Supabase API और डेटाबेस टेबल तैयार हैं।',
  },
  ar: {
    title: 'واجهة Supabase الخلفية ومزامنة قاعدة البيانات السحابية',
    subtitle: `المشروع ${SUPABASE_CONFIG.projectId || 'Supabase'} — احفظ التقييمات وسجلات النوم ونمط الحياة في Postgres مع حماية RLS.`,
    projectIdLabel: 'معرّف المشروع',
    endpointLabel: 'نقطة نهاية REST',
    statusLabels: {
      'local-only': 'وضع المتصفح المحلي (سجّل الدخول للمزامنة مع Supabase)',
      syncing: 'جارٍ المزامنة مع Supabase...',
      synced: 'متصل ومتزامن مع سحابة Supabase',
      'schema-missing': 'واجهة API متصلة — شغّل كود SQL للإعداد في Supabase',
      'needs-verification': 'يرجى تأكيد بريدك الإلكتروني قبل المزامنة',
      error: 'توقفت المزامنة السحابية (تم الحفظ محلياً بأمان)',
    },
    testBtn: 'اختبار الاتصال',
    syncNowBtn: 'مزامنة الآن',
    pullBtn: 'تحميل من السحابة',
    copySqlBtn: 'نسخ SQL الإعداد',
    copiedSqlBtn: 'تم نسخ SQL!',
    sqlGuideTitle: 'إعداد جداول قاعدة البيانات لمرة واحدة',
    sqlGuideDesc:
      'افتح Supabase Dashboard ← SQL Editor، الصق كود SQL المنسوخ، ثم اضغط Run لإنشاء الجداول التسعة مع سياسات RLS.',
    connectTitle: 'ربط جلسة Supabase السحابية',
    emailPlaceholder: 'البريد الإلكتروني',
    passwordPlaceholder: 'كلمة المرور (6 أحرف على الأقل)',
    signInBtn: 'تسجيل الدخول للسحابة',
    signUpBtn: 'إنشاء حساب سحابي',
    disconnectBtn: 'قطع الاتصال السحابي',
    connectedAsPrefix: 'تم الدخول إلى السحابة باسم',
    lastSyncedPrefix: 'آخر مزامنة:',
    notConfigured: 'أضف مفاتيح Supabase في ملف .env.local',
    readyMessage: 'واجهة Supabase وجداول قاعدة البيانات جاهزة ومتصلة.',
  },
  ta: {
    title: 'Supabase பேக்எண்ட் & கிளவுட் தரவுத்தள ஒத்திசைவு',
    subtitle: `திட்டம் ${SUPABASE_CONFIG.projectId || 'Supabase'} — அறிவாற்றல் மதிப்பெண்கள், தூக்கம் & வாழ்க்கை முறை பதிவுகளை RLS பாதுகாப்புடன் Postgres இல் சேமிக்கவும்.`,
    projectIdLabel: 'திட்ட ஐடி',
    endpointLabel: 'REST முனையம்',
    statusLabels: {
      'local-only': 'உள்ளூர் உலாவி முறை (கிளவுட் ஒத்திசைவுக்கு உள்நுழையவும்)',
      syncing: 'Supabase உடன் ஒத்திசைக்கப்படுகிறது...',
      synced: 'Supabase கிளவுடுடன் இணைக்கப்பட்டு ஒத்திசைக்கப்பட்டது',
      'schema-missing': 'API தயாராக உள்ளது — Supabase SQL Editor-ல் Setup SQL இயக்கவும்',
      'needs-verification': 'ஒத்திசைக்கும் முன் உங்கள் மின்னஞ்சலை உறுதிப்படுத்தவும்',
      error: 'கிளவுட் ஒத்திசைவு நிறுத்தப்பட்டது (உள்ளூரில் பாதுகாப்பாக சேமிக்கப்பட்டது)',
    },
    testBtn: 'இணைப்பைச் சோதி',
    syncNowBtn: 'இப்போது ஒத்திசை',
    pullBtn: 'கிளவுட் தரவை ஏற்று',
    copySqlBtn: 'Setup SQL நகலெடு',
    copiedSqlBtn: 'SQL நகலெடுக்கப்பட்டது!',
    sqlGuideTitle: 'ஒருமுறை தரவுத்தள அட்டவணை அமைப்பு',
    sqlGuideDesc:
      'Supabase Dashboard → SQL Editor திறந்து, நகலெடுத்த SQL-ஐ ஒட்டி Run பொத்தானை அழுத்தவும்.',
    connectTitle: 'Supabase கிளவுட் அமர்வை இணைக்கவும்',
    emailPlaceholder: 'உங்கள் மின்னஞ்சல் முகவரி',
    passwordPlaceholder: 'கடவுச்சொல் (குறைந்தது 6 எழுத்துகள்)',
    signInBtn: 'கிளவுடில் உள்நுழை',
    signUpBtn: 'கிளவுட் கணக்கு உருவாக்கு',
    disconnectBtn: 'கிளவுட் இணைப்பைத் துண்டி',
    connectedAsPrefix: 'கிளவுடில் உள்நுழைந்துள்ளது:',
    lastSyncedPrefix: 'கடைசி ஒத்திசைவு:',
    notConfigured: '.env.local கோப்பில் Supabase விசைகளைச் சேர்க்கவும்',
    readyMessage: 'Supabase API மற்றும் தரவுத்தள அட்டவணைகள் தயாராக உள்ளன.',
  },
}

