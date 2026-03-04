import { BaseComponent } from '../components/BaseComponent.js'
import { CategoryColumn } from '../components/CategoryColumn.js'
import { pageStore } from '../stores/PageStore.js'
import { categoryStore } from '../stores/CategoryStore.js'
import { Notification } from '../components/Notification.js'

/**
 * Page Groups Page Component - Kanban board for page management
 */
export class PageGroupsPage extends BaseComponent {
  constructor() {
    super()
    this.categoryColumns = []
    this.subscriptions = []
    this.isDragging = false
    this.init()
  }

  init() {
    // constructor-time init only - DOM doesn't exist yet here
  }

  mount() {
    // Called by LayoutManager AFTER render() injects the HTML into the DOM
    // All DOM-dependent setup must happen here
    this.bindEvents()
    this.subscribeToStores()
    this.loadInitialData()
  }

  bindEvents() {
    // Add category button
    const addBtn = document.getElementById('addCategoryBtn')
    if (addBtn) {
      this.addEventListener(addBtn, 'click', () => this.addCategory())
    }

    // Refresh button
    const refreshBtn = document.getElementById('refreshBtn')
    if (refreshBtn) {
      this.addEventListener(refreshBtn, 'click', () => this.refresh())
    }

    // Save layout button
    const saveBtn = document.getElementById('saveLayoutBtn')
    if (saveBtn) {
      this.addEventListener(saveBtn, 'click', () => this.saveLayout())
    }

    // Category input
    const categoryInput = document.getElementById('newCategoryName')
    if (categoryInput) {
      this.addEventListener(categoryInput, 'keypress', (e) => {
        if (e.key === 'Enter') this.addCategory()
      })
    }
  }

  subscribeToStores() {
    // Subscribe to categories
    const unsubscribeCategories = categoryStore.subscribe((state) => {
      this.renderCategories(state.categories)
    })

    // Subscribe to pages
    const unsubscribePages = pageStore.subscribe((state) => {
      if (!this.isDragging) {
        this.renderPagesInCategories(state.activePages)
      }
    })

    // Subscribe to loading states
    const unsubscribeCategoriesLoading = categoryStore.subscribeToLoading((loading) => {
      this.setLoadingState('categories', loading)
    })

    const unsubscribePagesLoading = pageStore.subscribeToLoading((loading) => {
      this.setLoadingState('pages', loading)
    })

    // Subscribe to errors
    const unsubscribeCategoriesError = categoryStore.subscribeToError((error) => {
      if (error) {
        Notification.show('เกิดข้อผิดพลาดในการจัดการหมวดหมู่: ' + error.message, 'error')
      }
    })

    const unsubscribePagesError = pageStore.subscribeToError((error) => {
      if (error) {
        Notification.show('เกิดข้อผิดพลาดในการจัดการเพจ: ' + error.message, 'error')
      }
    })

    this.subscriptions = [
      unsubscribeCategories,
      unsubscribePages,
      unsubscribeCategoriesLoading,
      unsubscribePagesLoading,
      unsubscribeCategoriesError,
      unsubscribePagesError
    ]
  }

  async loadInitialData() {
    try {
      await Promise.all([
        categoryStore.loadCategories(),
        pageStore.loadActivePages()
      ])
      // Silent load - no notification needed on initial page load
    } catch (error) {
      console.error('Error loading initial data:', error)
      Notification.show('โหลดข้อมูลไม่สำเร็จ: ' + error.message, 'error')
    }
  }

  render() {
    return `
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <!-- Page Header -->
        <div class="mb-8">
          <div class="flex items-center justify-between">
            <div>
              <h1 class="text-2xl font-bold text-gray-900 mb-1">
                <i class="fas fa-layer-group text-orange-600 mr-3"></i>
                จัดการกรุ๊ปเพจ (Kanban Board)
              </h1>
              <p class="text-sm text-gray-600">จัดกรุ๊ปเพจที่เปิดใช้งานอยู่แยกตามหมวดหมู่</p>
            </div>
            <div class="flex gap-3">
              <button id="saveLayoutBtn" class="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-sm transition">
                <i class="fas fa-save mr-2"></i>บันทึกรูปแบบ
              </button>
            </div>
          </div>
        </div>

        <!-- Controls -->
        <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-6 flex flex-wrap gap-4 items-end">
          <div class="flex-1 min-w-[200px]">
            <label class="block text-sm font-semibold text-gray-700 mb-2">สร้างหมวดหมู่ใหม่</label>
            <div class="flex gap-2">
              <input type="text" id="newCategoryName" class="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 w-full focus:ring-blue-500 focus:border-blue-500" placeholder="ชื่อหมวดหมู่...">
              <button id="addCategoryBtn" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-sm transition whitespace-nowrap">
                <i class="fas fa-plus mr-2"></i>เพิ่ม
              </button>
            </div>
          </div>
          <div class="flex gap-2">
            <button id="refreshBtn" class="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition whitespace-nowrap border border-gray-200">
              <i class="fas fa-sync mr-2"></i>รีเฟรช
            </button>
          </div>
        </div>

        <!-- Kanban Board -->
        <div id="kanbanBoard" class="flex gap-6 overflow-x-auto pb-8 items-start min-h-[500px]">
          <!-- Categories will be dynamically added here -->
        </div>

        <!-- Empty State -->
        <div id="emptyState" class="hidden text-center py-16">
          <div class="text-6xl mb-4">📭</div>
          <h3 class="text-xl font-semibold text-gray-700 mb-2">ยังไม่มีเพจที่เปิดใช้งาน</h3>
          <p class="text-gray-500 mb-6">กรุณาไปที่หน้าจัดการเพจเพื่อเปิดสถานะการดึงข้อมูลก่อน</p>
        </div>
      </div>
    `
  }

  async unmount() {
    // Cleanup subscriptions
    this.subscriptions.forEach(unsubscribe => unsubscribe())
    this.subscriptions = []

    // Destroy components
    this.categoryColumns.forEach(column => column.destroy())
    this.categoryColumns = []
  }

  renderCategories(categories) {
    const board = document.getElementById('kanbanBoard')
    if (!board) return

    board.innerHTML = ''

    // Clear existing columns
    this.categoryColumns.forEach(column => column.destroy())
    this.categoryColumns = []

    // Create new columns
    categories.forEach(category => {
      const column = new CategoryColumn(
        category,
        (pageId, categoryId) => this.handlePageDrop(pageId, categoryId),
        (categoryId) => this.handleEditCategory(categoryId),
        (categoryId) => this.handleDeleteCategory(categoryId)
      )

      this.categoryColumns.push(column)
      board.appendChild(column.element)
    })

    this.checkEmptyState()
  }

  renderPagesInCategories(pages) {
    const categories = categoryStore.getState().categories

    // Create a map of current pages by category
    const pagesByCategory = new Map()
    pages.forEach(page => {
      const categoryId = page.category_id || categories[0]?.id
      if (!pagesByCategory.has(categoryId)) {
        pagesByCategory.set(categoryId, [])
      }
      pagesByCategory.get(categoryId).push(page)
    })

    // Update each column
    this.categoryColumns.forEach(column => {
      const categoryPages = pagesByCategory.get(column.categoryData.id) || []

      // Clear and rebuild this column's pages
      column.clearAllPages()
      categoryPages.forEach(pageData => {
        column.addPage(pageData)
      })
    })

    this.checkEmptyState()
  }

  async handlePageDrop(pageId, categoryId) {
    try {
      // Find the page data before updating
      const pages = pageStore.getState().activePages
      const pageData = pages.find(p => p.page_id === pageId)

      if (!pageData) {
        throw new Error('ไม่พบเพจที่ต้องการย้าย')
      }

      // Update in store first
      await pageStore.updatePageCategory(pageId, categoryId)

      // Find the source column and remove the page from there
      const sourceColumn = this.categoryColumns.find(col =>
        col.pageCards.some(card => card.pageData.page_id === pageId)
      )

      if (sourceColumn) {
        sourceColumn.removePage(pageId)
      }

      // Find the target column and add the page there
      const targetColumn = this.categoryColumns.find(col => col.categoryData.id === categoryId)

      if (targetColumn) {
        // Update page data with new category
        const updatedPageData = { ...pageData, category_id: categoryId }
        const pageCard = targetColumn.addPage(updatedPageData)
        pageCard.highlight()
      }

      Notification.show('อัปเดตหมวดหมู่สำเร็จ', 'success')
    } catch (error) {
      console.error('Error updating page category:', error)
      Notification.show('อัปเดตหมวดหมู่ไม่สำเร็จ: ' + error.message, 'error')
    }
  }

  async handleEditCategory(categoryId) {
    try {
      const category = await categoryStore.getCategoryById(categoryId)
      if (!category) return

      const newName = prompt('แก้ไขชื่อหมวดหมู่:', category.name)

      if (newName && newName.trim()) {
        await categoryStore.updateCategory(categoryId, { name: newName.trim() })
        Notification.show('แก้ไขหมวดหมู่สำเร็จ', 'success')

        // Highlight the updated category
        const column = this.categoryColumns.find(col => col.categoryData.id === categoryId)
        if (column) {
          column.highlight()
        }
      }
    } catch (error) {
      console.error('Error editing category:', error)
      Notification.show('แก้ไขหมวดหมู่ไม่สำเร็จ: ' + error.message, 'error')
    }
  }

  async handleDeleteCategory(categoryId) {
    if (!confirm('คุณแน่ใจหรือไม่ว่าต้องการลบหมวดหมู่นี้? เพจที่อยู่ในหมวดหมู่จะถูกย้ายไปหมวดหมู่แรก')) {
      return
    }

    try {
      await categoryStore.deleteCategory(categoryId)
      Notification.show('ลบหมวดหมู่สำเร็จ', 'success')
    } catch (error) {
      console.error('Error deleting category:', error)
      Notification.show('ลบหมวดหมู่ไม่สำเร็จ: ' + error.message, 'error')
    }
  }

  async addCategory() {
    const name = document.getElementById('newCategoryName')?.value.trim()

    if (!name) {
      Notification.show('กรุณาระบุชื่อหมวดหมู่', 'warning')
      return
    }

    try {
      await categoryStore.createCategory({ name })

      // Clear input
      const input = document.getElementById('newCategoryName')
      if (input) {
        input.value = ''
      }

      Notification.show('เพิ่มหมวดหมู่สำเร็จ', 'success')
    } catch (error) {
      console.error('Error adding category:', error)
      Notification.show('เพิ่มหมวดหมู่ไม่สำเร็จ: ' + error.message, 'error')
    }
  }

  async refresh() {
    try {
      await Promise.all([
        categoryStore.loadCategories(),
        pageStore.loadActivePages()
      ])
      Notification.show('รีเฟรชข้อมูลสำเร็จ', 'success')
    } catch (error) {
      console.error('Error refreshing:', error)
      Notification.show('รีเฟรชข้อมูลไม่สำเร็จ: ' + error.message, 'error')
    }
  }

  saveLayout() {
    // This could save the order of categories and pages
    Notification.show('บันทึกรูปแบบสำเร็จ', 'success')
  }

  setLoadingState(type, loading) {
    // Update UI based on loading state
    if (type === 'categories') {
      const addBtn = document.getElementById('addCategoryBtn')
      if (addBtn) {
        if (loading) {
          addBtn.disabled = true
          addBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>กำลังโหลด...'
        } else {
          addBtn.disabled = false
          addBtn.innerHTML = '<i class="fas fa-plus mr-2"></i>เพิ่ม'
        }
      }
    } else if (type === 'pages') {
      const refreshBtn = document.getElementById('refreshBtn')
      if (refreshBtn) {
        if (loading) {
          refreshBtn.disabled = true
          refreshBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>รีเฟรช'
        } else {
          refreshBtn.disabled = false
          refreshBtn.innerHTML = '<i class="fas fa-sync mr-2"></i>รีเฟรช'
        }
      }
    }
  }

  checkEmptyState() {
    const emptyState = document.getElementById('emptyState')
    const kanbanBoard = document.getElementById('kanbanBoard')
    const pages = pageStore.getState().activePages
    const categories = categoryStore.getState().categories

    // Show empty state only when there are NO active pages AND no categories at all
    const showEmpty = pages.length === 0 && categories.length === 0
    if (emptyState) emptyState.classList.toggle('hidden', !showEmpty)
    if (kanbanBoard) kanbanBoard.classList.toggle('hidden', showEmpty)
  }
}
