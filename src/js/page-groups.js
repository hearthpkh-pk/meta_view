import { dbHelpers } from '../utils/database.js'
import { uiHelpers } from '../utils/ui.js'

class PageGroupsManager {
  constructor() {
    this.categories = []
    this.pages = []
    this.draggedElement = null
    this.init()
  }

  init() {
    this.bindEvents()
    this.loadCategories()
    this.loadActivePages()
  }

  bindEvents() {
    document.getElementById('addCategoryBtn').addEventListener('click', () => this.addCategory())
    document.getElementById('refreshBtn').addEventListener('click', () => this.refresh())
    document.getElementById('saveLayoutBtn').addEventListener('click', () => this.saveLayout())
    
    // Add enter key support for category input
    document.getElementById('newCategoryName').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.addCategory()
    })
  }

  async loadCategories() {
    try {
      const { data, error } = await dbHelpers.fetch('page_categories', {
        orderBy: { column: 'sort_order', ascending: true }
      })

      if (error && error.message !== 'No rows found') {
        throw new Error(error.message)
      }

      this.categories = data || []
      
      // Create default categories if none exist
      if (this.categories.length === 0) {
        await this.createDefaultCategories()
      }
      
      this.renderCategories()
    } catch (error) {
      console.error('Error loading categories:', error)
      uiHelpers.showNotification('เกิดข้อผิดพลาดในการโหลดหมวดหมู่: ' + error.message, 'error')
    }
  }

  async createDefaultCategories() {
    const defaultCategories = [
      { name: 'หน้าหลัก', sort_order: 1, color: '#3B82F6' },
      { name: 'ข่าวสาร', sort_order: 2, color: '#10B981' },
      { name: 'บันเทิง', sort_order: 3, color: '#F59E0B' },
      { name: 'ธุรกิจ', sort_order: 4, color: '#8B5CF6' },
      { name: 'อื่นๆ', sort_order: 5, color: '#6B7280' }
    ]

    for (const category of defaultCategories) {
      await dbHelpers.insert('page_categories', category)
    }

    const { data } = await dbHelpers.fetch('page_categories', {
      orderBy: { column: 'sort_order', ascending: true }
    })
    this.categories = data
  }

  async loadActivePages() {
    try {
      const { data, error } = await dbHelpers.fetch('pages', {
        filters: { is_active: true },
        select: '*, tokens(name)',
        orderBy: { column: 'name', ascending: true }
      })

      if (error) {
        throw new Error(error.message)
      }

      this.pages = data || []
      this.renderPages()
      this.checkEmptyState()
    } catch (error) {
      console.error('Error loading pages:', error)
      uiHelpers.showNotification('เกิดข้อผิดพลาดในการโหลดเพจ: ' + error.message, 'error')
    }
  }

  renderCategories() {
    const board = document.getElementById('kanbanBoard')
    board.innerHTML = ''

    this.categories.forEach(category => {
      const categoryEl = this.createCategoryElement(category)
      board.appendChild(categoryEl)
    })

    this.setupDragAndDrop()
  }

  createCategoryElement(category) {
    const template = document.getElementById('categoryTemplate')
    const clone = template.content.cloneNode(true)

    clone.querySelector('.category-name').textContent = category.name
    clone.querySelector('.category-column').dataset.categoryId = category.id
    clone.querySelector('.category-column').style.borderColor = category.color || '#6B7280'

    // Add event listeners
    clone.querySelector('.edit-category').addEventListener('click', () => this.editCategory(category.id))
    clone.querySelector('.delete-category').addEventListener('click', () => this.deleteCategory(category.id))

    return clone
  }

  renderPages() {
    // Clear existing pages
    document.querySelectorAll('.page-card').forEach(card => card.remove())

    // Add pages to their categories
    this.pages.forEach(page => {
      const categoryId = page.category_id || this.categories[0]?.id
      const categoryEl = document.querySelector(`[data-category-id="${categoryId}"] .pages-container`)
      
      if (categoryEl) {
        const pageCard = this.createPageCard(page)
        categoryEl.appendChild(pageCard)
      }
    })

    this.updatePageCounts()
    // Setup drag and drop after rendering pages
    this.setupDragAndDrop()
  }

  createPageCard(page) {
    const template = document.getElementById('pageCardTemplate')
    const clone = template.content.cloneNode(true)

    clone.querySelector('.page-name').textContent = page.name
    clone.querySelector('.page-id').textContent = `ID: ${page.page_id}`
    clone.querySelector('.token-name').textContent = page.tokens?.name || 'ไม่มี Token'
    clone.querySelector('.page-card').dataset.pageId = page.page_id
    clone.querySelector('.page-card').draggable = true

    // Add event listeners
    clone.querySelector('.remove-page').addEventListener('click', (e) => {
      e.stopPropagation()
      this.removePageFromCategory(page.page_id)
    })

    return clone
  }

  setupDragAndDrop() {
    const pageCards = document.querySelectorAll('.page-card')
    const containers = document.querySelectorAll('.pages-container')

    console.log('Setting up drag and drop for', pageCards.length, 'pages and', containers.length, 'containers')

    pageCards.forEach(card => {
      card.addEventListener('dragstart', (e) => {
        console.log('Drag started:', e.target.dataset.pageId)
        this.draggedElement = e.target
        e.target.classList.add('opacity-50')
      })

      card.addEventListener('dragend', (e) => {
        console.log('Drag ended')
        e.target.classList.remove('opacity-50')
      })
    })

    containers.forEach(container => {
      container.addEventListener('dragover', (e) => {
        e.preventDefault()
        container.classList.add('border-blue-400', 'bg-blue-50')
      })

      container.addEventListener('dragleave', () => {
        container.classList.remove('border-blue-400', 'bg-blue-50')
      })

      container.addEventListener('drop', (e) => {
        e.preventDefault()
        console.log('Drop event triggered')
        container.classList.remove('border-blue-400', 'bg-blue-50')
        
        if (this.draggedElement) {
          console.log('Dropping page:', this.draggedElement.dataset.pageId, 'to category:', container.closest('.category-column').dataset.categoryId)
          container.appendChild(this.draggedElement)
          this.updatePageCategory(this.draggedElement.dataset.pageId, container.closest('.category-column').dataset.categoryId)
          this.updatePageCounts()
        }
      })
    })
  }

  async updatePageCategory(pageId, categoryId) {
    try {
      const { error } = await dbHelpers.update('pages', 
        { category_id: categoryId }, 
        { page_id: pageId }
      )

      if (error) {
        throw new Error(error.message)
      }

      uiHelpers.showNotification('อัปเดตหมวดหมู่สำเร็จ', 'success')
    } catch (error) {
      uiHelpers.showNotification('อัปเดตหมวดหมู่ไม่สำเร็จ: ' + error.message, 'error')
    }
  }

  updatePageCounts() {
    this.categories.forEach(category => {
      const categoryEl = document.querySelector(`[data-category-id="${category.id}"]`)
      const count = categoryEl.querySelectorAll('.page-card').length
      categoryEl.querySelector('.page-count').textContent = count
    })
  }

  async addCategory() {
    const name = document.getElementById('newCategoryName').value.trim()
    
    if (!name) {
      uiHelpers.showNotification('กรุณาระบุชื่อหมวดหมู่', 'warning')
      return
    }

    try {
      const maxSort = Math.max(...this.categories.map(c => c.sort_order || 0), 0)
      const { error } = await dbHelpers.insert('page_categories', {
        name,
        sort_order: maxSort + 1,
        color: this.getRandomColor()
      })

      if (error) {
        throw new Error(error.message)
      }

      document.getElementById('newCategoryName').value = ''
      await this.loadCategories()
      uiHelpers.showNotification('เพิ่มหมวดหมู่สำเร็จ', 'success')
    } catch (error) {
      uiHelpers.showNotification('เพิ่มหมวดหมู่ไม่สำเร็จ: ' + error.message, 'error')
    }
  }

  async editCategory(categoryId) {
    const category = this.categories.find(c => c.id === categoryId)
    const newName = prompt('แก้ไขชื่อหมวดหมู่:', category.name)
    
    if (newName && newName.trim()) {
      try {
        const { error } = await dbHelpers.update('page_categories', 
          { name: newName.trim() }, 
          { id: categoryId }
        )

        if (error) {
          throw new Error(error.message)
        }

        await this.loadCategories()
        uiHelpers.showNotification('แก้ไขหมวดหมู่สำเร็จ', 'success')
      } catch (error) {
        uiHelpers.showNotification('แก้ไขหมวดหมู่ไม่สำเร็จ: ' + error.message, 'error')
      }
    }
  }

  async deleteCategory(categoryId) {
    if (!confirm('คุณแน่ใจหรือไม่ว่าต้องการลบหมวดหมู่นี้? เพจที่อยู่ในหมวดหมู่จะถูกย้ายไปหมวดหมู่แรก')) {
      return
    }

    try {
      // Move pages to first category
      const firstCategory = this.categories.find(c => c.id !== categoryId)
      if (firstCategory) {
        const pagesInCategory = document.querySelectorAll(`[data-category-id="${categoryId}"] .page-card`)
        pagesInCategory.forEach(card => {
          this.updatePageCategory(card.dataset.pageId, firstCategory.id)
        })
      }

      const { error } = await dbHelpers.delete('page_categories', { id: categoryId })

      if (error) {
        throw new Error(error.message)
      }

      await this.loadCategories()
      await this.loadActivePages()
      uiHelpers.showNotification('ลบหมวดหมู่สำเร็จ', 'success')
    } catch (error) {
      uiHelpers.showNotification('ลบหมวดหมู่ไม่สำเร็จ: ' + error.message, 'error')
    }
  }

  async removePageFromCategory(pageId) {
    const firstCategory = this.categories[0]
    if (firstCategory) {
      await this.updatePageCategory(pageId, firstCategory.id)
      await this.loadActivePages()
    }
  }

  checkEmptyState() {
    const emptyState = document.getElementById('emptyState')
    const kanbanBoard = document.getElementById('kanbanBoard')
    
    if (this.pages.length === 0) {
      emptyState.classList.remove('hidden')
      kanbanBoard.classList.add('hidden')
    } else {
      emptyState.classList.add('hidden')
      kanbanBoard.classList.remove('hidden')
    }
  }

  async saveLayout() {
    // This could save the order of categories and pages
    uiHelpers.showNotification('บันทึกรูปแบบสำเร็จ', 'success')
  }

  async refresh() {
    await this.loadCategories()
    await this.loadActivePages()
    uiHelpers.showNotification('รีเฟรชข้อมูลสำเร็จ', 'success')
  }

  getRandomColor() {
    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316']
    return colors[Math.floor(Math.random() * colors.length)]
  }
}

// Initialize the page groups manager
const pageGroupsManager = new PageGroupsManager()
