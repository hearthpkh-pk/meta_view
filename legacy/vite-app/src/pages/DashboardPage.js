import { BaseComponent } from '../components/BaseComponent.js'
import { Notification } from '../components/Notification.js'
import { dbHelpers } from '../utils/database.js'
import { uiHelpers } from '../utils/ui.js'
import Chart from 'chart.js/auto'

/**
 * Dashboard Page Component - Analytics dashboard interface with Drill-down Chart
 */
export class DashboardPage extends BaseComponent {
  constructor() {
    super()
    this.chartInstance = null
    this.currentViewMode = 'OVERVIEW' // 'OVERVIEW' | 'GROUP_DETAIL'
    this.selectedCategoryId = null

    this.rawData = []
    this.categories = []

    this.init()
  }

  init() {
    this.bindEvents()
    this.setDefaultDates()
  }

  bindEvents() {
    setTimeout(() => {
      const presetSelect = document.getElementById('dateRangePreset')
      if (presetSelect) {
        this.addEventListener(presetSelect, 'change', () => {
          this.applyDatePreset(presetSelect.value)

          // Auto-load if not custom. Custom requires manual update click.
          if (presetSelect.value !== 'custom') {
            this.loadDashboardData()
          }
        })
      }

      const customUpdateBtn = document.getElementById('updateCustomDateBtn')
      if (customUpdateBtn) {
        this.addEventListener(customUpdateBtn, 'click', () => {
          this.loadDashboardData()
        })
      }

      const backBtn = document.getElementById('backToOverviewBtn')
      if (backBtn) {
        this.addEventListener(backBtn, 'click', () => {
          this.currentViewMode = 'OVERVIEW'
          this.selectedCategoryId = null
          this.renderChart()
          this.renderTable()
          this.updateUI()
        })
      }
    }, 0)
  }

  setDefaultDates() {
    setTimeout(() => {
      const presetSelect = document.getElementById('dateRangePreset')
      const initialPreset = presetSelect ? presetSelect.value : 'thisMonth'
      this.applyDatePreset(initialPreset)

      // Auto-fetch data on load
      this.loadDashboardData()
    }, 0)
  }

  applyDatePreset(presetValue) {
    const today = new Date()
    let startDate = new Date()
    let endDate = new Date()

    // Default to end of today
    endDate.setHours(23, 59, 59, 999)

    switch (presetValue) {
      case 'today':
        startDate.setHours(0, 0, 0, 0)
        break
      case 'yesterday':
        startDate.setDate(today.getDate() - 1)
        startDate.setHours(0, 0, 0, 0)
        endDate = new Date(startDate)
        endDate.setHours(23, 59, 59, 999)
        break
      case 'last7days':
        startDate.setDate(today.getDate() - 7)
        startDate.setHours(0, 0, 0, 0)
        break
      case 'last28days':
        startDate.setDate(today.getDate() - 28)
        startDate.setHours(0, 0, 0, 0)
        break
      case 'last90days':
        startDate.setDate(today.getDate() - 90)
        startDate.setHours(0, 0, 0, 0)
        break
      case 'thisMonth':
        startDate = new Date(today.getFullYear(), today.getMonth(), 1)
        startDate.setHours(0, 0, 0, 0)
        break
      case 'lastMonth':
        startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1)
        startDate.setHours(0, 0, 0, 0)
        endDate = new Date(today.getFullYear(), today.getMonth(), 0)
        endDate.setHours(23, 59, 59, 999)
        break
      case 'custom':
        // For custom, do not override inputs. Just handle UI.
        break;
      default:
        startDate = new Date(today.getFullYear(), today.getMonth(), 1)
        startDate.setHours(0, 0, 0, 0)
    }

    const startDateInput = document.getElementById('startDate')
    const endDateInput = document.getElementById('endDate')
    const displayElement = document.getElementById('dateRangeDisplay')
    const customControls = document.getElementById('customDateControls')

    // Toggle Custom UI
    if (presetValue === 'custom') {
      if (customControls) customControls.classList.remove('hidden')
      if (displayElement) displayElement.classList.add('hidden')
      return // exit early so we don't overwrite user's custom dates
    } else {
      if (customControls) customControls.classList.add('hidden')
      if (displayElement) displayElement.classList.remove('hidden')
    }

    // Local time formatting for input elements (YYYY-MM-DD)
    const startStr = startDate.toLocaleDateString('en-CA') // outputs YYYY-MM-DD
    const endStr = endDate.toLocaleDateString('en-CA')

    if (startDateInput) startDateInput.value = startStr
    if (endDateInput) endDateInput.value = endStr

    // Thailand format display
    if (displayElement) {
      const options = { day: 'numeric', month: 'short', year: 'numeric' }
      const displayStart = startDate.toLocaleDateString('th-TH', options)
      const displayEnd = endDate.toLocaleDateString('th-TH', options)

      if (startStr === endStr) {
        displayElement.textContent = displayStart
      } else {
        displayElement.textContent = `${displayStart} — ${displayEnd}`
      }
    }
  }

  render() {
    return `
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <!-- Header -->
        <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-6 flex justify-between items-center">
          <div class="flex items-center gap-4">
            <div class="text-indigo-600">
              <i class="fas fa-chart-line text-3xl"></i>
            </div>
            <div>
              <h1 class="text-2xl font-bold font-heading text-gray-900 leading-tight">Analytics Dashboard</h1>
              <p class="text-sm text-gray-500 mt-1" id="dashboardSubtitle">ดูสถิติยอดวิวและจำนวนโพสต์เทียบของแต่ละกลุ่ม</p>
            </div>
          </div>
        </div>

        <!-- Date Range Section -->
        <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-6 flex flex-wrap justify-between items-center gap-4">
          <div class="flex items-center gap-4 max-w-full overflow-x-auto">
            <div class="font-medium text-gray-700" id="dateRangeDisplay">
              <!-- Will show the actual start - end dates in Thai -->
            </div>
            
            <div id="customDateControls" class="hidden flex items-end gap-3 transition-opacity">
              <div>
                <label class="block text-xs font-semibold text-gray-700 mb-1">ตั้งแต่วันที่</label>
                <input type="date" id="startDate" class="px-3 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-700 focus:ring-indigo-500 focus:border-indigo-500">
              </div>
              <span class="text-gray-400 mb-2">-</span>
              <div>
                <label class="block text-xs font-semibold text-gray-700 mb-1">ถึงวันที่</label>
                <input type="date" id="endDate" class="px-3 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-700 focus:ring-indigo-500 focus:border-indigo-500">
              </div>
              <button id="updateCustomDateBtn" class="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-1.5 px-4 rounded-lg transition shadow-sm text-sm h-full mb-0.5">
                อัปเดต
              </button>
            </div>
          </div>
          
          <div class="flex items-center space-x-3 bg-gray-50 p-2 rounded-lg border border-gray-200 w-full sm:w-auto">
            <i class="fas fa-calendar-alt text-gray-500 ml-2"></i>
            <select id="dateRangePreset" class="bg-transparent border-none text-sm font-semibold text-gray-700 focus:ring-0 cursor-pointer p-2 outline-none w-full appearance-none">
              <option value="today">วันนี้ (Today)</option>
              <option value="yesterday">เมื่อวานนี้ (Yesterday)</option>
              <option value="last7days">7 วันที่ผ่านมา (Last 7 days)</option>
              <option value="last28days">28 วันที่ผ่านมา (Last 28 days)</option>
              <option value="last90days">90 วันที่ผ่านมา (Last 90 days)</option>
              <option value="thisMonth" selected>เดือนนี้ (This month)</option>
              <option value="lastMonth">เดือนที่แล้ว (Last month)</option>
              <option value="custom">กำหนดเอง (Custom)</option>
            </select>
          </div>
        </div>

        <!-- Summary Metrics -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div class="bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex items-center justify-between">
            <div>
              <p class="text-gray-500 text-xs font-semibold uppercase tracking-wide mb-1">ยอดดูสื่อทั้งหมด (Total Views)</p>
              <h2 id="totalViews" class="text-3xl font-bold text-gray-900">0</h2>
            </div>
            <div class="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl shadow-inner flex items-center justify-center text-white">
              <i class="fas fa-eye text-xl"></i>
            </div>
          </div>
          <div class="bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex items-center justify-between">
            <div>
              <p class="text-gray-500 text-xs font-semibold uppercase tracking-wide mb-1">จำนวนโพสต์รวม (Total Posts)</p>
              <h2 id="totalPosts" class="text-3xl font-bold text-gray-900">0</h2>
            </div>
            <div class="w-12 h-12 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-xl shadow-inner flex items-center justify-center text-white">
              <i class="fas fa-file-alt text-xl"></i>
            </div>
          </div>
        </div>

        <!-- Analytics Chart -->
        <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-6 w-full" style="height: 400px; position: relative;">
          <canvas id="analyticsChart"></canvas>
        </div>

        <!-- Data Table -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div class="px-6 py-4 border-b border-gray-200 bg-white flex justify-between items-center" style="min-height: 64px;">
            <h3 class="text-sm font-bold text-gray-800 uppercase tracking-wide" id="tableTitle">สถิติแยกตามกลุ่ม (Groups)</h3>
            <button id="backToOverviewBtn" class="hidden bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-semibold py-1.5 px-3 rounded-lg transition shadow-sm flex items-center">
              <i class="fas fa-arrow-left mr-1.5"></i>กลับสู่ภาพรวม (Overview)
            </button>
          </div>
          <div class="overflow-x-auto">
            <table class="min-w-full text-left border-collapse">
              <thead>
                <tr class="bg-gray-50 text-xs uppercase tracking-wider text-gray-500 border-b border-gray-200" id="tableHeaderRow">
                  <th class="px-4 py-3 font-semibold">กลุ่ม (Group)</th>
                  <th class="px-4 py-3 font-semibold text-right">จำนวนเพจ (Pages)</th>
                  <th class="px-4 py-3 font-semibold text-right">ยอดวิว (Views)</th>
                  <th class="px-4 py-3 font-semibold text-right">จำนวนโพสต์ (Posts)</th>
                  <th class="px-4 py-3 font-semibold text-center w-32">จัดการ</th>
                </tr>
              </thead>
              <tbody id="dataTableBody" class="text-sm text-gray-700">
                <tr><td colspan="5" class="text-center py-8 text-gray-400">กรุณากดปุ่ม "ดึงข้อมูล" เพื่อดูสถิติ</td></tr>
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

  updateUI() {
    const subtitle = document.getElementById('dashboardSubtitle')
    const backBtn = document.getElementById('backToOverviewBtn')
    const tableTitle = document.getElementById('tableTitle')
    const tableHeaderRow = document.getElementById('tableHeaderRow')

    if (this.currentViewMode === 'OVERVIEW') {
      if (subtitle) subtitle.textContent = "หมวดหมู่ภาพรวมการดูเนื้อหา (Overview Details)"
      if (backBtn) backBtn.classList.add('hidden')
      if (tableTitle) tableTitle.textContent = "สถิติแยกตามกลุ่ม (Groups)"
      if (tableHeaderRow) {
        tableHeaderRow.innerHTML = `
          <th class="px-4 py-3 font-semibold">กลุ่ม (Group)</th>
          <th class="px-4 py-3 font-semibold text-right border-l border-gray-100">จำนวนเพจ (Pages)</th>
          <th class="px-4 py-3 font-semibold text-right border-l border-gray-100">ยอดวิว (Views)</th>
          <th class="px-4 py-3 font-semibold text-right border-l border-gray-100">จำนวนโพสต์ (Posts)</th>
          <th class="px-4 py-3 font-semibold text-center border-l border-gray-100 w-32">จัดการ</th>
        `
      }
    } else {
      const cat = this.categories.find(c => c.id === this.selectedCategoryId)
      const catName = cat ? cat.name : 'Unknown Group'

      if (subtitle) subtitle.textContent = `เจาะลึกสถิติภายในกลุ่ม: ${catName}`
      if (backBtn) backBtn.classList.remove('hidden')
      if (tableTitle) tableTitle.textContent = `สถิติของเพจในกลุ่ม "${catName}"`
      if (tableHeaderRow) {
        tableHeaderRow.innerHTML = `
          <th class="px-4 py-3 font-semibold">เพจ (Page)</th>
          <th class="px-4 py-3 font-semibold text-right border-l border-gray-100">ยอดวิว (Views)</th>
          <th class="px-4 py-3 font-semibold text-right border-l border-gray-100">จำนวนโพสต์ (Posts)</th>
        `
      }
    }
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

      // Fetch Categories
      const { data: catData, error: catError } = await dbHelpers.fetch('page_categories')
      if (catError) throw new Error("Categories Error: " + catError.message)
      this.categories = catData || []

      // Fetch Daily Stats joined with Pages
      const { data: statsData, error: statsError } = await dbHelpers.fetch('daily_stats', {
        select: `
          date,
          page_media_views,
          posts_count,
          page_id,
          pages ( name, category_id )
        `,
        filters: {
          date: { gte: startDate, lte: endDate }
        },
        orderBy: { column: 'date', ascending: true }
      })
      if (statsError) throw new Error("Stats Error: " + statsError.message)

      this.rawData = statsData || []

      // Default to overview whenever new data loads
      this.currentViewMode = 'OVERVIEW'
      this.selectedCategoryId = null

      this.updateUI()
      this.renderChart()
      this.renderTable()

      Notification.show('โหลดข้อมูลสำเร็จ', 'success')

    } catch (error) {
      console.error('Error loading dashboard data:', error)
      if (tbody) {
        tbody.innerHTML = `
          <tr><td colspan="4" class="text-center py-8 text-red-500">เกิดข้อผิดพลาด: ${error.message}</td></tr>
        `
      }
      Notification.show('โหลดข้อมูลไม่สำเร็จ: ' + error.message, 'error')
    } finally {
      if (loadBtn) {
        loadBtn.disabled = false
        loadBtn.innerHTML = '<i class="fas fa-search mr-2"></i>ดึงข้อมูล'
      }
    }
  }

  // Aggregate data for Overview Layer (Group by Category and Date)
  getOverviewChartData() {
    const datesSet = new Set()

    // First pass Date collection
    this.rawData.forEach(row => datesSet.add(row.date))
    const sortedDates = Array.from(datesSet).sort()

    // Initialize all existing categories with 0 data arrays
    const catDataMap = {}

    // Setup predefined arrays for every category so that empty categories show flat 0 lines
    this.categories.forEach(cat => {
      catDataMap[cat.id] = {
        name: cat.name,
        color: cat.color || this.getRandomColor(cat.id),
        dateViews: Object.fromEntries(sortedDates.map(d => [d, 0]))
      }
    })

    // Second pass to populate views
    this.rawData.forEach(row => {
      const catId = row.pages?.category_id

      if (catId && catDataMap[catId] && row.date && catDataMap[catId].dateViews[row.date] !== undefined) {
        catDataMap[catId].dateViews[row.date] += (row.page_media_views || 0)
      }
    })

    const datasets = []

    // Only process categories that are in the system (this removes deleted ones that might have old data, or keeps active ones that have 0)
    this.categories.forEach(cat => {
      const catData = catDataMap[cat.id]
      const dataLine = sortedDates.map(date => catData.dateViews[date] || 0)

      datasets.push({
        label: catData.name,
        data: dataLine,
        borderColor: catData.color,
        backgroundColor: catData.color, // Solid color for legend box
        tension: 0.1, // Straighter lines
        fill: false, // Turn off fill so lines don't obscure each other with solid color
        borderWidth: 2,
        pointRadius: 0, // Remove points by default
        pointHoverRadius: 5,
        categoryId: cat.id
      })
    })

    return { labels: sortedDates.map(d => uiHelpers.formatDate(d)), datasets }
  }

  // Aggregate data for Group Detail Layer (Group by Page and Date)
  getGroupDetailChartData() {
    const datesSet = new Set()
    const pageDateViews = {}

    // 1. Gather all dates from raw data
    this.rawData.forEach(row => datesSet.add(row.date))
    const sortedDates = Array.from(datesSet).sort()

    // 2. Initialize map for all pages in this group (including 0 view pages)
    const pageDataMap = {}
    const thisGroupPages = this.groupPages || []

    thisGroupPages.forEach(p => {
      pageDataMap[p.page_id] = {
        name: p.name,
        dateViews: Object.fromEntries(sortedDates.map(d => [d, 0]))
      }
    })

    // 3. Map the raw data into the structure
    this.rawData.forEach(row => {
      const catId = row.pages?.category_id
      // Only include data for selected group and ignore null cat fields
      if (!catId || String(catId) !== String(this.selectedCategoryId)) return

      const pId = row.page_id

      // If it exists in the active pages map update it
      if (pageDataMap[pId] && row.date && pageDataMap[pId].dateViews[row.date] !== undefined) {
        pageDataMap[pId].dateViews[row.date] += (row.page_media_views || 0)
      }
    })

    const datasets = thisGroupPages.map((p, index) => {
      const pData = pageDataMap[p.page_id]
      const label = pData.name
      const color = this.getRandomColor(index)

      const data = sortedDates.map(date => pData.dateViews[date] || 0)

      return {
        label,
        data,
        borderColor: color,
        backgroundColor: color, // Solid color for legend box
        tension: 0.1, // Straighter lines
        fill: false,
        borderWidth: 2,
        pointRadius: 0, // Remove points by default
        pointHoverRadius: 4
      }
    })

    return { labels: sortedDates.map(d => uiHelpers.formatDate(d)), datasets }
  }

  renderChart() {
    const ctx = document.getElementById('analyticsChart')
    if (!ctx) return

    // Ensure we destroy any existing chart on this canvas to prevent "Canvas is already in use" error
    // Check if Chart object exists on this canvas using Chart.getChart
    const existingChart = Chart.getChart(ctx)
    if (existingChart) {
      existingChart.destroy()
    } else if (this.chartInstance) {
      this.chartInstance.destroy()
    }
    this.chartInstance = null

    // Configure global Chart.js aesthetic
    Chart.defaults.font.family = "'Kanit', 'Sarabun', 'Inter', sans-serif"
    Chart.defaults.color = '#6b7280' // gray-500

    let chartData = null
    let titleText = ''

    if (this.currentViewMode === 'OVERVIEW') {
      chartData = this.getOverviewChartData()
      titleText = 'เปรียบเทียบยอดวิวระหว่างกลุ่ม (คลิกที่เส้นกราฟเพื่อดูรายละเอียด)'
    } else {
      chartData = this.getGroupDetailChartData()
      titleText = 'เปรียบเทียบยอดวิวระหว่างเพจ'
    }

    this.chartInstance = new Chart(ctx, {
      type: 'line',
      data: chartData,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: titleText,
            font: { size: 16, family: '"Noto Sans Thai", sans-serif' },
            padding: { top: 10, bottom: 20 }
          },
          tooltip: {
            mode: 'index',
            intersect: false,
            callbacks: {
              label: function (context) {
                let label = context.dataset.label || '';
                if (label) {
                  label += ': ';
                }
                if (context.parsed.y !== null) {
                  label += context.parsed.y.toLocaleString();
                }
                return label;
              }
            }
          },
          legend: {
            position: 'top',
            labels: {
              usePointStyle: false,
              boxWidth: 12,
              boxHeight: 12
            }
          }
        },
        interaction: {
          mode: 'nearest',
          axis: 'x',
          intersect: false
        },
        onClick: (e, activeElements) => {
          if (this.currentViewMode === 'OVERVIEW') {
            if (activeElements.length > 0) {
              const datasetIndex = activeElements[0].datasetIndex;
              const metaId = this.chartInstance.data.datasets[datasetIndex].categoryId;
              if (metaId) { // Removed uncategorized check as it's no longer added
                this.drillDown(metaId);
              }
            }
          }
        },
        scales: {
          x: {
            grid: { display: false }
          },
          y: {
            beginAtZero: true,
            grid: {
              color: '#f3f4f6'
            },
            ticks: {
              callback: function (value) {
                if (value >= 1000000) return (value / 1000000).toFixed(1) + 'M';
                if (value >= 1000) return (value / 1000).toFixed(1) + 'k';
                return value;
              }
            }
          }
        }
      }
    });
  }

  async drillDown(categoryId) {
    this.currentViewMode = 'GROUP_DETAIL'
    this.selectedCategoryId = categoryId

    // Fetch pages for this group
    try {
      const { data, error } = await dbHelpers.fetch('pages', { filters: { category_id: categoryId } })
      if (error) throw error
      this.groupPages = data || []
    } catch (err) {
      console.error("Error fetching group pages:", err)
      this.groupPages = []
    }

    this.updateUI()
    this.renderChart()
    this.renderTable()
  }

  renderTable() {
    const tbody = document.getElementById('dataTableBody')
    const totalViewsEl = document.getElementById('totalViews')
    const totalPostsEl = document.getElementById('totalPosts')

    if (!this.rawData || this.rawData.length === 0) {
      if (tbody) {
        tbody.innerHTML = `
          <tr><td colspan="${this.currentViewMode === 'OVERVIEW' ? 4 : 3}" class="text-center py-8 text-gray-500">ไม่พบข้อมูลในช่วงวันที่เลือก</td></tr>
        `
      }
      if (totalViewsEl) totalViewsEl.textContent = "0"
      if (totalPostsEl) totalPostsEl.textContent = "0"
      return
    }

    let sumViews = 0
    let sumPosts = 0
    let tableHTML = ''

    if (this.currentViewMode === 'OVERVIEW') {
      // OVERVIEW Mode: Group by Category
      const groupTotals = {}

      // Initialize all known groups to 0 so they show up
      this.categories.forEach(cat => {
        groupTotals[cat.id] = {
          name: cat.name,
          views: 0,
          posts: 0,
          uniquePages: new Set(),
          color: cat.color || this.getRandomColor(cat.id)
        }
      })

      this.rawData.forEach(row => {
        const catId = row.pages?.category_id
        const views = parseInt(row.page_media_views) || 0
        const posts = parseInt(row.posts_count) || 0
        const pId = row.page_id

        sumViews += views
        sumPosts += posts

        // Only add up if it maps to an active group map
        if (catId && groupTotals[catId]) {
          groupTotals[catId].views += views
          groupTotals[catId].posts += posts
          if (pId) groupTotals[catId].uniquePages.add(pId)
        }
      })

      const sortedCatIds = Object.keys(groupTotals).sort((a, b) => groupTotals[b].views - groupTotals[a].views)

      sortedCatIds.forEach(catId => {
        const data = groupTotals[catId]
        const name = data.name
        const color = data.color
        const pageCount = data.uniquePages ? data.uniquePages.size : 0

        const trClass = 'hover:bg-gray-50 transition border-b border-gray-100 group'
        const actionHtml = `<button class="text-indigo-600 hover:text-indigo-800 text-xs font-semibold view-group-btn opacity-0 group-hover:opacity-100 transition" data-id="${catId}">รายละเอียด &rarr;</button>`

        tableHTML += `
          <tr class="${trClass}">
            <td class="px-4 py-3">
              <div class="flex items-center">
                <span class="w-2.5 h-2.5 rounded-sm mr-3" style="background-color: ${color}"></span>
                <span class="font-medium text-gray-900">${name}</span>
              </div>
            </td>
            <td class="px-4 py-3 text-right text-gray-600 border-l border-gray-50">${uiHelpers.formatNumber(pageCount)}</td>
            <td class="px-4 py-3 text-right font-semibold text-gray-900 border-l border-gray-50">${uiHelpers.formatNumber(data.views)}</td>
            <td class="px-4 py-3 text-right text-gray-600 border-l border-gray-50">${uiHelpers.formatNumber(data.posts)}</td>
            <td class="px-4 py-3 text-center border-l border-gray-50 w-32">${actionHtml}</td>
          </tr>
        `
      })
    } else {
      // GROUP_DETAIL Mode: Group by Page for the selected Category
      const pageTotals = {}
      const thisGroupPages = this.groupPages || []

      thisGroupPages.forEach(p => {
        pageTotals[p.page_id] = { name: p.name, views: 0, posts: 0 }
      })

      this.rawData.forEach(row => {
        const catId = row.pages?.category_id || 'uncategorized'
        if (String(catId) !== String(this.selectedCategoryId)) return

        const pId = row.page_id
        const views = row.page_media_views || 0
        const posts = row.posts_count || 0
        sumViews += views
        sumPosts += posts

        if (pageTotals[pId]) {
          pageTotals[pId].views += views
          pageTotals[pId].posts += posts
        }
      })

      const sortedPageIds = Object.keys(pageTotals).sort((a, b) => pageTotals[b].views - pageTotals[a].views)

      sortedPageIds.forEach(pId => {
        const data = pageTotals[pId]
        tableHTML += `
          <tr class="hover:bg-gray-50 transition border-b border-gray-100">
            <td class="px-4 py-3 font-medium text-gray-900">${data.name}</td>
            <td class="px-4 py-3 text-right font-semibold text-gray-900 border-l border-gray-50">${uiHelpers.formatNumber(data.views)}</td>
            <td class="px-4 py-3 text-right text-gray-600 border-l border-gray-50">${uiHelpers.formatNumber(data.posts)}</td>
          </tr>
        `
      })

      if (sortedPageIds.length === 0) {
        tableHTML = `<tr><td colspan="3" class="text-center py-8 text-gray-500">ไม่พบเพจในกลุ่มนี้</td></tr>`
      }
    }

    if (tbody) tbody.innerHTML = tableHTML
    if (totalViewsEl) totalViewsEl.textContent = uiHelpers.formatNumber(sumViews)
    if (totalPostsEl) totalPostsEl.textContent = uiHelpers.formatNumber(sumPosts)

    // Bind click events to 'view_group_btn' if any
    if (this.currentViewMode === 'OVERVIEW') {
      setTimeout(() => {
        const btns = document.querySelectorAll('.view-group-btn')
        btns.forEach(btn => {
          btn.addEventListener('click', (e) => {
            const catId = e.currentTarget.dataset.id
            if (catId) this.drillDown(catId)
          })
        })
      }, 0)
    }
  }

  // Utility to generate random colors for the charts
  getRandomColor(seed) {
    const colors = [
      '#ef4444', '#f97316', '#f59e0b', '#84cc16', '#22c55e', '#10b981', '#14b8a6',
      '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899'
    ]
    if (typeof seed === 'number') {
      return colors[Math.abs(seed) % colors.length]
    }
    // String hash
    let hash = 0
    for (let i = 0; i < seed.length; i++) {
      hash = seed.charCodeAt(i) + ((hash << 5) - hash)
    }
    return colors[Math.abs(hash) % colors.length]
  }
}
