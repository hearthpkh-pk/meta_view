import { BaseComponent } from './BaseComponent.js'
import { authStore, AUTH_KEYS } from '../stores/AuthStore.js'
import { globalState } from '../stores/StateManager.js'

/**
 * Navigation Bar Component
 * Clean Meta Views navigation
 */
export class NavigationBar extends BaseComponent {
  constructor(currentPage = '') {
    super()
    this.currentPage = currentPage

    // Listen to Auth State changes to re-render Navigation if user login/logout
    this.unsubscribeAuth = globalState.subscribe(AUTH_KEYS.USER, () => {
      this.renderFull()
    })

    this.createElement()
    this.setupEventListeners()
  }

  renderFull() {
    this.createElement()
    this.setupEventListeners()
    // Re-attach to DOM if needed
    const navArea = document.getElementById('navigation-area')
    if (navArea) {
      navArea.innerHTML = ''
      navArea.appendChild(this.element)
    }
  }

  createElement() {
    this.element = document.createElement('nav')
    this.element.className = 'w-full relative z-40'

    const user = authStore.getUser()
    const isAuthenticated = !!user

    this.element.innerHTML = `
      <div class="bg-blue-600 text-white w-full shadow-md">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-16 w-full">
          <!-- Logo & Brand -->
          <div class="flex items-center gap-3">
             <svg class="w-8 h-8" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
             </svg>
             <span class="text-xl font-bold tracking-wide">Meta Views</span>
          </div>

          <!-- Navigation Links -->
          <div class="flex space-x-2 h-full items-center">
            <a href="#/" class="relative group p-3 rounded-md transition-colors hover:bg-blue-700 ${this.currentPage === '/' ? 'bg-blue-800' : ''} nav-link flex justify-center items-center" data-page="/">
              <i class="fas fa-cog text-xl"></i>
              <span class="absolute top-full mt-2 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-gray-800 text-white text-xs font-semibold rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 shadow-lg pointer-events-none">
                จัดการเพจ
              </span>
            </a>
            <a href="#/page-groups" class="relative group p-3 rounded-md transition-colors hover:bg-blue-700 ${this.currentPage === '/page-groups' ? 'bg-blue-800' : ''} nav-link flex justify-center items-center" data-page="/page-groups">
              <i class="fas fa-layer-group text-xl"></i>
              <span class="absolute top-full mt-2 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-gray-800 text-white text-xs font-semibold rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 shadow-lg pointer-events-none">
                จัดกรุ๊ปเพจ
              </span>
            </a>
            <a href="#/dashboard" class="relative group p-3 rounded-md transition-colors hover:bg-blue-700 ${this.currentPage === '/dashboard' ? 'bg-blue-800' : ''} nav-link flex justify-center items-center" data-page="/dashboard">
              <i class="fas fa-chart-line text-xl"></i>
              <span class="absolute top-full mt-2 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-gray-800 text-white text-xs font-semibold rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 shadow-lg pointer-events-none">
                สถิติระบบ
              </span>
            </a>
            <a href="#/token-manager" class="relative group p-3 rounded-md transition-colors hover:bg-blue-700 ${this.currentPage === '/token-manager' ? 'bg-blue-800' : ''} nav-link flex justify-center items-center" data-page="/token-manager">
              <i class="fas fa-key text-xl"></i>
              <span class="absolute top-full mt-2 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-gray-800 text-white text-xs font-semibold rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 shadow-lg pointer-events-none">
                จัดการ Token
              </span>
            </a>
            
            ${authStore.hasRole(['super_admin']) ? `
            <a href="#/admin/employees" class="relative group p-3 rounded-md transition-colors hover:bg-blue-700 ${this.currentPage === '/admin/employees' ? 'bg-blue-800' : ''} nav-link flex justify-center items-center" data-page="/admin/employees">
              <i class="fas fa-users-cog text-xl text-yellow-300"></i>
              <span class="absolute top-full mt-2 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-gray-800 text-white text-xs font-semibold rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 shadow-lg pointer-events-none">
                จัดการพนักงาน
              </span>
            </a>
            ` : ''}
            
            ${isAuthenticated ? `
            <div class="h-6 w-px bg-blue-500 mx-2"></div>
            <div class="relative group ml-2">
              <button id="nav-user-menu-btn" class="flex items-center gap-2 text-sm font-medium focus:outline-none p-2 rounded-md transition-colors hover:bg-blue-700">
                <div class="w-8 h-8 rounded-full bg-blue-800 flex items-center justify-center text-white border border-blue-400">
                  <i class="fas fa-user"></i>
                </div>
              </button>
              
              <!-- Dropdown Menu -->
              <div class="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all border border-gray-100">
                <div class="px-4 py-2 border-b border-gray-100">
                  <p class="text-sm text-gray-500">ลงชื่อเข้าใช้ในชื่อ</p>
                  <p class="text-sm font-medium text-gray-900 truncate">${user.email}</p>
                </div>
                <button id="nav-logout-btn" class="w-full text-left block px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2">
                  <i class="fas fa-sign-out-alt"></i> ออกจากระบบ
                </button>
              </div>
            </div>
            ` : ''}

        </div>
      </div>
    `
  }

  setupEventListeners() {
    // Navigation links
    const navLinks = this.findAll('.nav-link')
    navLinks.forEach(link => {
      // Handle click navigation
      this.addEventListener(link, 'click', (e) => {
        e.preventDefault()
        const page = e.target.closest('.nav-link').dataset.page
        if (page) {
          window.router?.navigate(page)
        }
      })

      // Handle hover intent (Zero-Cost Optimization: Prefetch JS Chunks)
      this.addEventListener(link, 'mouseenter', (e) => {
        const page = e.target.closest('.nav-link').dataset.page
        if (page && window.router && typeof window.router.prefetch === 'function') {
          window.router.prefetch(page)
        }
      })
    })

    // Logout handling
    const logoutBtn = this.find('#nav-logout-btn')
    if (logoutBtn) {
      this.addEventListener(logoutBtn, 'click', async () => {
        if (confirm('คุณต้องการออกจากระบบใช่หรือไม่?')) {
          try {
            await authStore.logout()
            window.router?.navigate('/login', { force: true })
          } catch (error) {
            console.error('Logout failed:', error)
          }
        }
      })
    }
  }

  destroy() {
    if (this.unsubscribeAuth) this.unsubscribeAuth()
    super.destroy()
  }

  setActivePage(pageName) {
    const navLinks = this.findAll('.nav-link')
    navLinks.forEach(link => {
      link.classList.remove('bg-blue-800')
      if (link.dataset.page === pageName) {
        link.classList.add('bg-blue-800')
      }
    })
    this.currentPage = pageName
  }

  updateNotificationBadge(count) {
    const notificationIcon = this.find('.fa-bell')
    if (count > 0) {
      // Add badge
      const badge = document.createElement('span')
      badge.className = 'absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center'
      badge.textContent = count > 99 ? '99+' : count
      notificationIcon.parentElement.style.position = 'relative'
      notificationIcon.parentElement.appendChild(badge)
    }
  }

  showLoadingState() {
    const navLinks = this.findAll('.nav-link')
    navLinks.forEach(link => {
      link.style.opacity = '0.5'
      link.style.pointerEvents = 'none'
    })
  }

  hideLoadingState() {
    const navLinks = this.findAll('.nav-link')
    navLinks.forEach(link => {
      link.style.opacity = '1'
      link.style.pointerEvents = 'auto'
    })
  }
}
