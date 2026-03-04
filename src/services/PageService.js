import { dbHelpers } from '../utils/database.js'
import { metaApi } from '../utils/metaApi.js'

/**
 * Page Service
 * Handles all business logic for pages
 */
export class PageService {
  constructor() {
    this.cache = new Map()
    this.cacheTimeout = 5 * 60 * 1000 // 5 minutes
  }

  /**
   * Get all active pages with their tokens
   */
  async getActivePages() {
    const cacheKey = 'active_pages'
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey)
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data
      }
    }

    try {
      const { data, error } = await dbHelpers.fetch('pages', {
        filters: { is_active: true },
        select: '*, tokens(name)',
        orderBy: { column: 'name', ascending: true }
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
      console.error('Error fetching active pages:', error)
      throw error
    }
  }

  /**
   * Get all pages (including inactive)
   */
  async getAllPages() {
    try {
      const { data, error } = await dbHelpers.fetch('pages', {
        select: '*, tokens(name)',
        orderBy: { column: 'created_at', ascending: false }
      })

      if (error) {
        throw new Error(error.message)
      }

      return data || []
    } catch (error) {
      console.error('Error fetching all pages:', error)
      throw error
    }
  }

  /**
   * Toggle page status (active/inactive)
   */
  async togglePageStatus(pageId, isActive) {
    try {
      const { error } = await dbHelpers.update('pages', 
        { is_active: isActive }, 
        { page_id: pageId }
      )

      if (error) {
        throw new Error(error.message)
      }

      // Clear cache
      this.clearCache()
      
      return { success: true }
    } catch (error) {
      console.error('Error toggling page status:', error)
      throw error
    }
  }

  /**
   * Update page category
   */
  async updatePageCategory(pageId, categoryId) {
    try {
      const { error } = await dbHelpers.update('pages', 
        { category_id: categoryId }, 
        { page_id: pageId }
      )

      if (error) {
        throw new Error(error.message)
      }

      // Clear cache
      this.clearCache()
      
      return { success: true }
    } catch (error) {
      console.error('Error updating page category:', error)
      throw error
    }
  }

  /**
   * Sync pages from Meta API
   */
  async syncPagesFromTokens() {
    try {
      // Get active tokens
      const { data: tokens, error: tokenErr } = await dbHelpers.fetch('tokens', {
        filters: { status: 'active' }
      })
      
      if (tokenErr) throw new Error(tokenErr.message)
      if (!tokens || tokens.length === 0) {
        throw new Error('ไม่พบ Token ที่ใช้งานได้')
      }

      let allPagesToUpsert = []
      let totalFetched = 0
      let successfulTokens = 0
      let failedTokens = []

      // Fetch pages from each token with graceful degradation
      for (const token of tokens) {
        try {
          const pages = await metaApi.fetchPages(token.access_token)
          
          pages.forEach(page => {
            allPagesToUpsert.push({
              page_id: page.id,
              name: page.name,
              token_id: token.id
            })
          })
          
          totalFetched += pages.length
          successfulTokens++
          console.log(`✅ Token ${token.name}: ดึงข้อมูล ${pages.length} pages`) 
        } catch (error) {
          console.error(`❌ Token ${token.name} error:`, error.message)
          failedTokens.push({
            tokenName: token.name,
            error: error.message
          })
          // Continue with next token - Graceful degradation
        }
      }

      // Save to database if we have any data
      if (allPagesToUpsert.length > 0) {
        const { error: upsertErr } = await dbHelpers.upsert('pages', allPagesToUpsert, { 
          onConflict: 'page_id' 
        })
        
        if (upsertErr) throw new Error(upsertErr.message)
      }

      // Clear cache
      this.clearCache()
      
      // Return comprehensive result for UI feedback
      return {
        success: true,
        pagesFetched: totalFetched,
        pagesUpserted: allPagesToUpsert.length,
        successfulTokens,
        failedTokens,
        totalTokens: tokens.length,
        hasPartialFailure: failedTokens.length > 0
      }
    } catch (error) {
      console.error('❌ Error syncing pages:', error)
      
      // Provide user-friendly error messages
      if (error.message.includes('Access Token')) {
        throw new Error('Token มีปัญหา: ' + error.message)
      } else if (error.message.includes('Rate Limit')) {
        throw new Error('Facebook API จำกัดการใช้งาน: ' + error.message)
      } else if (error.message.includes('ไม่พบ Token')) {
        throw new Error('กรุณาเพิ่ม Token ก่อนทำการ Sync')
      } else {
        throw error
      }
    }
  }

  /**
   * Get pages by category
   */
  async getPagesByCategory(categoryId) {
    try {
      const { data, error } = await dbHelpers.fetch('pages', {
        filters: { category_id: categoryId, is_active: true },
        select: '*, tokens(name)',
        orderBy: { column: 'name', ascending: true }
      })

      if (error) {
        throw new Error(error.message)
      }

      return data || []
    } catch (error) {
      console.error('Error fetching pages by category:', error)
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
   * Validate page data
   */
  validatePageData(pageData) {
    const errors = []
    
    if (!pageData.page_id) {
      errors.push('Page ID is required')
    }
    
    if (!pageData.name || pageData.name.trim() === '') {
      errors.push('Page name is required')
    }
    
    if (!pageData.token_id) {
      errors.push('Token ID is required')
    }
    
    return {
      isValid: errors.length === 0,
      errors
    }
  }
}
