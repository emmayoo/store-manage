type ViteEnv = {
  VITE_SUPABASE_URL?: string
  VITE_SUPABASE_ANON_KEY?: string
}

const env = import.meta.env as unknown as ViteEnv

function required(name: keyof ViteEnv) {
  const value = env[name]
  if (!value) throw new Error(`Missing env: ${name}`)
  return value
}

export const ENV = {
  SUPABASE_URL: required('VITE_SUPABASE_URL'),
  SUPABASE_ANON_KEY: required('VITE_SUPABASE_ANON_KEY'),
}

