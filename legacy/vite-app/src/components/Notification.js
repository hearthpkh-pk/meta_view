import { BaseComponent } from './BaseComponent.js'

/**
 * Notification Component
 * Shows toast notifications
 */
export class Notification extends BaseComponent {
  static instances = []

  constructor(message, type = 'info', duration = 3000) {
    super()
    this.message = message
    this.type = type
    this.duration = duration
    this.createElement()
    this.show()
  }

  createElement() {
    this.element = document.createElement('div')
    this.element.className = `notification fixed bottom-6 right-6 px-4 py-3 rounded-lg border shadow-lg z-50 text-sm font-medium flex items-center gap-2 max-w-sm ${this.getTypeClasses()}`
    this.element.innerHTML = this.getIconHtml() + '<span>' + this.message + '</span>'
    document.body.appendChild(this.element)
  }

  getTypeClasses() {
    const types = {
      success: 'bg-green-50 text-green-700 border-green-200 shadow-green-100',
      error: 'bg-red-50 text-red-700 border-red-200 shadow-red-100',
      warning: 'bg-yellow-50 text-yellow-700 border-yellow-200 shadow-yellow-100',
      info: 'bg-blue-50 text-blue-700 border-blue-200 shadow-blue-100'
    }
    return types[this.type] || types.info
  }

  getIconHtml() {
    const icons = {
      success: '<i class="fas fa-check-circle text-green-500"></i>',
      error: '<i class="fas fa-exclamation-circle text-red-500"></i>',
      warning: '<i class="fas fa-exclamation-triangle text-yellow-500"></i>',
      info: '<i class="fas fa-info-circle text-blue-500"></i>'
    }
    return icons[this.type] || icons.info
  }

  show() {
    // Add animation
    this.element.style.animation = 'slideIn 0.3s ease-out'
    Notification.instances.push(this)

    // Auto hide
    if (this.duration > 0) {
      setTimeout(() => this.hide(), this.duration)
    }
  }

  hide() {
    this.element.style.animation = 'slideOut 0.3s ease-out'
    setTimeout(() => {
      this.destroy()
      const index = Notification.instances.indexOf(this)
      if (index > -1) {
        Notification.instances.splice(index, 1)
      }
    }, 300)
  }

  static show(message, type = 'info', duration = 3000) {
    return new Notification(message, type, duration)
  }

  static clearAll() {
    Notification.instances.forEach(notification => notification.destroy())
    Notification.instances = []
  }
}

// Add CSS animations
if (!document.querySelector('#notification-styles')) {
  const style = document.createElement('style')
  style.id = 'notification-styles'
  style.textContent = `
    @keyframes slideIn {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
      from { transform: translateX(0); opacity: 1; }
      to { transform: translateX(100%); opacity: 0; }
    }
  `
  document.head.appendChild(style)
}
