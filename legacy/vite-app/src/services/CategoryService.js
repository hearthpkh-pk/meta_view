import { dbHelpers } from '../utils/database.js'

/**
 * Category Service
 * Handles all business logic for page categories
 */
export class CategoryService {
  constructor() {
    this.cache = new Map()
    this.cacheTimeout = 10 * 60 * 1000 // 10 minutes
  }

  /**
   * Get all categories
   */
  async getAllCategories() {
    const cacheKey = 'all_categories'
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey)
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data
      }
    }

    try {
      const { data, error } = await dbHelpers.fetch('page_categories', {
        orderBy: { column: 'sort_order', ascending: true }
      })

      if (error && error.message !== 'No rows found') {
        throw new Error(error.message)
      }

      const categories = data || []
      
      // Create default categories if none exist
      if (categories.length === 0) {
        await this.createDefaultCategories()
        return this.getAllCategories() // Recursive call to get default categories
      }

      // Cache the result
      this.cache.set(cacheKey, {
        data: categories,
        timestamp: Date.now()
      })

      return categories
    } catch (error) {
      console.error('Error fetching categories:', error)
      throw error
    }
  }

  /**
   * Create default categories
   */
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
  }

  /**
   * Create new category
   */
  async createCategory(categoryData) {
    try {
      const validation = this.validateCategoryData(categoryData)
      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '))
      }

      // Get next sort order
      const categories = await this.getAllCategories()
      const maxSort = Math.max(...categories.map(c => c.sort_order || 0), 0)
      
      const newCategory = {
        ...categoryData,
        sort_order: categoryData.sort_order || maxSort + 1,
        color: categoryData.color || this.getRandomColor()
      }

      const { error } = await dbHelpers.insert('page_categories', newCategory)

      if (error) {
        throw new Error(error.message)
      }

      // Clear cache
      this.clearCache()
      
      return { success: true, category: newCategory }
    } catch (error) {
      console.error('Error creating category:', error)
      throw error
    }
  }

  /**
   * Update category
   */
  async updateCategory(categoryId, updateData) {
    try {
      const validation = this.validateCategoryData(updateData)
      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '))
      }

      const { error } = await dbHelpers.update('page_categories', 
        updateData, 
        { id: categoryId }
      )

      if (error) {
        throw new Error(error.message)
      }

      // Clear cache
      this.clearCache()
      
      return { success: true }
    } catch (error) {
      console.error('Error updating category:', error)
      throw error
    }
  }

  /**
   * Delete category
   */
  async deleteCategory(categoryId) {
    try {
      // Get first category to move pages to
      const categories = await this.getAllCategories()
      const firstCategory = categories.find(c => c.id !== categoryId)
      
      if (firstCategory) {
        // Move pages to first category
        const { error: moveError } = await dbHelpers.update('pages', 
          { category_id: firstCategory.id }, 
          { category_id: categoryId }
        )
        
        if (moveError) {
          throw new Error(moveError.message)
        }
      }

      // Delete category
      const { error } = await dbHelpers.delete('page_categories', { id: categoryId })

      if (error) {
        throw new Error(error.message)
      }

      // Clear cache
      this.clearCache()
      
      return { success: true, movedToCategory: firstCategory?.id }
    } catch (error) {
      console.error('Error deleting category:', error)
      throw error
    }
  }

  /**
   * Get category by ID
   */
  async getCategoryById(categoryId) {
    try {
      const { data, error } = await dbHelpers.fetch('page_categories', {
        filters: { id: categoryId }
      })

      if (error) {
        throw new Error(error.message)
      }

      return data?.[0] || null
    } catch (error) {
      console.error('Error fetching category:', error)
      throw error
    }
  }

  /**
   * Reorder categories
   */
  async reorderCategories(categoryOrders) {
    try {
      const updates = categoryOrders.map(({ id, sort_order }) => 
        dbHelpers.update('page_categories', { sort_order }, { id })
      )

      await Promise.all(updates)
      
      // Clear cache
      this.clearCache()
      
      return { success: true }
    } catch (error) {
      console.error('Error reordering categories:', error)
      throw error
    }
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear()
  }

  /**
   * Get random color for category
   */
  getRandomColor() {
    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316']
    return colors[Math.floor(Math.random() * colors.length)]
  }

  /**
   * Validate category data
   */
  validateCategoryData(categoryData) {
    const errors = []
    
    if (!categoryData.name || categoryData.name.trim() === '') {
      errors.push('Category name is required')
    }
    
    if (categoryData.name && categoryData.name.length > 50) {
      errors.push('Category name must be less than 50 characters')
    }
    
    if (categoryData.sort_order && (categoryData.sort_order < 0 || categoryData.sort_order > 1000)) {
      errors.push('Sort order must be between 0 and 1000')
    }
    
    return {
      isValid: errors.length === 0,
      errors
    }
  }
}
