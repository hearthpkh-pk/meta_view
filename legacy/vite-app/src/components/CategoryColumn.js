import { BaseComponent } from './BaseComponent.js'
import { PageCard } from './PageCard.js'

/**
 * Category Column Component
 * Represents a category column in the kanban board
 */
export class CategoryColumn extends BaseComponent {
  constructor(categoryData, onDrop = null, onEdit = null, onDelete = null) {
    super()
    this.categoryData = categoryData
    this.onDrop = onDrop
    this.onEdit = onEdit
    this.onDelete = onDelete
    this.pageCards = []
    this.createElement()
    this.setupEventListeners()
  }

  createElement() {
    this.element = document.createElement('div')
    this.element.className = 'category-column flex-shrink-0 w-80 bg-gray-100 rounded-lg p-4'
    this.element.dataset.categoryId = this.categoryData.id
    this.element.style.borderColor = this.categoryData.color || '#6B7280'

    this.element.innerHTML = `
      <div class="flex justify-between items-center mb-4">
        <h3 class="font-bold text-gray-900 category-name">${this.categoryData.name}</h3>
        <div class="flex gap-1">
          <button class="text-gray-400 hover:text-blue-500 text-xs edit-category">
            <i class="fas fa-edit"></i>
          </button>
          <button class="text-gray-400 hover:text-red-500 text-xs delete-category">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </div>
      <div class="pages-container min-h-[200px] bg-white rounded-lg p-3 border-2 border-dashed border-gray-300">
        <!-- Page cards will be added here -->
      </div>
      <div class="text-center mt-2 text-xs text-gray-500">
        <span class="page-count">0</span> เพจ
      </div>
    `
  }

  setupEventListeners() {
    // Edit category
    this.addEventListener(this.find('.edit-category'), 'click', () => {
      if (this.onEdit) {
        this.onEdit(this.categoryData.id)
      }
    })

    // Delete category
    this.addEventListener(this.find('.delete-category'), 'click', () => {
      if (this.onDelete) {
        this.onDelete(this.categoryData.id)
      }
    })

    // Drop zone
    const container = this.find('.pages-container')
    this.addEventListener(container, 'dragover', (e) => {
      e.preventDefault()
      container.classList.add('border-blue-400', 'bg-blue-50')
    })

    this.addEventListener(container, 'dragleave', () => {
      container.classList.remove('border-blue-400', 'bg-blue-50')
    })

    this.addEventListener(container, 'drop', (e) => {
      e.preventDefault()
      console.log('Drop event triggered on category:', this.categoryData.name)
      container.classList.remove('border-blue-400', 'bg-blue-50')

      const pageId = e.dataTransfer.getData('text/plain')
      if (pageId && this.onDrop) {
        this.onDrop(pageId, this.categoryData.id)
      }
    })
  }

  addPage(pageData) {
    // Remove existing card if it exists
    this.removePageById(pageData.page_id)

    const pageCard = new PageCard(pageData, (pageId) => {
      this.removePage(pageId)
    })

    this.pageCards.push(pageCard)
    this.find('.pages-container').appendChild(pageCard.element)
    this.updatePageCount()

    return pageCard
  }

  removePage(pageId) {
    this.removePageById(pageId)
    this.updatePageCount()
  }

  removePageById(pageId) {
    const index = this.pageCards.findIndex(card => card.pageData.page_id === pageId)
    if (index > -1) {
      const card = this.pageCards[index]
      // Remove from DOM first
      if (card.element && card.element.parentNode) {
        card.element.parentNode.removeChild(card.element)
      }
      // Destroy component
      card.destroy()
      // Remove from array
      this.pageCards.splice(index, 1)
      return true
    }
    return false
  }

  updatePageCount() {
    const countElement = this.find('.page-count')
    if (countElement) {
      countElement.textContent = `${this.pageCards.length} เพจ`
    }
  }

  updateCategoryData(newCategoryData) {
    this.categoryData = { ...this.categoryData, ...newCategoryData }
    this.find('.category-name').textContent = this.categoryData.name
    this.element.style.borderColor = this.categoryData.color || '#6B7280'
  }

  highlight() {
    this.element.classList.add('ring-2', 'ring-orange-400')
    setTimeout(() => {
      this.element.classList.remove('ring-2', 'ring-orange-400')
    }, 1000)
  }

  clearAllPages() {
    // Remove all page cards from DOM and clear array
    this.pageCards.forEach(card => {
      if (card.element && card.element.parentNode) {
        card.element.parentNode.removeChild(card.element)
      }
      card.destroy()
    })
    this.pageCards = []
    this.updatePageCount()
  }
}
