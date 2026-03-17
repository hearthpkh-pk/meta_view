import { BaseComponent } from '../components/BaseComponent.js'
import { layoutManager } from '../core/LayoutManager.js'

/**
 * App Layout - Main application layout component
 */
export class AppLayout extends BaseComponent {
  constructor() {
    super()
    this.currentPage = null
    this.pageComponent = null
    this.isLoading = false
    this.createElement()
  }

  createElement() {
    this.element = document.createElement('div')
    this.element.id = 'app-layout'
    this.element.className = 'app-layout'
    
    // Layout will be managed by LayoutManager
    this.element.innerHTML = `
      <!-- Navigation will be inserted by LayoutManager -->
      <div id="navigation-container"></div>
      
      <!-- Main content area -->
      <main id="app-main" class="app-main">
        <!-- Page content will be injected here -->
        <div id="page-content">
          <!-- Loading state -->
          <div class="loading-container">
            <div class="loading-spinner"></div>
            <p>กำลังโหลด...</p>
          </div>
        </div>
      </main>
    `
  }

  /**
   * Set current page
   */
  async setPage(pageComponent, pageName) {
    try {
      this.showLoading()
      
      // Destroy previous page component
      if (this.pageComponent) {
        this.pageComponent.destroy()
      }
      
      // Set new page
      this.pageComponent = pageComponent
      this.currentPage = pageName
      
      // Render page content
      await this.renderPage()
      
      // Update navigation
      this.updateNavigation(pageName)
      
      this.hideLoading()
      
    } catch (error) {
      console.error('Error setting page:', error)
      this.showError(error.message)
    }
  }

  /**
   * Render page content
   */
  async renderPage() {
    if (!this.pageComponent) return
    
    const contentArea = document.getElementById('page-content')
    if (!contentArea) return
    
    // Clear current content
    contentArea.innerHTML = ''
    
    // Render page component
    const pageElement = document.createElement('div')
    pageElement.innerHTML = this.pageComponent.render()
    
    // Mount page
    contentArea.appendChild(pageElement)
    
    // Call page mount method if exists
    if (typeof this.pageComponent.mount === 'function') {
      await this.pageComponent.mount()
    }
    
    // Add page animations
    this.addPageAnimations()
  }

  /**
   * Update navigation active state
   */
  updateNavigation(pageName) {
    const navigation = layoutManager.getNavigation()
    if (navigation) {
      navigation.setActivePage(pageName)
    }
  }

  /**
   * Show loading state
   */
  showLoading() {
    this.isLoading = true
    layoutManager.showLoading()
    
    // Update loading state in content area
    const contentArea = document.getElementById('page-content')
    if (contentArea) {
      contentArea.innerHTML = `
        <div class="flex items-center justify-center min-h-screen">
          <div class="text-center">
            <div class="loading-spinner w-8 h-8 mx-auto mb-4"></div>
            <p class="text-gray-600">กำลังโหลด...</p>
          </div>
        </div>
      `
    }
  }

  /**
   * Hide loading state
   */
  hideLoading() {
    this.isLoading = false
    layoutManager.hideLoading()
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
    this.hideLoading()
    
    const contentArea = document.getElementById('page-content')
    if (contentArea) {
      contentArea.innerHTML = `
        <div class="flex items-center justify-center min-h-screen">
          <div class="text-center p-8">
            <div class="text-6xl mb-4">⚠️</div>
            <h2 class="text-2xl font-bold text-red-600 mb-4">${title}</h2>
            <p class="text-gray-600 mb-6">${message}</p>
            <button onclick="location.reload()" class="btn-primary">
              <i class="fas fa-refresh mr-2"></i>รีเฟรชหน้า
            </button>
          </div>
        </div>
      `
    }
  }

  /**
   * Add page transition animations
   */
  addPageAnimations() {
    const contentArea = document.getElementById('page-content')
    if (contentArea) {
      contentArea.classList.add('animate-fade-in')
      
      // Remove animation class after completion
      setTimeout(() => {
        contentArea.classList.remove('animate-fade-in')
      }, 300)
    }
  }

  /**
   * Get current page component
   */
  getCurrentPage() {
    return this.pageComponent
  }

  /**
   * Get current page name
   */
  getCurrentPageName() {
    return this.currentPage
  }

  /**
   * Check if currently loading
   */
  isLoadingState() {
    return this.isLoading
  }

  /**
   * Update page title
   */
  updatePageTitle(title) {
    if (title) {
      document.title = `${title} - Meta Views`
    }
  }

  /**
   * Handle page lifecycle
   */
  async onPageLeave() {
    if (this.pageComponent && typeof this.pageComponent.unmount === 'function') {
      await this.pageComponent.unmount()
    }
  }

  /**
   * Destroy app layout
   */
  destroy() {
    if (this.pageComponent) {
      this.pageComponent.destroy()
    }
    
    super.destroy()
  }
}

// Global app layout instance
export const appLayout = new AppLayout()
