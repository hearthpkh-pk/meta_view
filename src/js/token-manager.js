import { dbHelpers } from '../utils/database.js'
import { metaApi } from '../utils/metaApi.js'
import { uiHelpers } from '../utils/ui.js'

class TokenManager {
  constructor() {
    this.init()
  }

  init() {
    this.bindEvents()
    this.loadTokens()
  }

  bindEvents() {
    document.getElementById('saveTokenBtn').addEventListener('click', () => this.saveToken())
    document.getElementById('refreshTokensBtn').addEventListener('click', () => this.loadTokens())
  }

  async loadTokens() {
    try {
      uiHelpers.showLoading('tokenTableBody')
      
      const { data, error } = await dbHelpers.fetch('tokens', {
        orderBy: { column: 'created_at', ascending: false }
      })

      if (error) {
        throw new Error(error.message)
      }

      this.renderTokensTable(data)
    } catch (error) {
      uiHelpers.showError('tokenTableBody', error.message)
      uiHelpers.showNotification('เกิดข้อผิดพลาดในการโหลด Token: ' + error.message, 'error')
    }
  }

  renderTokensTable(tokens) {
    const tbody = document.getElementById('tokenTableBody')
    
    if (!tokens || tokens.length === 0) {
      uiHelpers.showEmpty('tokenTableBody', 'ยังไม่มี Token ในระบบ')
      return
    }

    let html = ''
    tokens.forEach(token => {
      const shortToken = token.access_token.substring(0, 15) + '...'
      const statusColor = token.status === 'active' ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100'

      html += `
        <tr class="border-b hover:bg-gray-50">
          <td class="px-6 py-4 font-medium text-gray-800">${token.name}</td>
          <td class="px-6 py-4">
            <span class="px-2 py-1 rounded-full text-xs font-bold ${statusColor}">${token.status}</span>
          </td>
          <td class="px-6 py-4 font-mono text-sm text-gray-500">${shortToken}</td>
          <td class="px-6 py-4 text-center">
            <button onclick="tokenManager.deleteToken('${token.id}')" class="text-red-500 hover:text-red-700 text-sm font-medium">🗑️ ลบ</button>
          </td>
        </tr>
      `
    })
    tbody.innerHTML = html
  }

  async saveToken() {
    const name = document.getElementById('tokenName').value.trim()
    const tokenVal = document.getElementById('accessToken').value.trim()

    if (!name || !tokenVal) {
      this.showStatus('กรุณากรอกข้อมูลให้ครบถ้วน', 'error')
      return
    }

    this.showStatus('กำลังบันทึก...', 'loading')

    try {
      // Validate token with Meta API
      const isValid = await metaApi.validateToken(tokenVal)
      if (!isValid) {
        throw new Error('Token ไม่ถูกต้องหรือหมดอายุ กรุณาตรวจสอบอีกครั้ง')
      }

      const { error } = await dbHelpers.insert('tokens', [
        { name: name, access_token: tokenVal, status: 'active' }
      ])

      if (error) {
        throw new Error(error.message)
      }

      this.showStatus('✅ บันทึก Token สำเร็จ!', 'success')
      uiHelpers.showNotification('บันทึก Token สำเร็จ', 'success')
      
      // Clear form and refresh table
      document.getElementById('tokenName').value = ''
      document.getElementById('accessToken').value = ''
      this.loadTokens()
      
    } catch (error) {
      this.showStatus(`เกิดข้อผิดพลาด: ${error.message}`, 'error')
      uiHelpers.showNotification('บันทึก Token ไม่สำเร็จ: ' + error.message, 'error')
    }
  }

  async deleteToken(id) {
    if(!confirm('คุณแน่ใจหรือไม่ว่าต้องการลบ Token นี้? (อาจทำให้เพจที่ผูกอยู่ดึงข้อมูลไม่ได้)')) {
      return
    }

    try {
      const { error } = await dbHelpers.delete('tokens', { id })
      
      if (error) {
        throw new Error(error.message)
      }

      uiHelpers.showNotification('ลบ Token สำเร็จ', 'success')
      this.loadTokens()
    } catch (error) {
      uiHelpers.showNotification('ลบไม่สำเร็จ: ' + error.message, 'error')
    }
  }

  showStatus(msg, type) {
    const el = document.getElementById('statusMsg')
    el.classList.remove('hidden', 'text-red-600', 'text-green-600', 'text-blue-600')
    
    if(type === 'error') el.classList.add('text-red-600')
    else if(type === 'success') el.classList.add('text-green-600')
    else if(type === 'loading') el.classList.add('text-blue-600')
    
    el.innerText = msg
    el.classList.remove('hidden')
  }
}

// Initialize the token manager
const tokenManager = new TokenManager()
