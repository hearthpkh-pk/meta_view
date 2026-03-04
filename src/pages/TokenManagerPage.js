import { BaseComponent } from '../components/BaseComponent.js'
import { TokenService } from '../services/TokenService.js'
import { Notification } from '../components/Notification.js'

/**
 * Token Manager Page Component - Token management interface
 */
export class TokenManagerPage extends BaseComponent {
  constructor() {
    super()
    this.tokenService = new TokenService()
    this.tokens = []
    this.init()
  }

  init() {
    this.bindEvents()
    this.loadTokens()
  }

  bindEvents() {
    // Save token button
    const saveBtn = document.getElementById('saveTokenBtn')
    if (saveBtn) {
      this.addEventListener(saveBtn, 'click', () => this.saveToken())
    }

    // Refresh button
    const refreshBtn = document.getElementById('refreshTokensBtn')
    if (refreshBtn) {
      this.addEventListener(refreshBtn, 'click', () => this.loadTokens())
    }
  }

  render() {
    return `
      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <!-- Page Header -->
        <div class="mb-8">
          <h1 class="text-2xl font-bold text-gray-900 mb-1">
            <i class="fas fa-key text-blue-600 mr-3"></i>
            ระบบจัดการกุญแจ (API Tokens)
          </h1>
          <p class="text-sm text-gray-600">เพิ่มและจัดการ Facebook User Token สำหรับดึงข้อมูล</p>
        </div>

        <!-- Token Form -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <h2 class="text-lg font-bold text-gray-800 mb-4 border-b pb-2">
            <i class="fas fa-plus-circle text-blue-500 mr-2"></i>เพิ่ม Token ใหม่
          </h2>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">ชื่อเรียก (เช่น บัญชีแอดมิน A)</label>
              <input type="text" id="tokenName" class="w-full md:w-1/2 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition" placeholder="ตั้งชื่อให้จำง่าย...">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Access Token (User Token)</label>
              <textarea id="accessToken" rows="3" class="w-full px-4 py-2 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition" placeholder="EAAPXFnUc1c..."></textarea>
            </div>
            <button id="saveTokenBtn" class="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg shadow-sm transition">
              <i class="fas fa-save mr-2"></i>บันทึก Token
            </button>
          </div>
          <div id="statusMsg" class="mt-4 text-sm font-medium hidden"></div>
        </div>

        <!-- Tokens Table -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div class="px-6 py-4 bg-gray-50 border-b flex justify-between items-center">
            <h3 class="font-bold text-gray-800">
              <i class="fas fa-list text-gray-500 mr-2"></i>รายการ Token ในระบบ
            </h3>
            <button id="refreshTokensBtn" class="text-sm text-blue-600 hover:text-blue-800 font-medium transition">
              <i class="fas fa-sync mr-1"></i>รีเฟรช
            </button>
          </div>
          <div class="overflow-x-auto">
            <table class="min-w-full text-left border-collapse">
              <thead>
                <tr class="bg-gray-100 border-b">
                  <th class="px-6 py-3 font-semibold text-gray-600">ชื่อเรียก</th>
                  <th class="px-6 py-3 font-semibold text-gray-600">สถานะ</th>
                  <th class="px-6 py-3 font-semibold text-gray-600">Token (บางส่วน)</th>
                  <th class="px-6 py-3 font-semibold text-gray-600 text-center">จัดการ</th>
                </tr>
              </thead>
              <tbody id="tokenTableBody">
                <tr>
                  <td colspan="4" class="text-center py-4 text-gray-500">
                    <div class="loader inline-block"></div> กำลังโหลดข้อมูล...
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `
  }

  async mount() {
    // Bind navigation links
    const navLinks = this.findAll('[data-nav]')
    navLinks.forEach(link => {
      this.addEventListener(link, 'click', (e) => {
        e.preventDefault()
        const page = e.target.dataset.nav
        if (page) {
          window.router?.navigate(`/${page}`)
        }
      })
    })
  }

  async loadTokens() {
    try {
      this.showStatus('กำลังโหลดข้อมูล...', 'loading')

      this.tokens = await this.tokenService.getAllTokens()
      this.renderTokensTable()

      this.hideStatus()
    } catch (error) {
      console.error('Error loading tokens:', error)
      this.showStatus('เกิดข้อผิดพลาดในการโหลด: ' + error.message, 'error')
    }
  }

  renderTokensTable() {
    const tbody = document.getElementById('tokenTableBody')
    if (!tbody) return

    tbody.innerHTML = ''

    if (!this.tokens || this.tokens.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="4" class="text-center py-4 text-gray-500">ยังไม่มี Token ในระบบ</td>
        </tr>
      `
      return
    }

    this.tokens.forEach(token => {
      const tr = document.createElement('tr')
      tr.className = 'border-b hover:bg-gray-50'

      const shortToken = this.tokenService.formatTokenForDisplay(token.access_token)
      const statusColor = token.status === 'active' ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100'

      tr.innerHTML = `
        <td class="px-6 py-4 font-medium text-gray-900">${token.name}</td>
        <td class="px-6 py-4">
          <span class="px-2 py-1 rounded-full text-xs font-bold ${statusColor}">${token.status}</span>
        </td>
        <td class="px-6 py-4 font-inter-mono text-sm text-gray-500">${shortToken}</td>
        <td class="px-6 py-4 text-center">
          <button class="text-red-500 hover:text-red-700 text-sm font-medium delete-token" data-token-id="${token.id}">
            <i class="fas fa-trash mr-1"></i>ลบ
          </button>
        </td>
      `

      // Add delete event listener
      const deleteBtn = tr.querySelector('.delete-token')
      this.addEventListener(deleteBtn, 'click', () => {
        this.deleteToken(token.id)
      })

      tbody.appendChild(tr)
    })
  }

  async saveToken() {
    const name = document.getElementById('tokenName')?.value.trim()
    const tokenVal = document.getElementById('accessToken')?.value.trim()

    if (!name || !tokenVal) {
      this.showStatus('กรุณกรอกข้อมูลให้ครบถ้วน', 'error')
      return
    }

    try {
      this.showStatus('กำลังบันทึก...', 'loading')

      await this.tokenService.createToken({
        name: name,
        access_token: tokenVal
      })

      this.showStatus('✅ บันทึก Token สำเร็จ!', 'success')

      // Clear form and refresh table
      document.getElementById('tokenName').value = ''
      document.getElementById('accessToken').value = ''
      this.loadTokens()

    } catch (error) {
      console.error('Error saving token:', error)
      this.showStatus(`เกิดข้อผิดพลาด: ${error.message}`, 'error')
    }
  }

  async deleteToken(id) {
    if (!confirm('คุณแน่ใจหรือไม่ว่าต้องการลบ Token นี้? (อาจทำให้เพจที่ผูกอยู่ดึงข้อมูลไม่ได้)')) {
      return
    }

    try {
      await this.tokenService.deleteToken(id)
      this.loadTokens()
      Notification.show('ลบ Token สำเร็จ', 'success')
    } catch (error) {
      console.error('Error deleting token:', error)
      Notification.show('ลบไม่สำเร็จ: ' + error.message, 'error')
    }
  }

  showStatus(message, type) {
    const statusEl = document.getElementById('statusMsg')
    if (!statusEl) return

    statusEl.classList.remove('hidden', 'text-red-600', 'text-green-600', 'text-blue-600')

    if (type === 'error') {
      statusEl.classList.add('text-red-600')
    } else if (type === 'success') {
      statusEl.classList.add('text-green-600')
    } else if (type === 'loading') {
      statusEl.classList.add('text-blue-600')
    }

    statusEl.textContent = message
    statusEl.classList.remove('hidden')
  }

  hideStatus() {
    const statusEl = document.getElementById('statusMsg')
    if (statusEl) {
      statusEl.classList.add('hidden')
    }
  }
}
