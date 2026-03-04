import { BaseComponent } from './BaseComponent.js'

/**
 * Navigation Bar Component
 * Clean Meta Views navigation
 */
export class NavigationBar extends BaseComponent {
  constructor(currentPage = '') {
    super()
    this.currentPage = currentPage
    this.createElement()
    this.setupEventListeners()
  }

  createElement() {
    this.element = document.createElement('nav')
    this.element.className = 'w-full relative z-40'

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
        </div>
      </div>
    `
  }

  setupEventListeners() {
    // Navigation links
    const navLinks = this.findAll('.nav-link')
    navLinks.forEach(link => {
      this.addEventListener(link, 'click', (e) => {
        e.preventDefault()
        const page = e.target.closest('.nav-link').dataset.page
        if (page) {
          window.router?.navigate(page)
        }
      })
    })
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
