import { globalState } from './StateManager.js'
import { PageService } from '../services/PageService.js'

const CACHE_KEY = 'metaviews_pages_cache'
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

/**
 * Page Store
 * Manages page-related state and business logic
 * Implements Stale-While-Revalidate caching pattern
 */
export class PageStore {
  constructor() {
    this.pageService = new PageService()
    this.stateKey = 'pages'
    this.loadingKey = 'pages_loading'
    this.errorKey = 'pages_error'

    // Initialize state
    globalState.setState(this.stateKey, {
      pages: [],
      activePages: [],
      selectedPage: null,
      filters: {
        isActive: true,
        categoryId: null
      }
    })

    globalState.setState(this.loadingKey, false)
    globalState.setState(this.errorKey, null)
  }

  /**
   * Subscribe to pages state changes
   */
  subscribe(callback) {
    return globalState.subscribe(this.stateKey, callback)
  }

  /**
   * Subscribe to loading state
   */
  subscribeToLoading(callback) {
    return globalState.subscribe(this.loadingKey, callback)
  }

  /**
   * Subscribe to error state
   */
  subscribeToError(callback) {
    return globalState.subscribe(this.errorKey, callback)
  }

  /**
   * Get current state
   */
  getState() {
    return globalState.getState(this.stateKey)
  }

  /**
   * Get loading state
   */
  getLoadingState() {
    return globalState.getState(this.loadingKey)
  }

  /**
   * Get error state
   */
  getErrorState() {
    return globalState.getState(this.errorKey)
  }

  // ---- Cache Helpers ----

  _getCachedPages() {
    try {
      const raw = localStorage.getItem(CACHE_KEY)
      if (!raw) return null
      const cached = JSON.parse(raw)
      // Return cached data regardless of TTL (stale is fine, we revalidate)
      return cached
    } catch {
      return null
    }
  }

  _setCachedPages(pages) {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({
        pages,
        timestamp: Date.now()
      }))
    } catch (e) {
      console.warn('Cache write failed:', e)
    }
  }

  _isCacheFresh() {
    const cached = this._getCachedPages()
    if (!cached) return false
    return (Date.now() - cached.timestamp) < CACHE_TTL
  }

  /**
   * Load all pages (with Stale-While-Revalidate)
   */
  async loadAllPages() {
    try {
      // 1. Try to show cached data IMMEDIATELY (Stale)
      const cached = this._getCachedPages()
      if (cached?.pages?.length > 0) {
        globalState.updateState(this.stateKey, (currentState) => ({
          ...currentState,
          pages: cached.pages
        }))
        console.log('📦 Showing cached data (' + cached.pages.length + ' pages)')

        // If cache is still fresh, skip network call entirely
        if (this._isCacheFresh()) {
          console.log('✅ Cache is fresh, skipping network call')
          return cached.pages
        }
      }

      // 2. Fetch fresh data from network (Revalidate)
      globalState.setState(this.loadingKey, !cached?.pages?.length) // Only show loading if no cache
      globalState.setState(this.errorKey, null)

      const pages = await this.pageService.getAllPages()

      globalState.updateState(this.stateKey, (currentState) => ({
        ...currentState,
        pages
      }))

      // 3. Update cache
      this._setCachedPages(pages)

      return pages
    } catch (error) {
      console.error('❌ Error loading all pages:', error)
      globalState.setState(this.errorKey, error.message)

      // Only clear pages if no cache exists
      const cached = this._getCachedPages()
      if (!cached?.pages?.length) {
        globalState.updateState(this.stateKey, (currentState) => ({
          ...currentState,
          pages: []
        }))
      }

      throw error
    } finally {
      globalState.setState(this.loadingKey, false)
    }
  }

  /**
   * Load active pages
   */
  async loadActivePages() {
    try {
      globalState.setState(this.loadingKey, true)
      globalState.setState(this.errorKey, null)

      const activePages = await this.pageService.getActivePages()

      globalState.updateState(this.stateKey, (currentState) => ({
        ...currentState,
        activePages
      }))

      return activePages
    } catch (error) {
      console.error('❌ Error loading active pages:', error)
      globalState.setState(this.errorKey, error.message)

      // Clear active pages on error to prevent showing stale data
      globalState.updateState(this.stateKey, (currentState) => ({
        ...currentState,
        activePages: []
      }))

      throw error
    } finally {
      globalState.setState(this.loadingKey, false)
    }
  }

  /**
   * Load pages by category
   */
  async loadPagesByCategory(categoryId) {
    try {
      globalState.setState(this.loadingKey, true)
      globalState.setState(this.errorKey, null)

      const pages = await this.pageService.getPagesByCategory(categoryId)

      globalState.updateState(this.stateKey, (currentState) => ({
        ...currentState,
        pages
      }))

      return pages
    } catch (error) {
      globalState.setState(this.errorKey, error.message)
      throw error
    } finally {
      globalState.setState(this.loadingKey, false)
    }
  }

  /**
   * Toggle page status
   */
  async togglePageStatus(pageId, isActive) {
    try {
      globalState.setState(this.loadingKey, true)
      globalState.setState(this.errorKey, null)

      await this.pageService.togglePageStatus(pageId, isActive)

      // Update local state
      globalState.updateState(this.stateKey, (currentState) => ({
        ...currentState,
        pages: currentState.pages.map(page =>
          page.page_id === pageId ? { ...page, is_active: isActive } : page
        ),
        activePages: currentState.activePages.map(page =>
          page.page_id === pageId ? { ...page, is_active: isActive } : page
        )
      }))

      return { success: true }
    } catch (error) {
      globalState.setState(this.errorKey, error.message)
      throw error
    } finally {
      globalState.setState(this.loadingKey, false)
    }
  }

  /**
   * Update page category
   */
  async updatePageCategory(pageId, categoryId) {
    try {
      globalState.setState(this.loadingKey, true)
      globalState.setState(this.errorKey, null)

      await this.pageService.updatePageCategory(pageId, categoryId)

      // Update local state
      globalState.updateState(this.stateKey, (currentState) => ({
        ...currentState,
        pages: currentState.pages.map(page =>
          page.page_id === pageId ? { ...page, category_id: categoryId } : page
        ),
        activePages: currentState.activePages.map(page =>
          page.page_id === pageId ? { ...page, category_id: categoryId } : page
        )
      }))

      return { success: true }
    } catch (error) {
      globalState.setState(this.errorKey, error.message)
      throw error
    } finally {
      globalState.setState(this.loadingKey, false)
    }
  }

  /**
   * Sync pages from tokens
   */
  async syncPagesFromTokens() {
    try {
      globalState.setState(this.loadingKey, true)
      globalState.setState(this.errorKey, null)

      const result = await this.pageService.syncPagesFromTokens()

      // Reload pages to get updated data
      await this.loadAllPages()
      await this.loadActivePages()

      // Provide additional context for partial failures
      if (result.hasPartialFailure) {
        const warningMsg = `Sync สำเร็จแต่มีบาง Token ที่ล้มเหลว: ${result.failedTokens.length}/${result.totalTokens} tokens`
        console.warn('⚠️', warningMsg)
        globalState.setState(this.errorKey, warningMsg)
      }

      return result
    } catch (error) {
      console.error('❌ Error syncing pages from tokens:', error)
      globalState.setState(this.errorKey, error.message)
      throw error
    } finally {
      globalState.setState(this.loadingKey, false)
    }
  }

  /**
   * Select page
   */
  selectPage(page) {
    globalState.updateState(this.stateKey, (currentState) => ({
      ...currentState,
      selectedPage: page
    }))
  }

  /**
   * Clear selection
   */
  clearSelection() {
    globalState.updateState(this.stateKey, (currentState) => ({
      ...currentState,
      selectedPage: null
    }))
  }

  /**
   * Set filters
   */
  setFilters(filters) {
    globalState.updateState(this.stateKey, (currentState) => ({
      ...currentState,
      filters: { ...currentState.filters, ...filters }
    }))
  }

  /**
   * Get filtered pages
   */
  getFilteredPages() {
    const state = this.getState()
    let pages = state.filters.isActive ? state.activePages : state.pages

    if (state.filters.categoryId) {
      pages = pages.filter(page => page.category_id === state.filters.categoryId)
    }

    return pages
  }

  /**
   * Clear error
   */
  clearError() {
    globalState.setState(this.errorKey, null)
  }

  /**
   * Reset store
   */
  reset() {
    globalState.setState(this.stateKey, {
      pages: [],
      activePages: [],
      selectedPage: null,
      filters: {
        isActive: true,
        categoryId: null
      }
    })
    globalState.setState(this.loadingKey, false)
    globalState.setState(this.errorKey, null)
  }
}

// Singleton instance
export const pageStore = new PageStore()
