/**
 * SPA Router - Handles client-side routing
 */
export class Router {
  constructor() {
    this.routes = new Map()
    this.currentRoute = null
    this.currentPath = window.location.pathname
    this.history = []
    this.maxHistory = 50
    
    this.setupHistoryAPI()
  }

  /**
   * Register a route
   */
  register(path, name, options = {}) {
    this.routes.set(path, {
      name,
      path,
      component: options.component,
      options: {
        title: '',
        meta: {},
        ...options
      }
    })
  }

  /**
   * Navigate to a route
   */
  async navigate(path, state = {}) {
    // Prevent navigation to same route
    if (path === this.currentPath && !state.force) {
      return false
    }

    const route = this.routes.get(path)
    if (!route) {
      console.error(`Route not found: ${path}`)
      return false
    }

    try {
      // Add to history
      this.addToHistory(path, state)
      
      // Update URL
      this.updateURL(path)
      
      // Update current route
      const previousRoute = this.currentRoute
      this.currentRoute = route
      this.currentPath = path
      
      // Update page title
      if (route.options.title) {
        document.title = `${route.options.title} - Meta Views`
      }
      
      // Emit navigation event
      this.emit('navigation', {
        from: previousRoute,
        to: route,
        state
      })
      
      return true
    } catch (error) {
      console.error('Navigation error:', error)
      return false
    }
  }

  /**
   * Go back in history
   */
  back() {
    if (this.history.length > 1) {
      this.history.pop() // Remove current
      const previous = this.history.pop()
      if (previous) {
        this.navigate(previous.path, { force: true })
      }
    }
  }

  /**
   * Go forward in history
   */
  forward() {
    // Implementation for forward navigation
    window.history.forward()
  }

  /**
   * Get current route
   */
  getCurrentRoute() {
    return this.currentRoute
  }

  /**
   * Get current path
   */
  getCurrentPath() {
    return this.currentPath
  }

  /**
   * Setup browser history API
   */
  setupHistoryAPI() {
    // Handle browser back/forward and hash changes
    window.addEventListener('popstate', (e) => {
      const hash = window.location.hash
      const path = hash.replace('#', '') || '/'

      if (path === this.currentPath) {
        return
      }
      
      const route = this.routes.get(path)
      
      if (route) {
        const previousRoute = this.currentRoute // Store previous route
        this.currentRoute = route
        this.currentPath = path
        // Fix payload to match App.js expectation
        this.emit('navigation', { from: previousRoute, to: route, state: {} })
      }
    })
    
    // Handle hash changes
    window.addEventListener('hashchange', (e) => {
      const hash = window.location.hash
      const path = hash.replace('#', '') || '/'
      const route = this.routes.get(path)
      
      if (route) {
        const previousRoute = this.currentRoute // Store previous route
        this.currentRoute = route
        this.currentPath = path
        // Fix payload to match App.js expectation
        this.emit('navigation', { from: previousRoute, to: route, state: {} })
      }
    })
  }

  /**
   * Handle initial route on page load
   */
  handleInitialRoute() {
    // Check hash first for SPA routing
    const hash = window.location.hash
    const path = hash.replace('#', '') || '/'
    
    const route = this.routes.get(path)
    
    if (route) {
      this.currentRoute = route
      this.currentPath = path
      this.addToHistory(path, {})
    } else {
      // Fallback to home page
      const homeRoute = this.routes.get('/')
      if (homeRoute) {
        this.currentRoute = homeRoute
        this.currentPath = '/'
        this.addToHistory('/', {})
        // Set hash to home
        window.location.hash = '/'
      }
    }
  }

  /**
   * Update browser URL
   */
  updateURL(path) {
    const currentHash = window.location.hash
    const targetHash = path === '/' ? '#/' : `#${path}`
    
    if (currentHash !== targetHash) {
      window.location.hash = path === '/' ? '/' : path
    }
  }

  /**
   * Add to navigation history
   */
  addToHistory(path, state) {
    this.history.push({
      path,
      state,
      timestamp: Date.now()
    })
    
    // Limit history size
    if (this.history.length > this.maxHistory) {
      this.history.shift()
    }
  }

  /**
   * Simple event emitter
   */
  emit(event, data) {
    const customEvent = new CustomEvent(`router:${event}`, {
      detail: data
    })
    document.dispatchEvent(customEvent)
  }

  /**
   * Listen to router events
   */
  on(event, callback) {
    document.addEventListener(`router:${event}`, (e) => {
      callback(e.detail)
    })
  }

  /**
   * Get all registered routes
   */
  getRoutes() {
    return Array.from(this.routes.entries()).map(([path, route]) => ({
      path,
      ...route.options
    }))
  }

  /**
   * Check if route exists
   */
  hasRoute(path) {
    return this.routes.has(path)
  }

  /**
   * Get route by path
   */
  getRoute(path) {
    return this.routes.get(path)
  }
}

// Global router instance
export const router = new Router()
