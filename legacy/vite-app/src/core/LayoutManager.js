import { NavigationBar } from '../components/NavigationBar.js'
import { Notification } from '../components/Notification.js'

/**
 * Layout Manager - Manages shared layout components
 */
export class LayoutManager {
  constructor() {
    this.container = null
    this.navigationBar = null
    this.contentArea = null
    this.loadingOverlay = null
    this.currentLayout = null
    this.init()
  }

  init() {
    this.createContainer()
    this.createLoadingOverlay()
  }

  /**
   * Create main layout container
   */
  createContainer() {
    // Remove existing app layout if exists
    const existingLayout = document.getElementById('app-layout')
    if (existingLayout) {
      existingLayout.remove()
    }

    this.container = document.createElement('div')
    this.container.id = 'app-layout'
    this.container.className = 'app-layout'

    this.container.innerHTML = `
      <!-- Navigation Area -->
      <div id="navigation-area"></div>
      
      <!-- Loading Overlay -->
      <div id="loading-overlay" class="hidden fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
        <div class="bg-white p-6 rounded-lg shadow-lg">
          <div class="flex items-center gap-3">
            <div class="w-6 h-6 border-2 border-gray-200 border-t-blue-600 rounded-full animate-spin"></div>
            <span class="text-gray-700 text-sm">กำลังโหลด...</span>
          </div>
        </div>
      </div>
      
      <!-- Main Content Area -->
      <main id="main-content" class="app-main">
        <!-- Page content will be injected here -->
      </main>
    `

    document.body.appendChild(this.container)

    // Cache element references
    this.contentArea = document.getElementById('main-content')
    this.loadingOverlay = document.getElementById('loading-overlay')
  }

  /**
   * Create loading overlay
   */
  createLoadingOverlay() {
    // Already created in createContainer()
  }

  /**
   * Setup navigation bar
   */
  setupNavigation(currentPath) {
    const navArea = document.getElementById('navigation-area')

    // Remove existing navigation
    if (this.navigationBar) {
      this.navigationBar.destroy()
    }

    // Create new navigation with current path
    this.navigationBar = new NavigationBar(currentPath || '/')
    navArea.appendChild(this.navigationBar.element)

    return this.navigationBar
  }

  /**
   * Set current page component and render it
   */
  async setPage(pageComponent, path) {
    try {
      // 1. Clear old content
      this.clearContent()

      // 2. Update navigation to match current path
      this.setupNavigation(path)

      // 3. Set element reference for component before rendering
      if (this.contentArea) {
        pageComponent.element = this.contentArea
      }

      // 4. Render component (handle both string and DOM element)
      if (typeof pageComponent.render === 'function') {
        const content = await pageComponent.render()
        if (typeof content === 'string') {
          this.setContent(content)
        } else if (content instanceof Node) {
          this.contentArea.appendChild(content)
        }
      }

      // 5. Call mount method if exists (for event listeners and data loading)
      if (typeof pageComponent.mount === 'function') {
        await pageComponent.mount()
      }

      // 6. Add page animations
      this.addPageAnimations()

    } catch (error) {
      console.error('❌ Error setting page:', error)
      this.showError('ไม่สามารถแสดงหน้า: ' + error.message)
    }
  }

  /**
   * Update document title dynamically
   */
  updatePageTitle(title) {
    if (title) {
      document.title = `${title} - Meta Views`
    }
  }

  /**
   * Update navigation active state
   */
  updateNavigation(pageName) {
  }

  /**
   * Set page content
   */
  setContent(content) {
    if (this.contentArea) {
      this.contentArea.innerHTML = content
    }
  }

  /**
   * Append content to main area
   */
  appendContent(content) {
    if (this.contentArea) {
      const tempDiv = document.createElement('div')
      tempDiv.innerHTML = content
      while (tempDiv.firstChild) {
        this.contentArea.appendChild(tempDiv.firstChild)
      }
    }
  }

  /**
   * Clear content
   */
  clearContent() {
    if (this.contentArea) {
      this.contentArea.innerHTML = ''
    }
  }

  /**
   * Show loading state
   */
  showLoading(message = 'กำลังโหลด...') {
    if (this.loadingOverlay) {
      const messageElement = this.loadingOverlay.querySelector('span')
      if (messageElement) {
        messageElement.textContent = message
      }
      this.loadingOverlay.classList.remove('hidden')
    }
  }

  /**
   * Hide loading state
   */
  hideLoading() {
    if (this.loadingOverlay) {
      this.loadingOverlay.classList.add('hidden')
    }
  }

  /**
   * Show success notification
   */
  showSuccess(message) {
    Notification.show(message, 'success')
  }

  /**
   * Show error state
   */
  showError(message, title = 'เกิดข้อผิดพลาด') {
    this.clearContent()
    const errorHTML = `
      <div class="max-w-md mx-auto mt-20 px-4">
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-10 text-center">
          <i class="fas fa-exclamation-triangle text-4xl text-red-400 mb-4"></i>
          <h2 class="text-xl font-semibold text-gray-800 mb-2">${title}</h2>
          <p class="text-sm text-gray-500 mb-6">${message}</p>
          <button onclick="location.reload()" class="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg text-sm font-medium transition">
            <i class="fas fa-refresh mr-2"></i>รีเฟรชหน้า
          </button>
        </div>
      </div>
    `
    this.setContent(errorHTML)
  }

  /**
   * Show not found state
   */
  showNotFound(path) {
    this.clearContent()
    const notFoundHTML = `
      <div class="max-w-md mx-auto mt-20 px-4">
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-10 text-center">
          <i class="fas fa-search text-4xl text-gray-300 mb-4"></i>
          <h2 class="text-xl font-semibold text-gray-800 mb-2">ไม่พบหน้านี้</h2>
          <p class="text-sm text-gray-500 mb-6">ไม่พบหน้า: <code class="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs font-mono">${path}</code></p>
          <div class="flex gap-3 justify-center">
            <a href="/" class="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg text-sm font-medium transition">
              <i class="fas fa-home mr-2"></i>หน้าหลัก
            </a>
            <button onclick="history.back()" class="bg-gray-100 hover:bg-gray-200 text-gray-700 px-5 py-2 rounded-lg text-sm font-medium transition border border-gray-200">
              <i class="fas fa-arrow-left mr-2"></i>กลับ
            </button>
          </div>
        </div>
      </div>
    `
    this.setContent(notFoundHTML)
  }

  /**
   * Update navigation active state
   */
  updateNavigation(pageName) {
    if (this.navigationBar) {
      this.navigationBar.setActivePage(pageName)
    }
  }

  /**
   * Get navigation bar instance
   */
  getNavigation() {
    return this.navigationBar
  }

  /**
   * Get content area element
   */
  getContentArea() {
    return this.contentArea
  }

  /**
   * Destroy layout manager
   */
  destroy() {
    if (this.navigationBar) {
      this.navigationBar.destroy()
    }

    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container)
    }

    this.container = null
    this.navigationBar = null
    this.contentArea = null
    this.loadingOverlay = null
  }
}

// Global layout manager instance
export const layoutManager = new LayoutManager()
