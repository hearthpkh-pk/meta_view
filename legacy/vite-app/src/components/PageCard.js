import { BaseComponent } from './BaseComponent.js'

/**
 * Page Card Component
 * Represents a single page in the kanban board
 */
export class PageCard extends BaseComponent {
  constructor(pageData, onRemove = null) {
    super()
    this.pageData = pageData
    this.onRemove = onRemove
    this.createElement()
    this.setupEventListeners()
  }

  createElement() {
    this.element = document.createElement('div')
    this.element.className = 'page-card bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-3 cursor-move hover:shadow-md transition-shadow'
    this.element.draggable = true
    this.element.dataset.pageId = this.pageData.page_id

    this.element.innerHTML = `
      <div class="flex justify-between items-start mb-2">
        <div class="flex-1">
          <h4 class="font-semibold text-gray-900 text-sm mb-1 page-name">${this.pageData.name}</h4>
          <p class="text-xs text-gray-500 font-mono page-id">ID: ${this.pageData.page_id}</p>
        </div>
        <button class="text-gray-400 hover:text-red-500 text-xs remove-page">
          <i class="fas fa-times"></i>
        </button>
      </div>
      <div class="flex items-center text-xs text-gray-600">
        <i class="fas fa-link mr-1"></i>
        <span class="token-name">${this.pageData.tokens?.name || 'ไม่มี Token'}</span>
      </div>
    `
  }

  setupEventListeners() {
    // Remove button
    this.addEventListener(this.find('.remove-page'), 'click', (e) => {
      e.stopPropagation()
      if (this.onRemove) {
        this.onRemove(this.pageData.page_id)
      }
    })

    // Drag events
    this.addEventListener(this.element, 'dragstart', (e) => {
      console.log('Drag started:', this.pageData.page_id)
      this.element.classList.add('opacity-50')
      e.dataTransfer.effectAllowed = 'move'
      e.dataTransfer.setData('text/plain', this.pageData.page_id)
    })

    this.addEventListener(this.element, 'dragend', (e) => {
      console.log('Drag ended')
      this.element.classList.remove('opacity-50')
    })
  }

  updatePageData(newPageData) {
    this.pageData = { ...this.pageData, ...newPageData }
    this.find('.page-name').textContent = this.pageData.name
    this.find('.token-name').textContent = this.pageData.tokens?.name || 'ไม่มี Token'
  }

  highlight() {
    this.element.classList.add('ring-2', 'ring-blue-400', 'bg-blue-50')
    setTimeout(() => {
      this.element.classList.remove('ring-2', 'ring-blue-400', 'bg-blue-50')
    }, 1000)
  }
}
