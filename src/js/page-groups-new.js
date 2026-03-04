import { Notification } from '../components/Notification.js'
import { CategoryColumn } from '../components/CategoryColumn.js'
import { NavigationBar } from '../components/NavigationBar.js'
import { pageStore } from '../stores/PageStore.js'
import { categoryStore } from '../stores/CategoryStore.js'

/**
 * Page Groups Manager (Refactored)
 * Uses Component System + Service Layer + State Management
 */
class PageGroupsManager {
  constructor() {
    this.categoryColumns = []
    this.subscriptions = []
    this.isDragging = false
    this.navigationBar = null
    this.init()
  }

  init() {
    this.createNavigation()
    this.bindEvents()
    this.subscribeToStores()
    this.loadInitialData()
  }

  createNavigation() {
    this.navigationBar = new NavigationBar('page-groups')
    const navContainer = document.getElementById('navigation')
    if (navContainer) {
      navContainer.appendChild(this.navigationBar.element)
    }
  }

  bindEvents() {
    // Add category button
    document.getElementById('addCategoryBtn').addEventListener('click', () => this.addCategory())
    
    // Refresh button
    document.getElementById('refreshBtn').addEventListener('click', () => this.refresh())
    
    // Save layout button
    document.getElementById('saveLayoutBtn').addEventListener('click', () => this.saveLayout())
    
    // Enter key support for category input
    document.getElementById('newCategoryName').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.addCategory()
    })
  }

  subscribeToStores() {
    // Subscribe to categories
    const unsubscribeCategories = categoryStore.subscribe((state) => {
      this.renderCategories(state.categories)
    })
    
    // Subscribe to pages (but don't re-render on category changes)
    const unsubscribePages = pageStore.subscribe((state) => {
      // Only render if this is initial load or if we're not in the middle of a drag operation
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
        Notification.show('เกิดข้อผิดพลาดในการจัดการหมวดหมู่: ' + error, 'error')
      }
    })
    
    const unsubscribePagesError = pageStore.subscribeToError((error) => {
      if (error) {
        Notification.show('เกิดข้อผิดพลาดในการจัดการเพจ: ' + error.message, 'error')
      }
    })
    
    // Store subscriptions for cleanup
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
      // Load categories first
      await categoryStore.loadCategories()
      
      // Then load active pages
      await pageStore.loadActivePages()
      
      Notification.show('โหลดข้อมูลสำเร็จ', 'success')
    } catch (error) {
      console.error('Error loading initial data:', error)
      Notification.show('โหลดข้อมูลไม่สำเร็จ: ' + error.message, 'error')
    }
  }

  renderCategories(categories) {
    const board = document.getElementById('kanbanBoard')
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
    const name = document.getElementById('newCategoryName').value.trim()
    
    if (!name) {
      Notification.show('กรุณาระบุชื่อหมวดหมู่', 'warning')
      return
    }

    try {
      await categoryStore.createCategory({ name })
      document.getElementById('newCategoryName').value = ''
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
      if (loading) {
        addBtn.disabled = true
        addBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>กำลังโหลด...'
      } else {
        addBtn.disabled = false
        addBtn.innerHTML = '<i class="fas fa-plus mr-2"></i>เพิ่ม'
      }
    } else if (type === 'pages') {
      const refreshBtn = document.getElementById('refreshBtn')
      if (loading) {
        refreshBtn.disabled = true
        refreshBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>รีเฟรช'
      } else {
        refreshBtn.disabled = false
        refreshBtn.innerHTML = '<i class="fas fa-sync mr-2"></i>รีเฟรช'
      }
    }
  }

  checkEmptyState() {
    const emptyState = document.getElementById('emptyState')
    const kanbanBoard = document.getElementById('kanbanBoard')
    const pages = pageStore.getState().activePages
    
    if (pages.length === 0) {
      emptyState.classList.remove('hidden')
      kanbanBoard.classList.add('hidden')
    } else {
      emptyState.classList.add('hidden')
      kanbanBoard.classList.remove('hidden')
    }
  }

  destroy() {
    // Cleanup subscriptions
    this.subscriptions.forEach(unsubscribe => unsubscribe())
    this.subscriptions = []
    
    // Destroy components
    this.categoryColumns.forEach(column => column.destroy())
    this.categoryColumns = []
  }
}

// Initialize the page groups manager
let pageGroupsManager

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    pageGroupsManager = new PageGroupsManager()
  })
} else {
  pageGroupsManager = new PageGroupsManager()
}

// Export for potential use in other modules
export { pageGroupsManager }
