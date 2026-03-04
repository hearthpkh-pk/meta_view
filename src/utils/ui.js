// UI Helper functions
export const uiHelpers = {
  // Show loading state
  showLoading(elementId, message = 'กำลังโหลด...') {
    const element = document.getElementById(elementId)
    if (element) {
      element.innerHTML = `<div class="text-center py-8 text-gray-500"><div class="animate-pulse">${message}</div></div>`
    }
  },
  
  // Show error message
  showError(elementId, message) {
    const element = document.getElementById(elementId)
    if (element) {
      element.innerHTML = `<div class="text-center py-4 text-red-500">เกิดข้อผิดพลาด: ${message}</div>`
    }
  },
  
  // Show empty state
  showEmpty(elementId, message) {
    const element = document.getElementById(elementId)
    if (element) {
      element.innerHTML = `<div class="text-center py-8 text-gray-500">${message}</div>`
    }
  },
  
  // Format number with locale
  formatNumber(num) {
    return num ? num.toLocaleString() : '0'
  },
  
  // Format date
  formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('th-TH')
  },
  
  // Debounce function
  debounce(func, wait) {
    let timeout
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout)
        func(...args)
      }
      clearTimeout(timeout)
      timeout = setTimeout(later, wait)
    }
  },
  
  // Show notification
  showNotification(message, type = 'info') {
    const colors = {
      success: 'bg-green-100 text-green-700 border-green-200',
      error: 'bg-red-100 text-red-700 border-red-200',
      warning: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      info: 'bg-blue-100 text-blue-700 border-blue-200'
    }
    
    const notification = document.createElement('div')
    notification.className = `fixed top-4 right-4 px-6 py-3 rounded-lg border shadow-lg z-50 ${colors[type]}`
    notification.textContent = message
    
    document.body.appendChild(notification)
    
    setTimeout(() => {
      notification.remove()
    }, 3000)
  }
}
