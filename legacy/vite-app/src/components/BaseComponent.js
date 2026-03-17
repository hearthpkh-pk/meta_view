/**
 * Base Component Class
 * All UI components should extend this class
 */
export class BaseComponent {
  constructor(element, props = {}) {
    this.element = element || document.createElement('div')
    this.props = props
    this.state = {}
    this.eventListeners = new Map()
    this.childComponents = []
  }

  // Render component (to be overridden by subclasses)
  render() {
    throw new Error('render() method must be implemented')
  }

  // Update component state
  setState(newState) {
    const prevState = { ...this.state }
    this.state = { ...this.state, ...newState }
    this.onStateChange(prevState, this.state)
  }

  // Called when state changes (to be overridden)
  onStateChange(prevState, newState) {
    // Override in subclasses
  }

  // Add event listener with cleanup
  addEventListener(element, event, handler) {
    const wrappedHandler = handler.bind(this)
    element.addEventListener(event, wrappedHandler)
    
    // Store for cleanup
    if (!this.eventListeners.has(element)) {
      this.eventListeners.set(element, [])
    }
    this.eventListeners.get(element).push({ event, handler: wrappedHandler })
  }

  // Remove all event listeners
  removeEventListeners() {
    this.eventListeners.forEach((listeners, element) => {
      listeners.forEach(({ event, handler }) => {
        element.removeEventListener(event, handler)
      })
    })
    this.eventListeners.clear()
  }

  // Find element within component
  find(selector) {
    return this.element.querySelector(selector)
  }

  // Find all elements within component
  findAll(selector) {
    return this.element.querySelectorAll(selector)
  }

  // Destroy component and cleanup
  destroy() {
    this.removeEventListeners()
    this.childComponents.forEach(child => {
      if (typeof child.destroy === 'function') {
        child.destroy()
      }
    })
    this.childComponents = []
    
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element)
    }
  }
}
