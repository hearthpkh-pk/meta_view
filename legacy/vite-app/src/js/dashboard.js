import { dbHelpers } from '../utils/database.js'
import { uiHelpers } from '../utils/ui.js'

class DashboardManager {
  constructor() {
    this.init()
  }

  init() {
    this.setDefaultDates()
    this.bindEvents()
  }

  bindEvents() {
    document.getElementById('loadDataBtn').addEventListener('click', () => this.loadDashboardData())
  }

  setDefaultDates() {
    const today = new Date()
    const lastWeek = new Date()
    lastWeek.setDate(today.getDate() - 7)
    
    document.getElementById('endDate').value = today.toISOString().split('T')[0]
    document.getElementById('startDate').value = lastWeek.toISOString().split('T')[0]
  }

  async loadDashboardData() {
    const startDate = document.getElementById('startDate').value
    const endDate = document.getElementById('endDate').value

    if (!startDate || !endDate) {
      uiHelpers.showNotification("กรุณาเลือกวันที่ให้ครบถ้วน", 'warning')
      return
    }

    try {
      uiHelpers.showLoading('dataTableBody', 'กำลังโหลดข้อมูล...')

      const { data, error } = await dbHelpers.fetch('daily_stats', {
        select: `
          date,
          page_media_views,
          posts_count,
          pages ( name )
        `,
        filters: {
          date: { gte: startDate, lte: endDate }
        },
        orderBy: { column: 'date', ascending: false }
      })

      if (error) {
        throw new Error(error.message)
      }

      this.renderDashboardData(data)
    } catch (error) {
      uiHelpers.showError('dataTableBody', error.message)
      uiHelpers.showNotification('เกิดข้อผิดพลาดในการดึงข้อมูล: ' + error.message, 'error')
    }
  }

  renderDashboardData(data) {
    const tbody = document.getElementById('dataTableBody')
    
    if (!data || data.length === 0) {
      document.getElementById('totalViews').innerText = "0"
      document.getElementById('totalPosts').innerText = "0"
      uiHelpers.showEmpty('dataTableBody', 'ไม่พบข้อมูลในช่วงวันที่เลือก')
      return
    }

    let sumViews = 0
    let sumPosts = 0
    let tableHTML = ''

    data.forEach(row => {
      sumViews += (row.page_media_views || 0)
      sumPosts += (row.posts_count || 0)
      
      const pageName = row.pages ? row.pages.name : 'ไม่ทราบชื่อเพจ'

      tableHTML += `
        <tr class="border-b hover:bg-gray-50 transition">
          <td class="px-6 py-4 text-sm font-mono text-gray-600">${row.date}</td>
          <td class="px-6 py-4 font-medium text-gray-800">${pageName}</td>
          <td class="px-6 py-4 text-right font-bold text-emerald-600">${uiHelpers.formatNumber(row.page_media_views || 0)}</td>
          <td class="px-6 py-4 text-right text-gray-600">${row.posts_count || 0}</td>
        </tr>
      `
    })

    // Update summary cards
    document.getElementById('totalViews').innerText = uiHelpers.formatNumber(sumViews)
    document.getElementById('totalPosts').innerText = uiHelpers.formatNumber(sumPosts)
    tbody.innerHTML = tableHTML
  }
}

// Initialize the dashboard manager
const dashboardManager = new DashboardManager()
