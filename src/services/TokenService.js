import { dbHelpers, db } from '../utils/database.js'
import { metaApi } from '../utils/metaApi.js'

/**
 * Token Service
 * Handles all business logic for tokens
 */
export class TokenService {
  constructor() {
    this.cache = new Map()
    this.cacheTimeout = 15 * 60 * 1000 // 15 minutes
  }

  /**
   * Get all tokens
   */
  async getAllTokens() {
    const cacheKey = 'all_tokens'

    // Check cache first
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey)
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data
      }
    }

    try {
      const { data, error } = await dbHelpers.fetch('tokens', {
        orderBy: { column: 'created_at', ascending: false }
      })

      if (error) {
        throw new Error(error.message)
      }

      // Cache the result
      this.cache.set(cacheKey, {
        data: data || [],
        timestamp: Date.now()
      })

      return data || []
    } catch (error) {
      console.error('Error fetching tokens:', error)
      throw error
    }
  }

  /**
   * Get active tokens
   */
  async getActiveTokens() {
    try {
      const { data, error } = await dbHelpers.fetch('tokens', {
        filters: { status: 'active' },
        orderBy: { column: 'created_at', ascending: false }
      })

      if (error) {
        throw new Error(error.message)
      }

      return data || []
    } catch (error) {
      console.error('Error fetching active tokens:', error)
      throw error
    }
  }

  /**
   * Create new token
   */
  async createToken(tokenData) {
    try {
      const validation = this.validateTokenData(tokenData)
      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '))
      }

      // Validate token with Meta API
      const isValid = await metaApi.validateToken(tokenData.access_token)
      if (!isValid) {
        throw new Error('Token ไม่ถูกต้องหรือหมดอายุ')
      }

      const newToken = {
        ...tokenData,
        status: 'active'
      }

      const { error } = await dbHelpers.insert('tokens', [newToken])

      if (error) {
        throw new Error(error.message)
      }

      // Clear cache
      this.clearCache()

      return { success: true, token: newToken }
    } catch (error) {
      console.error('Error creating token:', error)
      throw error
    }
  }

  /**
   * Update token
   */
  async updateToken(tokenId, updateData) {
    try {
      // If updating access token, validate it first
      if (updateData.access_token) {
        const isValid = await metaApi.validateToken(updateData.access_token)
        if (!isValid) {
          throw new Error('Token ไม่ถูกต้องหรือหมดอายุ')
        }
      }

      const validation = this.validateTokenData(updateData)
      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '))
      }

      const { error } = await dbHelpers.update('tokens',
        updateData,
        { id: tokenId }
      )

      if (error) {
        throw new Error(error.message)
      }

      // Clear cache
      this.clearCache()

      return { success: true }
    } catch (error) {
      console.error('Error updating token:', error)
      throw error
    }
  }

  /**
   * Delete token
   */
  async deleteToken(tokenId) {
    try {
      const { error } = await dbHelpers.delete('tokens', { id: tokenId })

      if (error) {
        throw new Error(error.message)
      }

      // Clear cache
      this.clearCache()

      return { success: true }
    } catch (error) {
      console.error('Error deleting token:', error)
      throw error
    }
  }

  /**
   * Toggle token status
   */
  async toggleTokenStatus(tokenId, status) {
    try {
      const { error } = await dbHelpers.update('tokens',
        { status },
        { id: tokenId }
      )

      if (error) {
        throw new Error(error.message)
      }

      // Clear cache
      this.clearCache()

      return { success: true }
    } catch (error) {
      console.error('Error toggling token status:', error)
      throw error
    }
  }

  /**
   * Get token by ID
   */
  async getTokenById(tokenId) {
    try {
      const { data, error } = await dbHelpers.fetch('tokens', {
        filters: { id: tokenId }
      })

      if (error) {
        throw new Error(error.message)
      }

      return data?.[0] || null
    } catch (error) {
      console.error('Error fetching token:', error)
      throw error
    }
  }

  /**
   * Test token validity
   */
  async testToken(accessToken) {
    try {
      const isValid = await metaApi.validateToken(accessToken)
      return { isValid }
    } catch (error) {
      console.error('Error testing token:', error)
      return { isValid: false, error: error.message }
    }
  }

  /**
   * Exchange Short-Lived Token for Long-Lived Token via Edge Function
   */
  async exchangeFacebookToken(shortLivedToken, fbUserId) {
    try {
      // Call the Edge Function automatically handling Auth & Headers via Supabase JS SDK
      const { data, error } = await db.functions.invoke('exchange-fb-token', {
        body: {
          shortLivedToken,
          fbUserId,
          appName: `FB Connected on ${new Date().toLocaleDateString()}`
        }
      })

      if (error) {
        throw new Error(error.message || 'Failed to call edge function')
      }

      if (!data || !data.success) {
        throw new Error(data?.error || 'Failed to exchange token internally')
      }

      this.clearCache() // Invalidate token cache since we just added a new one
      return { success: true, token: data.token }

    } catch (error) {
      console.error('Error in exchangeFacebookToken service:', error)
      throw error
    }
  }

  /**
   * Get pages associated with token
   */
  async getTokenPages(tokenId) {
    try {
      const { data, error } = await dbHelpers.fetch('pages', {
        filters: { token_id: tokenId },
        orderBy: { column: 'name', ascending: true }
      })

      if (error) {
        throw new Error(error.message)
      }

      return data || []
    } catch (error) {
      console.error('Error fetching token pages:', error)
      throw error
    }
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear()
  }

  /**
   * Validate token data
   */
  validateTokenData(tokenData) {
    const errors = []

    if (!tokenData.name || tokenData.name.trim() === '') {
      errors.push('Token name is required')
    }

    if (tokenData.name && tokenData.name.length > 100) {
      errors.push('Token name must be less than 100 characters')
    }

    if (!tokenData.access_token || tokenData.access_token.trim() === '') {
      errors.push('Access token is required')
    }

    if (tokenData.access_token && tokenData.access_token.length < 10) {
      errors.push('Access token appears to be invalid')
    }

    if (tokenData.status && !['active', 'inactive'].includes(tokenData.status)) {
      errors.push('Status must be either "active" or "inactive"')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  /**
   * Format token for display (hide sensitive parts)
   */
  formatTokenForDisplay(token) {
    if (!token || token.length < 15) {
      return token || ''
    }
    return token.substring(0, 15) + '...'
  }
}
