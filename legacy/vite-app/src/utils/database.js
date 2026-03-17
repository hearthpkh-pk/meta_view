import { createClient } from '@supabase/supabase-js'
import { config, validateConfig } from './config.js'

// Validate configuration on import
validateConfig()

// Create Supabase client (Public / Anon)
export const db = createClient(config.supabase.url, config.supabase.anonKey)


// Simple In-Memory Cache Store for SWR (Stale-While-Revalidate)
const queryCache = new Map()

// Helper to generate a unique cache key based on table and options
const generateCacheKey = (table, options) => {
  return `${table}-${JSON.stringify(options)}`
}

// Database helper functions
export const dbHelpers = {
  // Generic fetch function with SWR Caching
  async fetch(table, options = {}, enableCache = true) {
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

    // 1. SWR Cache Setup
    const cacheKey = enableCache ? generateCacheKey(table, options) : null
    let cachedData = null

    // 2. Return Stale Data immediately if available
    if (enableCache && queryCache.has(cacheKey)) {
      cachedData = queryCache.get(cacheKey)
      // We don't return here. We let the UI use cached data, but proceed to revalidate.
    }

    // 3. Revalidate (Fetch fresh data in background)
    const fetchPromise = query.then(({ data, error }) => {
      if (!error && enableCache) {
        // Update Cache with fresh data
        queryCache.set(cacheKey, { data, timestamp: Date.now() })
      }
      return { data, error }
    })

    // If we have cached data, return it immediately along with a trigger for the fresh promise
    // To keep it simple and backward compatible with existing code expecting {data, error},
    // We will return cached data instantly. The UI will re-render if we had a reactive store, 
    // but since this is Vanilla JS, we just return the cache. 
    // *Actual SWR in Vanilla JS requires callbacks or event emitters*.
    // For pure zero-cost instant load without rewriting all UI components:

    if (cachedData) {
      // Execute fetch in background to silently update cache for the *next* time
      fetchPromise.catch(console.error)
      return { data: cachedData.data, error: null, isCached: true }
    }

    // If no cache, await the fresh fetch
    const { data, error } = await fetchPromise
    return { data, error, isCached: false }
  },

  // Generic insert function
  async insert(table, data) {
    const { data: result, error } = await db.from(table).insert(data)
    if (!error) this.invalidateCache(table)
    return { data: result, error }
  },

  // Generic update function
  async update(table, data, filters) {
    let query = db.from(table).update(data)

    Object.entries(filters).forEach(([key, value]) => {
      query = query.eq(key, value)
    })

    const { data: result, error } = await query
    if (!error) this.invalidateCache(table)
    return { data: result, error }
  },

  // Generic upsert function
  async upsert(table, data, options = {}) {
    const { data: result, error } = await db.from(table).upsert(data, options)
    if (!error) this.invalidateCache(table)
    return { data: result, error }
  },

  // Generic delete function
  async delete(table, filters) {
    let query = db.from(table).delete()

    Object.entries(filters).forEach(([key, value]) => {
      query = query.eq(key, value)
    })

    const { error } = await query
    if (!error) this.invalidateCache(table)
    return { error }
  },

  // Cache Invalidation utility
  invalidateCache(table) {
    for (const key of queryCache.keys()) {
      if (key.startsWith(`${table}-`)) {
        queryCache.delete(key)
      }
    }
  }
}
