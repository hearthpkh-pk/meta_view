// Environment configuration
export const config = {
  supabase: {
    url: import.meta.env.VITE_SUPABASE_URL,
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY
  },
  metaApi: {
    version: import.meta.env.VITE_META_API_VERSION || 'v25.0'
  },
  app: {
    name: import.meta.env.VITE_APP_NAME || 'Meta Views',
    version: import.meta.env.VITE_APP_VERSION || '1.0.0'
  }
}

// Validate environment variables
export function validateConfig() {
  const required = ['supabase.url', 'supabase.anonKey']
  const missing = required.filter(key => {
    const keys = key.split('.')
    let value = config
    for (const k of keys) {
      value = value?.[k]
    }
    return !value
  })
  
  if (missing.length > 0) {
    throw new Error(`Missing environment variables: ${missing.join(', ')}`)
  }
}
