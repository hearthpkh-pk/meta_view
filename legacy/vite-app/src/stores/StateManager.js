/**
 * Simple State Management System
 * Based on Observer Pattern
 */
export class StateManager {
  constructor() {
    this.state = {}
    this.subscribers = new Map()
  }

  /**
   * Subscribe to state changes
   */
  subscribe(key, callback) {
    if (!this.subscribers.has(key)) {
      this.subscribers.set(key, new Set())
    }
    this.subscribers.get(key).add(callback)
    
    // Return unsubscribe function
    return () => {
      const callbacks = this.subscribers.get(key)
      if (callbacks) {
        callbacks.delete(callback)
        if (callbacks.size === 0) {
          this.subscribers.delete(key)
        }
      }
    }
  }

  /**
   * Get state value
   */
  getState(key) {
    return this.state[key]
  }

  /**
   * Get entire state
   */
  getAllState() {
    return { ...this.state }
  }

  /**
   * Set state value
   */
  setState(key, value) {
    const oldValue = this.state[key]
    this.state[key] = value
    
    // Notify subscribers
    const callbacks = this.subscribers.get(key)
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(value, oldValue)
        } catch (error) {
          console.error('Error in state subscriber:', error)
        }
      })
    }
  }

  /**
   * Update state with function
   */
  updateState(key, updater) {
    const currentValue = this.state[key]
    const newValue = updater(currentValue)
    this.setState(key, newValue)
  }

  /**
   * Batch update multiple state values
   */
  setBatchState(updates) {
    const oldValues = {}
    const notifications = []
    
    // Collect old values and prepare notifications
    Object.entries(updates).forEach(([key, value]) => {
      oldValues[key] = this.state[key]
      this.state[key] = value
      
      const callbacks = this.subscribers.get(key)
      if (callbacks) {
        notifications.push({ key, callbacks, value, oldValue: oldValues[key] })
      }
    })
    
    // Notify all subscribers
    notifications.forEach(({ key, callbacks, value, oldValue }) => {
      callbacks.forEach(callback => {
        try {
          callback(value, oldValue)
        } catch (error) {
          console.error('Error in state subscriber:', error)
        }
      })
    })
  }

  /**
   * Clear state
   */
  clearState() {
    const oldState = { ...this.state }
    this.state = {}
    
    // Notify all subscribers
    this.subscribers.forEach((callbacks, key) => {
      callbacks.forEach(callback => {
        try {
          callback(undefined, oldState[key])
        } catch (error) {
          console.error('Error in state subscriber:', error)
        }
      })
    })
  }

  /**
   * Reset specific key
   */
  resetState(key) {
    this.setState(key, undefined)
  }

  /**
   * Check if key exists in state
   */
  hasKey(key) {
    return key in this.state
  }

  /**
   * Get number of subscribers for a key
   */
  getSubscriberCount(key) {
    const callbacks = this.subscribers.get(key)
    return callbacks ? callbacks.size : 0
  }

  /**
   * Get all subscribed keys
   */
  getSubscribedKeys() {
    return Array.from(this.subscribers.keys())
  }
}

// Global state manager instance
export const globalState = new StateManager()
