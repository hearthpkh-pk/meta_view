import { dbHelpers } from '../utils/database.js'
import { metaApi } from '../utils/metaApi.js'
import { uiHelpers } from '../utils/ui.js'

class PageManager {
  constructor() {
    this.init()
  }

  init() {
    this.bindEvents()
    this.loadPages()
  }

  bindEvents() {
    document.getElementById('syncBtn').addEventListener('click', () => this.syncPagesFromTokens())
    document.getElementById('refreshBtn').addEventListener('click', () => this.loadPages())
  }

  async loadPages() {
    try {
      uiHelpers.showLoading('page-table-body')
      
      const { data: pages, error } = await dbHelpers.fetch('pages', {
        select: '*, tokens(name)',
        orderBy: { column: 'created_at', ascending: false }
      })
      
      if (error) {
        throw new Error(error.message)
      }

      this.renderPagesTable(pages)
    } catch (error) {
      uiHelpers.showError('page-table-body', error.message)
      uiHelpers.showNotification('เกิดข้อผิดพลาดในการดึงข้อมูล: ' + error.message, 'error')
    }
  }

  renderPagesTable(pages) {
    const tbody = document.getElementById('page-table-body')
    tbody.innerHTML = ''

    if (!pages || pages.length === 0) {
      uiHelpers.showEmpty('page-table-body', `
        ยังไม่มีข้อมูลเพจในระบบ<br>
        <span class="text-sm">กรุณากดปุ่ม <b>"ซิงค์รายชื่อเพจใหม่จาก Token"</b> ด้านบน</span>
      `)
      return
    }

    pages.forEach(page => {
      const tr = document.createElement('tr')
      tr.className = 'border-b hover:bg-gray-50 transition'
      
      const tokenName = page.tokens ? page.tokens.name : '<span class="text-red-500">ไม่พบ Token</span>'
      
      tr.innerHTML = `
        <td class="px-6 py-4 text-sm font-mono text-gray-500">${page.page_id}</td>
        <td class="px-6 py-4 font-medium text-gray-800">${page.name}</td>
        <td class="px-6 py-4 text-sm text-purple-600 font-medium">${tokenName}</td>
        <td class="px-6 py-4 text-center">
          <label class="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" ${page.is_active ? 'checked' : ''} 
                   class="sr-only peer toggle-switch" 
                   data-page-id="${page.page_id}">
            <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
            <span class="ml-3 text-sm font-medium ${page.is_active ? 'text-emerald-600' : 'text-gray-400'}">
              ${page.is_active ? 'ทำงานอยู่' : 'ปิดพัก'}
            </span>
          </label>
        </td>
      `
      tbody.appendChild(tr)
      
      // Add event listener for toggle switch
      const toggleSwitch = tr.querySelector('.toggle-switch')
      toggleSwitch.addEventListener('change', (e) => {
        this.toggleStatus(page.page_id, e.target.checked)
      })
    })
  }

  async syncPagesFromTokens() {
    const syncIcon = document.getElementById('syncIcon')
    const syncText = document.getElementById('syncText')
    const syncBtn = document.getElementById('syncBtn')
    
    // Disable button and show loading
    syncBtn.disabled = true
    syncIcon.innerHTML = '⏳'
    syncText.innerText = 'กำลังวิ่งไปดึงข้อมูลจาก Facebook...'

    try {
      // Get active tokens
      const { data: tokens, error: tokenErr } = await dbHelpers.fetch('tokens', {
        filters: { status: 'active' }
      })
      
      if (tokenErr) throw new Error(tokenErr.message)
      if (!tokens || tokens.length === 0) {
        throw new Error('ไม่พบ Token ที่ใช้งานได้ กรุณาไปเพิ่ม Token ในหน้า "จัดการ Token" ก่อนครับ')
      }

      let allPagesToUpsert = []
      let totalFetched = 0

      // Fetch pages from each token
      for (const token of tokens) {
        try {
          const pages = await metaApi.fetchPages(token.access_token)
          
          pages.forEach(page => {
            allPagesToUpsert.push({
              page_id: page.id,
              name: page.name,
              token_id: token.id
            })
          })
          
          totalFetched += pages.length
        } catch (error) {
          console.error(`Token ${token.name} error:`, error.message)
          // Continue with next token
        }
      }

      // Save to database
      if (allPagesToUpsert.length > 0) {
        const { error: upsertErr } = await dbHelpers.upsert('pages', allPagesToUpsert, { 
          onConflict: 'page_id' 
        })
        
        if (upsertErr) throw new Error(upsertErr.message)
        
        uiHelpers.showNotification(`✅ ซิงค์สำเร็จ! ดึงรายชื่อเพจมาได้ทั้งหมด ${totalFetched} เพจ`, 'success')
      } else {
        uiHelpers.showNotification('ไม่พบเพจใหม่จาก Token ที่มีอยู่ครับ', 'warning')
      }

      // Refresh table
      await this.loadPages()
      
    } catch (error) {
      uiHelpers.showNotification('เกิดข้อผิดพลาดในการซิงค์: ' + error.message, 'error')
    } finally {
      // Restore button
      syncBtn.disabled = false
      syncIcon.innerHTML = '📥'
      syncText.innerText = 'ซิงค์รายชื่อเพจใหม่จาก Token'
    }
  }

  async toggleStatus(pageId, newStatus) {
    try {
      const { error } = await dbHelpers.update('pages', 
        { is_active: newStatus }, 
        { page_id: pageId }
      )
      
      if (error) {
        throw new Error(error.message)
      }
      
      uiHelpers.showNotification('อัปเดตสถานะสำเร็จ', 'success')
      
      // Update the UI immediately
      const checkbox = document.querySelector(`input[data-page-id="${pageId}"]`)
      const statusText = checkbox.parentElement.querySelector('span')
      
      if (newStatus) {
        statusText.classList.remove('text-gray-400')
        statusText.classList.add('text-emerald-600')
        statusText.textContent = 'ทำงานอยู่'
      } else {
        statusText.classList.remove('text-emerald-600')
        statusText.classList.add('text-gray-400')
        statusText.textContent = 'ปิดพัก'
      }
      
    } catch (error) {
      uiHelpers.showNotification('อัปเดตสถานะไม่สำเร็จ: ' + error.message, 'error')
      // Revert the toggle
      const checkbox = document.querySelector(`input[data-page-id="${pageId}"]`)
      if (checkbox) {
        checkbox.checked = !newStatus
      }
    }
  }
}

// Initialize the page manager
const pageManager = new PageManager()
