import { router } from './core/Router.js'
import { layoutManager } from './core/LayoutManager.js'
import { Notification } from './components/Notification.js'
import { authStore } from './stores/AuthStore.js'

/**
 * Main App Component - Root application component
 */
export class App {
  constructor() {
    this.currentPage = null
    this.pageComponent = null
    this.isInitialized = false
    this.init()
  }

  async init() {
    if (this.isInitialized) return

    try {
      // Setup global router reference
      window.router = router

      // Register routes
      this.registerRoutes()

      // Initialize Auth Store BEFORE first render
      await authStore.init()

      // Setup navigation listeners
      this.setupNavigationListeners()

      // Handle initial route
      await this.handleInitialRoute()

      // Force navigation to trigger initial render
      const startPath = window.location.hash.replace('#', '') || '/'
      await this.navigate(startPath, { force: true })

      this.isInitialized = true
      console.log('✅ App initialized successfully')

    } catch (error) {
      console.error('❌ Failed to initialize app:', error)
      layoutManager.showError('ไม่สามารถเริ่มแอปพลิเคชัน: ' + error.message)
    }
  }

  registerRoutes() {
    // PUBLIC ROUTES
    router.register('/login', 'LoginPage', {
      title: 'เข้าสู่ระบบ',
      component: () => import('./pages/LoginPage.js'),
      auth: false
    })

    // PROTECTED ROUTES
    router.register('/', 'IndexPage', {
      title: 'จัดการเพจ',
      component: () => import('./pages/IndexPage.js'),
      auth: true
    })

    router.register('/dashboard', 'DashboardPage', {
      title: 'Analytics Dashboard',
      component: () => import('./pages/DashboardPage.js'),
      auth: true
    })

    router.register('/page-groups', 'PageGroupsPage', {
      title: 'จัดการกรุ๊ปเพจ',
      component: () => import('./pages/PageGroupsPage.js'),
      auth: true
    })

    // ADMIN ONLY ROUTE
    router.register('/token-manager', 'TokenManagerPage', {
      title: 'จัดการ Token',
      component: () => import('./pages/TokenManagerPage.js'),
      auth: true,
      roles: ['super_admin', 'admin']
    })

    router.register('/admin/employees', 'EmployeeAdminPage', {
      title: 'จัดการพนักงาน',
      component: () => import('./pages/EmployeeAdminPage.js'),
      auth: true,
      roles: ['super_admin']
    })
  }

  setupNavigationListeners() {
    // Listen to navigation events
    router.on('navigation', async ({ to, from }) => {
      console.log(`🧭 Navigating from ${from?.path || '/'} to ${to.path}`)

      // Always hide loading first to prevent stuck state
      layoutManager.hideLoading()

      try {

        // CHECK AUTH & ROUTE GUARDS 🛡️
        if (to.options.auth) {
          if (!authStore.isAuthenticated()) {
            console.warn('🔒 Unauthorized access. Redirecting to login.');
            this.navigate('/login', { force: true });
            return;
          }

          // Check RBAC Roles
          if (to.options.roles && to.options.roles.length > 0) {
            if (!authStore.hasRole(to.options.roles)) {
              console.warn('⛔ Forbidden: Insufficient Permissions.');
              layoutManager.showError('คุณไม่มีสิทธิ์เข้าถึงหน้านี้', 'warning');
              this.navigate('/', { force: true });
              return;
            }
          }
        }

        let PageClass

        // --- Enhanced error handling for dynamic imports ---
        try {
          if (typeof to.component === 'function') {
            const module = await to.component().catch(err => {
              // Catch Chunk Load Error
              const isChunkError = err.message.includes('Failed to fetch dynamically imported module')
                || err.message.includes('Loading chunk')
                || err.name === 'TypeError'
                || err.message.includes('Network error')

              if (isChunkError) {
                console.warn('⚠️ ตรวจพบการเปลี่ยนแปลงของไฟล์ระบบ (Chunk Error). กำลังรีเฟรชเพื่อโหลดเวอร์ชันล่าสุด...')

                // Graceful recovery with hard reload
                window.location.reload(true)
                throw new Error('กำลังอัปเดตระบบ โปรดรอสักครู่...')
              }
              throw err
            })

            PageClass = module.default || Object.values(module)[0]
          } else {
            PageClass = to.component
          }
        } catch (moduleError) {
          throw new Error(`โหลดองค์ประกอบหน้าไม่สำเร็จ: ${moduleError.message}`)
        }
        // -------------------------------------------------

        if (!PageClass) {
          throw new Error('ไม่พบ Page Component สำหรับหน้านี้')
        }

        const pageComponent = new PageClass()

        // Set page in layout
        await layoutManager.setPage(pageComponent, to.path)

        // Update page title
        if (to.options.title) {
          layoutManager.updatePageTitle(to.options.title)
        }

        // Update current page reference
        this.currentPage = to.path
        this.pageComponent = pageComponent

        // Emit page loaded event
        this.emit('pageLoaded', { page: to.path, component: pageComponent })

      } catch (error) {
        console.error('❌ Error loading page:', error)

        // Always hide loading on error
        layoutManager.hideLoading()

        // Show user-friendly error
        layoutManager.showError('ไม่สามารถโหลดหน้า: ' + error.message)
      }
    })
  }

  async handleInitialRoute() {
    const currentPath = window.location.pathname

    // Handle hash-based routing for fallback
    if (currentPath === '/' || currentPath === '/index.html') {
      window.location.hash = '#/'
      return
    }

    // Check if route exists
    if (!router.hasRoute(currentPath)) {
      // Try to find matching route
      const pathSegments = currentPath.split('/').filter(Boolean)
      const possiblePaths = ['/', '/dashboard', '/page-groups', '/token-manager']

      let matchedPath = null
      for (const path of possiblePaths) {
        if (currentPath.includes(path) || path === '/') {
          matchedPath = path
          break
        }
      }

      if (matchedPath) {
        window.location.hash = matchedPath
      } else {
        // Show 404
        layoutManager.showNotFound(currentPath)
      }
    }
  }

  /**
   * Navigate to a specific route
   */
  async navigate(path, state = {}) {
    return await router.navigate(path, state)
  }

  /**
   * Get current route information
   */
  getCurrentRoute() {
    return router.getCurrentRoute()
  }

  /**
   * Get current path
   */
  getCurrentPath() {
    return router.getCurrentPath()
  }

  /**
   * Go back in history
   */
  back() {
    router.back()
  }

  /**
   * Go forward in history
   */
  forward() {
    router.forward()
  }

  /**
   * Simple event emitter
   */
  emit(event, data) {
    const customEvent = new CustomEvent(`app:${event}`, {
      detail: data
    })
    document.dispatchEvent(customEvent)
  }

  /**
   * Listen to app events
   */
  on(event, callback) {
    document.addEventListener(`app:${event}`, (e) => {
      callback(e.detail)
    })
  }

  /**
   * Get all registered routes
   */
  getRoutes() {
    return router.getRoutes()
  }

  /**
   * Check if app is initialized
   */
  isReady() {
    return this.isInitialized
  }

  /**
   * Destroy app
   */
  destroy() {
    if (this.pageComponent) {
      this.pageComponent.destroy()
    }

    layoutManager.destroy()
    this.currentPage = null
    this.pageComponent = null
    this.isInitialized = false
  }
}

// Global app instance
export const app = new App()

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    // App will auto-initialize
  })
} else {
  // App will auto-initialize
}

// Export for potential external use
export { app as default }
