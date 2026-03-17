import { BaseComponent } from '../components/BaseComponent.js'
import { pageStore } from '../stores/PageStore.js'
import { Notification } from '../components/Notification.js'

/**
 * Index Page Component - Main page management interface
 */
export class IndexPage extends BaseComponent {
  constructor() {
    super() // Don't pass element - will be set in mount
    this.pageCards = []
    this.subscriptions = []
  }

  render() {
    return `
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <!-- Page Header -->
        <div class="mb-8">
          <h1 class="text-2xl font-bold text-gray-900 mb-1">
            <i class="fas fa-cog text-blue-600 mr-3"></i>
            จัดการเพจ
          </h1>
          <p class="text-gray-600">เลือกเปิด/ปิดสวิตช์ เพจที่ต้องการดึงสถิติรายวัน</p>
        </div>

        <!-- Quick Actions -->
        <div class="mb-6 flex flex-wrap gap-3">
          <button id="syncBtn" class="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-2 rounded-lg font-medium shadow transition flex items-center disabled:opacity-50">
            <span id="syncIcon" class="mr-2">📥</span> 
            <span id="syncText">ซิงค์รายชื่อเพจใหม่จาก Token</span>
          </button>
          <button id="refreshBtn" class="text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-lg text-sm font-medium transition border border-blue-200">
            🔄 รีเฟรชตาราง
          </button>
        </div>

        <!-- Pages List Table -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden" id="pagesListContainer">
          <div class="px-6 py-4 bg-gray-50 border-b flex items-center justify-between">
            <h3 class="font-bold text-gray-700">
              <i class="fas fa-list mr-2"></i>รายการเพจทั้งหมด
            </h3>
            <span class="text-xs font-semibold px-2 py-1 bg-blue-100 text-blue-700 rounded-full" id="pageCount">0 เพจ</span>
          </div>
          <div class="overflow-x-auto">
            <table class="min-w-full text-left border-collapse">
              <thead>
                <tr class="bg-gray-100 border-b">
                  <th class="px-6 py-4 font-semibold text-gray-600">ID เพจ</th>
                  <th class="px-6 py-4 font-semibold text-gray-600">ชื่อเพจ</th>
                  <th class="px-6 py-4 font-semibold text-gray-600">ผูกกับ Token</th>
                  <th class="px-6 py-4 font-semibold text-gray-600 text-center">สถานะดึงข้อมูล (เปิด/ปิด)</th>
                  <th class="px-6 py-4 font-semibold text-gray-600 text-center">จัดการ</th>
                </tr>
              </thead>
              <tbody id="pagesList">
                ${this._renderSkeletonRows(5)}
              </tbody>
            </table>
          </div>
        </div>

        <!-- Empty State -->
        <div id="emptyState" class="hidden text-center py-16 bg-white rounded-xl shadow-sm border border-gray-200 mt-6">
          <div class="text-6xl mb-4">📭</div>
          <h3 class="text-xl font-semibold text-gray-700 mb-2">ยังไม่มีข้อมูลเพจในระบบ</h3>
          <p class="text-gray-500 mb-6">กรุณากดปุ่ม "ซิงค์รายชื่อเพจใหม่จาก Token"</p>
          <button class="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg shadow-sm transition" onclick="document.getElementById('syncBtn').click()">
            ซิงค์ทันที
          </button>
        </div>
      </div>
    `
  }

  async unmount() {
    // Cleanup global reference
    window.indexPage = null

    // Cleanup subscriptions
    this.subscriptions.forEach(unsubscribe => unsubscribe())
    this.subscriptions = []
  }

  renderPagesTable(pages) {
    const container = document.getElementById('pagesList')
    const emptyState = document.getElementById('emptyState')
    const pageCount = document.getElementById('pageCount')

    if (!container) return

    if (!pages || pages.length === 0) {
      document.getElementById('pagesListContainer').classList.add('hidden')
      if (emptyState) emptyState.classList.remove('hidden')
      if (pageCount) pageCount.textContent = '0 เพจ'
      return
    }

    document.getElementById('pagesListContainer').classList.remove('hidden')
    if (emptyState) emptyState.classList.add('hidden')
    if (pageCount) pageCount.textContent = `${pages.length} เพจ`

    // Render table rows
    container.innerHTML = pages.map(page => {
      const isChecked = page.is_active ? 'checked' : ''
      const tokenName = page.tokens ? page.tokens.name : '<span class="text-red-500">ไม่พบ Token</span>'

      return `
        <tr class="border-b hover:bg-gray-50 transition">
          <td class="px-6 py-4 text-sm font-mono text-gray-500">${page.page_id}</td>
          <td class="px-6 py-4 font-medium text-gray-800">${page.name}</td>
          <td class="px-6 py-4 text-sm text-purple-600 font-medium">${tokenName}</td>
          <td class="px-6 py-4 text-center">
            <label class="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" ${isChecked} class="sr-only peer" onchange="window.indexPage.togglePageStatus('${page.page_id}', this.checked)">
              <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
              <span class="ml-3 text-sm font-medium ${page.is_active ? 'text-emerald-600' : 'text-gray-400'}">
                  ${page.is_active ? 'ทำงานอยู่' : 'ปิดพัก'}
              </span>
            </label>
          </td>
          <td class="px-6 py-4 text-center">
            <button class="text-blue-500 hover:text-blue-700 text-sm font-medium" 
                    onclick="window.indexPage.viewPageDetails('${page.page_id}')">
              <i class="fas fa-eye mr-1"></i>ดูรายละเอียด
            </button>
          </td>
        </tr>
      `
    }).join('')
  }

  async togglePageStatus(pageId, isActive) {
    try {
      await pageStore.togglePageStatus(pageId, isActive)
      Notification.show('อัปเดตสถานะสำเร็จ', 'success')

      // Refresh the page list
      await pageStore.loadAllPages()
    } catch (error) {
      console.error('Error toggling status:', error)
      Notification.show('อัปเดตสถานะไม่สำเร็จ: ' + error.message, 'error')
    }
  }

  async syncPagesFromTokens() {
    const syncBtn = document.getElementById('syncBtn')
    const syncText = document.getElementById('syncText')
    const container = document.getElementById('pagesList')

    // Update button state
    if (syncBtn) {
      syncBtn.disabled = true
      syncBtn.innerHTML = '<div class="spinner mr-2"></div>กำลังดึงข้อมูล...'
    }

    // Show loading state
    if (container) {
      container.innerHTML = `
        <div class="loading">
          <div class="spinner"></div>
          <span>กำลังดึงข้อมูลจาก Facebook...</span>
        </div>
      `
    }

    try {
      const result = await pageStore.syncPagesFromTokens()

      if (result.success) {
        Notification.show(`✅ ซิงค์สำเร็จ! ดึงรายชื่อเพจมาได้ทั้งหมด ${result.pagesFetched} เพจ`, 'success')

        // Refresh pages list
        await pageStore.loadAllPages()
      }
    } catch (error) {
      console.error('Error syncing pages:', error)
      Notification.show('เกิดข้อผิดพลาดในการซิงค์: ' + error.message, 'error')
    } finally {
      // Restore button
      if (syncBtn) {
        syncBtn.disabled = false
        syncBtn.innerHTML = '<i class="fas fa-sync-alt mr-2"></i><span>ซิงค์รายชื่อเพจใหม่จาก Token</span>'
      }
    }
  }

  async loadPages() {
    const refreshBtn = document.getElementById('refreshBtn')
    const container = document.getElementById('pagesList')

    // Update button state
    if (refreshBtn) {
      refreshBtn.disabled = true
      refreshBtn.innerHTML = '<div class="spinner mr-2"></div>รีเฟรช...'
    }

    // Show loading state
    if (container) {
      container.innerHTML = `
        <div class="loading">
          <div class="spinner"></div>
          <span>กำลังรีเฟรชข้อมูล...</span>
        </div>
      `
    }

    try {
      await pageStore.loadAllPages()
      Notification.show('รีเฟรชข้อมูลสำเร็จ', 'success')
    } catch (error) {
      console.error('Error loading pages:', error)
      Notification.show('โหลดข้อมูลไม่สำเร็จ: ' + error.message, 'error')
    } finally {
      // Restore button
      if (refreshBtn) {
        refreshBtn.disabled = false
        refreshBtn.innerHTML = '<i class="fas fa-redo mr-2"></i>รีเฟรชข้อมูล'
      }
    }
  }

  setLoadingState(loading) {
    const syncBtn = document.getElementById('syncBtn')
    const refreshBtn = document.getElementById('refreshBtn')

    if (loading) {
      if (syncBtn) {
        syncBtn.disabled = true
        syncBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>กำลังโหลด...'
      }
      if (refreshBtn) {
        refreshBtn.disabled = true
        refreshBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>รีเฟรช...'
      }
    } else {
      if (syncBtn) {
        syncBtn.disabled = false
        syncBtn.innerHTML = '<i class="fas fa-sync-alt mr-2"></i><span>ซิงค์รายชื่อเพจใหม่จาก Token</span>'
      }
      if (refreshBtn) {
        refreshBtn.disabled = false
        refreshBtn.innerHTML = '<i class="fas fa-redo mr-2"></i>รีเฟรชข้อมูล'
      }
    }
  }
}
