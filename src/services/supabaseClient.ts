import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const envUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim() || ''
const envKey =
  (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined)?.trim() || ''
const envProjectId =
  (import.meta.env.VITE_SUPABASE_PROJECT_ID as string | undefined)?.trim() || ''

const derivedProjectId = (() => {
  if (envProjectId) return envProjectId
  const match = envUrl.match(/^https:\/\/([a-z0-9-]+)\.supabase\.co/i)
  return match?.[1] ?? ''
})()

export const SUPABASE_CONFIG = {
  isConfigured: Boolean(envUrl && envKey),
  projectId: derivedProjectId,
  url: envUrl,
  restUrl: envUrl ? `${envUrl.replace(/\/+$/, '')}/rest/v1/` : '',
  publishableKey: envKey,
}

export const supabase: SupabaseClient | null = SUPABASE_CONFIG.isConfigured
  ? createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.publishableKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null

export async function testSupabaseGateway(): Promise<{
  ok: boolean
  emailAuthEnabled?: boolean
  phoneAuthEnabled?: boolean
  error?: string
}> {
  if (!SUPABASE_CONFIG.isConfigured) {
    return { ok: false, error: 'Missing Supabase URL or publishable key in .env.local' }
  }
  try {
    const resp = await fetch(`${SUPABASE_CONFIG.url.replace(/\/+$/, '')}/auth/v1/settings`, {
      headers: {
        apikey: SUPABASE_CONFIG.publishableKey,
      },
    })
    if (!resp.ok) {
      return { ok: false, error: `HTTP ${resp.status}` }
    }
    const data = (await resp.json().catch(() => ({}))) as {
      external?: { email?: boolean; phone?: boolean }
    }
    return {
      ok: true,
      emailAuthEnabled: Boolean(data.external?.email),
      phoneAuthEnabled: Boolean(data.external?.phone),
    }
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Network error reaching Supabase',
    }
  }
}

