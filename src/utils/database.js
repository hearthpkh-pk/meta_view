import { createClient } from '@supabase/supabase-js'
import { config, validateConfig } from './config.js'

// Validate configuration on import
validateConfig()

// Create Supabase client (Public / Anon)
export const db = createClient(config.supabase.url, config.supabase.anonKey)

// Create Admin Supabase client (Service Role) - Lazy initialized
let adminDbInstance = null
export const getAdminDb = () => {
  if (!config.supabase.serviceKey || config.supabase.serviceKey === 'YOUR_SUPABASE_SERVICE_ROLE_KEY') {
    throw new Error('Supabase Service Role Key is not configured in .env')
  }

  if (!adminDbInstance) {
    adminDbInstance = createClient(config.supabase.url, config.supabase.serviceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  }
  return adminDbInstance
}

// Database helper functions
export const dbHelpers = {
  // Generic fetch function
  async fetch(table, options = {}) {
    const { select = '*', filters = {}, orderBy = {} } = options

    let query = db.from(table).select(select)

    // Apply filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (typeof value === 'object') {
          // Handle range filters like { gte: startDate, lte: endDate }
          Object.entries(value).forEach(([operator, val]) => {
            if (operator === 'gte') query = query.gte(key, val)
            else if (operator === 'lte') query = query.lte(key, val)
            else if (operator === 'gt') query = query.gt(key, val)
            else if (operator === 'lt') query = query.lt(key, val)
            else if (operator === 'like') query = query.like(key, val)
            else if (operator === 'ilike') query = query.ilike(key, val)
            else if (operator === 'in') query = query.in(key, val)
          })
        } else {
          // Handle simple equality filters
          query = query.eq(key, value)
        }
      }
    })

    // Apply ordering
    if (orderBy.column) {
      query = query.order(orderBy.column, { ascending: orderBy.ascending ?? true })
    }

    const { data, error } = await query
    return { data, error }
  },

  // Generic insert function
  async insert(table, data) {
    const { data: result, error } = await db.from(table).insert(data)
    return { data: result, error }
  },

  // Generic update function
  async update(table, data, filters) {
    let query = db.from(table).update(data)

    Object.entries(filters).forEach(([key, value]) => {
      query = query.eq(key, value)
    })

    const { data: result, error } = await query
    return { data: result, error }
  },

  // Generic upsert function
  async upsert(table, data, options = {}) {
    const { data: result, error } = await db.from(table).upsert(data, options)
    return { data: result, error }
  },

  // Generic delete function
  async delete(table, filters) {
    let query = db.from(table).delete()

    Object.entries(filters).forEach(([key, value]) => {
      query = query.eq(key, value)
    })

    const { error } = await query
    return { error }
  }
}
