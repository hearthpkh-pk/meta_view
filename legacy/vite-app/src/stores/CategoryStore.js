import { globalState } from './StateManager.js'
import { CategoryService } from '../services/CategoryService.js'

/**
 * Category Store
 * Manages category-related state and business logic
 */
export class CategoryStore {
  constructor() {
    this.categoryService = new CategoryService()
    this.stateKey = 'categories'
    this.loadingKey = 'categories_loading'
    this.errorKey = 'categories_error'
    
    // Initialize state
    globalState.setState(this.stateKey, {
      categories: [],
      selectedCategory: null,
      isCreating: false,
      isEditing: false
    })
    
    globalState.setState(this.loadingKey, false)
    globalState.setState(this.errorKey, null)
  }

  /**
   * Subscribe to categories state changes
   */
  subscribe(callback) {
    return globalState.subscribe(this.stateKey, callback)
  }

  /**
   * Subscribe to loading state
   */
  subscribeToLoading(callback) {
    return globalState.subscribe(this.loadingKey, callback)
  }

  /**
   * Subscribe to error state
   */
  subscribeToError(callback) {
    return globalState.subscribe(this.errorKey, callback)
  }

  /**
   * Get current state
   */
  getState() {
    return globalState.getState(this.stateKey)
  }

  /**
   * Get loading state
   */
  getLoadingState() {
    return globalState.getState(this.loadingKey)
  }

  /**
   * Get error state
   */
  getErrorState() {
    return globalState.getState(this.errorKey)
  }

  /**
   * Load all categories
   */
  async loadCategories() {
    try {
      globalState.setState(this.loadingKey, true)
      globalState.setState(this.errorKey, null)
      
      const categories = await this.categoryService.getAllCategories()
      
      globalState.updateState(this.stateKey, (currentState) => ({
        ...currentState,
        categories
      }))
      
      return categories
    } catch (error) {
      globalState.setState(this.errorKey, error.message)
      throw error
    } finally {
      globalState.setState(this.loadingKey, false)
    }
  }

  /**
   * Create new category
   */
  async createCategory(categoryData) {
    try {
      globalState.setState(this.loadingKey, true)
      globalState.setState(this.errorKey, null)
      
      const result = await this.categoryService.createCategory(categoryData)
      
      // Reload categories to get updated list
      await this.loadCategories()
      
      return result
    } catch (error) {
      globalState.setState(this.errorKey, error.message)
      throw error
    } finally {
      globalState.setState(this.loadingKey, false)
    }
  }

  /**
   * Update category
   */
  async updateCategory(categoryId, updateData) {
    try {
      globalState.setState(this.loadingKey, true)
      globalState.setState(this.errorKey, null)
      
      await this.categoryService.updateCategory(categoryId, updateData)
      
      // Update local state
      globalState.updateState(this.stateKey, (currentState) => ({
        ...currentState,
        categories: currentState.categories.map(category => 
          category.id === categoryId ? { ...category, ...updateData } : category
        )
      }))
      
      return { success: true }
    } catch (error) {
      globalState.setState(this.errorKey, error.message)
      throw error
    } finally {
      globalState.setState(this.loadingKey, false)
    }
  }

  /**
   * Delete category
   */
  async deleteCategory(categoryId) {
    try {
      globalState.setState(this.loadingKey, true)
      globalState.setState(this.errorKey, null)
      
      const result = await this.categoryService.deleteCategory(categoryId)
      
      // Update local state
      globalState.updateState(this.stateKey, (currentState) => ({
        ...currentState,
        categories: currentState.categories.filter(category => category.id !== categoryId),
        selectedCategory: currentState.selectedCategory?.id === categoryId ? null : currentState.selectedCategory
      }))
      
      return result
    } catch (error) {
      globalState.setState(this.errorKey, error.message)
      throw error
    } finally {
      globalState.setState(this.loadingKey, false)
    }
  }

  /**
   * Get category by ID
   */
  async getCategoryById(categoryId) {
    try {
      const category = await this.categoryService.getCategoryById(categoryId)
      return category
    } catch (error) {
      globalState.setState(this.errorKey, error.message)
      throw error
    }
  }

  /**
   * Select category
   */
  selectCategory(category) {
    globalState.updateState(this.stateKey, (currentState) => ({
      ...currentState,
      selectedCategory: category
    }))
  }

  /**
   * Clear selection
   */
  clearSelection() {
    globalState.updateState(this.stateKey, (currentState) => ({
      ...currentState,
      selectedCategory: null
    }))
  }

  /**
   * Start creating category
   */
  startCreating() {
    globalState.updateState(this.stateKey, (currentState) => ({
      ...currentState,
      isCreating: true,
      isEditing: false,
      selectedCategory: null
    }))
  }

  /**
   * Stop creating category
   */
  stopCreating() {
    globalState.updateState(this.stateKey, (currentState) => ({
      ...currentState,
      isCreating: false
    }))
  }

  /**
   * Start editing category
   */
  startEditing(category) {
    globalState.updateState(this.stateKey, (currentState) => ({
      ...currentState,
      isEditing: true,
      isCreating: false,
      selectedCategory: category
    }))
  }

  /**
   * Stop editing category
   */
  stopEditing() {
    globalState.updateState(this.stateKey, (currentState) => ({
      ...currentState,
      isEditing: false,
      selectedCategory: null
    }))
  }

  /**
   * Get category by name
   */
  getCategoryByName(name) {
    const state = this.getState()
    return state.categories.find(category => category.name === name)
  }

  /**
   * Get first category
   */
  getFirstCategory() {
    const state = this.getState()
    return state.categories.length > 0 ? state.categories[0] : null
  }

  /**
   * Clear error
   */
  clearError() {
    globalState.setState(this.errorKey, null)
  }

  /**
   * Reset store
   */
  reset() {
    globalState.setState(this.stateKey, {
      categories: [],
      selectedCategory: null,
      isCreating: false,
      isEditing: false
    })
    globalState.setState(this.loadingKey, false)
    globalState.setState(this.errorKey, null)
  }
}

// Singleton instance
export const categoryStore = new CategoryStore()
