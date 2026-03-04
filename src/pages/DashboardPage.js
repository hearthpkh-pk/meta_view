import { BaseComponent } from '../components/BaseComponent.js'
import { Notification } from '../components/Notification.js'

/**
 * Dashboard Page Component - Analytics dashboard interface
 */
export class DashboardPage extends BaseComponent {
  constructor() {
    super()
    this.init()
  }

  init() {
    this.bindEvents()
    this.setDefaultDates()
  }

  bindEvents() {
    const loadBtn = document.getElementById('loadDataBtn')
    if (loadBtn) {
      this.addEventListener(loadBtn, 'click', () => this.loadDashboardData())
    }
  }

  setDefaultDates() {
    const today = new Date()
    const lastWeek = new Date()
    lastWeek.setDate(today.getDate() - 7)

    const startDateInput = document.getElementById('startDate')
    const endDateInput = document.getElementById('endDate')

    if (startDateInput) {
      startDateInput.value = lastWeek.toISOString().split('T')[0]
    }
    if (endDateInput) {
      endDateInput.value = today.toISOString().split('T')[0]
    }
  }

  render() {
    return `
      <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <!-- Page Header -->
        <div class="mb-8 bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center">
          <div>
            <h1 class="text-2xl font-bold text-gray-900 mb-1">
              <span class="mr-2">📈</span> Analytics Dashboard
            </h1>
            <p class="text-sm text-gray-600 mt-1">ดูสถิติยอดวิวและจำนวนโพสต์รายวันจากทุกเพจ</p>
          </div>
        </div>

        <!-- Date Range Section -->
        <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-6 flex flex-wrap items-end gap-4">
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-1">ตั้งแต่วันที่</label>
            <input type="date" id="startDate" class="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 w-40 focus:ring-indigo-500 focus:border-indigo-500">
          </div>
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-1">ถึงวันที่</label>
            <input type="date" id="endDate" class="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 w-40 focus:ring-indigo-500 focus:border-indigo-500">
          </div>
          <button id="loadDataBtn" class="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-6 rounded-lg transition shadow-sm">
            🔍 ดึงข้อมูล
          </button>
        </div>

        <!-- Summary Metrics -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div class="bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl p-6 shadow-md text-white">
            <p class="text-emerald-50 text-sm font-medium mb-1">ยอดดูสื่อทั้งหมด (Total Views)</p>
            <h2 id="totalViews" class="text-4xl font-black">0</h2>
          </div>
          <div class="bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl p-6 shadow-md text-white">
            <p class="text-blue-50 text-sm font-medium mb-1">จำนวนโพสต์รวม (Total Posts)</p>
            <h2 id="totalPosts" class="text-4xl font-black">0</h2>
          </div>
        </div>

        <!-- Data Table -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div class="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
            <h3 class="font-bold text-gray-800">📋 สถิติแยกตามเพจและวันที่</h3>
          </div>
          <div class="overflow-x-auto">
            <table class="min-w-full text-left border-collapse">
              <thead>
                <tr class="bg-white border-b border-gray-200 text-sm">
                  <th class="px-6 py-4 font-semibold text-gray-600">วันที่ (Date)</th>
                  <th class="px-6 py-4 font-semibold text-gray-600">ชื่อเพจ (Page Name)</th>
                  <th class="px-6 py-4 font-semibold text-gray-600 text-right">ยอดวิว (Views)</th>
                  <th class="px-6 py-4 font-semibold text-gray-600 text-right">จำนวนโพสต์ (Posts)</th>
                </tr>
              </thead>
              <tbody id="dataTableBody">
                <tr><td colspan="4" class="text-center py-8 text-gray-500">กรุณากดปุ่ม "ดึงข้อมูล" เพื่อดูสถิติ</td></tr>
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

  async loadDashboardData() {
    const startDate = document.getElementById('startDate')?.value
    const endDate = document.getElementById('endDate')?.value
    const tbody = document.getElementById('dataTableBody')
    const loadBtn = document.getElementById('loadDataBtn')

    if (!startDate || !endDate) {
      Notification.show("กรุณาเลือกวันที่ให้ครบถ้วน", 'warning')
      return
    }

    try {
      // Show loading state
      if (loadBtn) {
        loadBtn.disabled = true
        loadBtn.innerHTML = '<div class="spinner mr-2"></div>กำลังโหลด...'
      }

      if (tbody) {
        tbody.innerHTML = `
          <tr>
            <td colspan="4" class="text-center">
              <div class="loading">
                <div class="spinner"></div>
                <span>กำลังโหลดข้อมูล...</span>
              </div>
            </td>
          </tr>
        `
      }

      // TODO: Replace with actual data fetching
      // For now, simulate data
      await this.simulateDataLoading(startDate, endDate)

    } catch (error) {
      console.error('Error loading dashboard data:', error)
      if (tbody) {
        tbody.innerHTML = `
          <tr><td colspan="4" class="text-center py-8 text-red-500">เกิดข้อผิดพลาด: ${error.message}</td></tr>
        `
      }
      Notification.show('โหลดข้อมูลไม่สำเร็จ: ' + error.message, 'error')
    } finally {
      // Restore button
      if (loadBtn) {
        loadBtn.disabled = false
        loadBtn.innerHTML = '<i class="fas fa-search mr-2"></i>ดึงข้อมูล'
      }
    }
  }

  async simulateDataLoading(startDate, endDate) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Generate sample data
    const sampleData = this.generateSampleData(startDate, endDate)
    this.renderDashboardData(sampleData)
  }

  generateSampleData(startDate, endDate) {
    const pages = [
      'Snail Korat', 'Tech News', 'Food Review', 'Travel Blog', 'Music Channel'
    ]

    const data = []
    const start = new Date(startDate)
    const end = new Date(endDate)

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      pages.forEach(page => {
        data.push({
          date: d.toISOString().split('T')[0],
          pageName: page,
          views: Math.floor(Math.random() * 10000) + 100,
          posts: Math.floor(Math.random() * 50) + 1
        })
      })
    }

    return data
  }

  renderDashboardData(data) {
    const tbody = document.getElementById('dataTableBody')
    const totalViewsEl = document.getElementById('totalViews')
    const totalPostsEl = document.getElementById('totalPosts')

    if (!data || data.length === 0) {
      if (tbody) {
        tbody.innerHTML = `
          <tr><td colspan="4" class="text-center py-8 text-gray-500">ไม่พบข้อมูลในช่วงวันที่เลือก</td></tr>
        `
      }

      if (totalViewsEl) totalViewsEl.textContent = "0"
      if (totalPostsEl) totalPostsEl.textContent = "0"
      return
    }

    // Calculate totals
    let sumViews = 0
    let sumPosts = 0
    let tableHTML = ''

    data.forEach(row => {
      sumViews += row.views
      sumPosts += row.posts

      tableHTML += `
        <tr class="border-b hover:bg-gray-50 transition">
          <td class="px-6 py-4 text-sm font-mono text-gray-500">${row.date}</td>
          <td class="px-6 py-4 font-medium text-gray-900">${row.pageName}</td>
          <td class="px-6 py-4 text-right font-semibold text-green-600">${row.views.toLocaleString()}</td>
          <td class="px-6 py-4 text-right text-gray-600">${row.posts}</td>
        </tr>
      `
    })

    // Update UI
    if (tbody) tbody.innerHTML = tableHTML
    if (totalViewsEl) totalViewsEl.textContent = sumViews.toLocaleString()
    if (totalPostsEl) totalPostsEl.textContent = sumPosts.toLocaleString()

    Notification.show('โหลดข้อมูลสำเร็จ', 'success')
  }
}
