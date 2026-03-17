import { BaseComponent } from '../components/BaseComponent.js'
import { authStore, AUTH_KEYS } from '../stores/AuthStore.js'
import { globalState } from '../stores/StateManager.js'
import { router } from '../core/Router.js'
import { layoutManager } from '../core/LayoutManager.js'

export default class LoginPage extends BaseComponent {
  constructor() {
    super()
    this.name = 'LoginPage'
    // Will load HTML layout
  }

  async render() {
    // Basic Layout Strategy (Replace Sidebar with Centered Login)
    const loginHtml = `
      <div class="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div class="sm:mx-auto sm:w-full sm:max-w-md text-center">
          <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
            ลงชื่อเข้าใช้ระบบ
          </h2>
          <p class="mt-2 text-center text-sm text-gray-600">
            Meta Views Analytics & Management
          </p>
        </div>

        <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div class="bg-white py-8 px-4 shadow-xl sm:rounded-lg sm:px-10 border border-gray-100">
            
            <div id="login-error-container" class="hidden mb-4 p-4 rounded-md bg-red-50 border border-red-200">
              <div class="flex">
                <div class="flex-shrink-0">
                  <svg class="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                  </svg>
                </div>
                <div class="ml-3">
                  <h3 class="text-sm font-medium text-red-800" id="login-error-message">
                    There was an error with your submission
                  </h3>
                </div>
              </div>
            </div>

            <form class="space-y-6" id="login-form">
              <div>
                <label for="email" class="block text-sm font-medium text-gray-700">
                  อีเมลพนักงาน
                </label>
                <div class="mt-1">
                  <input id="email" name="email" type="email" autocomplete="email" required class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors duration-200">
                </div>
              </div>

              <div>
                <label for="password" class="block text-sm font-medium text-gray-700">
                  รหัสผ่าน
                </label>
                <div class="mt-1">
                  <input id="password" name="password" type="password" autocomplete="current-password" required class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors duration-200">
                </div>
              </div>

              <div class="flex items-center justify-between">
                <div class="flex items-center">
                  <input id="remember-me" name="remember-me" type="checkbox" class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded">
                  <label for="remember-me" class="ml-2 block text-sm text-gray-900">
                    จดจำฉันไว้ในระบบ
                  </label>
                </div>

                <div class="text-sm">
                  <a href="#" class="font-medium text-indigo-600 hover:text-indigo-500 transition-colors">
                    ลืมรหัสผ่าน?
                  </a>
                </div>
              </div>

              <div>
                <button type="submit" id="login-submit-btn" class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 disabled:opacity-50">
                  เข้าสู่ระบบ
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    `
    setTimeout(() => this.setupEvents(), 0)
    return loginHtml
  }

  setupEvents() {
    // Hide standard layout elements (Sidebar, Header) if they exist
    const layoutWrapper = document.getElementById('layout-wrapper')
    const sidebar = document.getElementById('main-sidebar')
    const header = document.getElementById('main-header')

    if (sidebar) sidebar.style.display = 'none'
    if (header) header.style.display = 'none'
    if (layoutWrapper) {
      layoutWrapper.classList.remove('md:ml-64', 'pt-16')
    }

    // Attach form submit event
    const form = document.getElementById('login-form')
    const submitBtn = document.getElementById('login-submit-btn')
    const errorContainer = document.getElementById('login-error-container')
    const errorMessage = document.getElementById('login-error-message')

    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault()

        const email = document.getElementById('email').value
        const password = document.getElementById('password').value

        // UI Feedback: Loading state
        submitBtn.disabled = true
        submitBtn.innerHTML = `
          <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          กำลังเข้าสู่ระบบ...
        `
        errorContainer.classList.add('hidden')

        try {
          // 🔴 Fix: Clear any potentially stale session before attempting a new login
          await authStore.logout().catch(() => { })

          await authStore.login(email, password)

          layoutManager.showSuccess('เข้าสู่ระบบสำเร็จ!')

          // Restore Layout
          if (sidebar) sidebar.style.display = ''
          if (header) header.style.display = ''
          if (layoutWrapper) {
            layoutWrapper.classList.add('md:ml-64', 'pt-16')
          }

          // Redirect to target or Dashboard
          const redirectPath = window.sessionStorage.getItem('redirectPath') || '/dashboard'
          window.sessionStorage.removeItem('redirectPath')

          // 🔥 Force a hard page reload after successful login to ensure ALL state is fresh
          setTimeout(() => {
            window.location.replace('/#' + redirectPath)
            window.location.reload()
          }, 500)

        } catch (error) {
          console.error('Login Error:', error)
          // Display error to User
          let errMsg = 'อีเมลหรือรหัสผ่านไม่ถูกต้อง'
          if (error.message.includes('Invalid login credentials')) {
            errMsg = 'อีเมลหรือรหัสผ่านไม่ถูกต้อง โปรดลองอีกครั้ง'
          } else if (error.message.includes('Email not confirmed')) {
            errMsg = 'อีเมลยังไม่ได้รับการยืนยัน โปรดตรวจสอบ Inbox ของคุณ'
          }

          errorMessage.textContent = errMsg;
          errorContainer.classList.remove('hidden')

        } finally {
          // Reset UI
          submitBtn.disabled = false
          submitBtn.innerHTML = 'เข้าสู่ระบบ'
        }
      })
    }
  }

  destroy() {
    // Cleanup is handled by BaseComponent automatically if standard event listeners are used
    super.destroy()
  }
}
