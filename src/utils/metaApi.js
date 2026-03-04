import { config } from '../utils/config.js'

// Meta API helper functions
export const metaApi = {
  // Fetch pages from Meta API
  async fetchPages(accessToken) {
    try {
      const response = await fetch(
        `https://graph.facebook.com/${config.metaApi.version}/me/accounts?limit=100&access_token=${accessToken}`
      )
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      
      // Handle Meta API specific errors
      if (data.error) {
        const errorCode = data.error.code
        const errorMessage = data.error.message || 'Unknown API error'
        
        // Specific error handling for graceful degradation
        if (errorCode === 190) {
          throw new Error('Access Token หมดอายุ กรุณาล็อกอินใหม่')
        } else if (errorCode === 4 || errorCode === 17) {
          throw new Error('ติดข้อจำกัด Rate Limit ของ Facebook กรุณารอสักครู่')
        } else if (errorCode === 190) {
          throw new Error('Access Token ไม่ถูกต้อง กรุณาตรวจสอบสิทธิ์')
        } else if (errorCode === 200) {
          throw new Error('ไม่มีสิทธิ์เข้าถึงข้อมูล Pages กรุณาตรวจสอบ Permissions')
        } else {
          throw new Error(`Meta API Error (${errorCode}): ${errorMessage}`)
        }
      }
      
      return data.data || []
    } catch (error) {
      console.error('❌ Meta API Error:', error)
      
      // Handle network errors or other exceptions
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('ไม่สามารถเชื่อมต่อกับ Meta API กรุณาตรวจสอบอินเทอร์เน็ต')
      }
      
      throw error
    }
  },
  
  // Validate token
  async validateToken(accessToken) {
    try {
      const response = await fetch(
        `https://graph.facebook.com/${config.metaApi.version}/me?access_token=${accessToken}`
      )
      
      if (!response.ok) {
        return false
      }
      
      const data = await response.json()
      return !data.error
    } catch (error) {
      return false
    }
  },
  
  // Get page insights
  async getPageInsights(pageId, accessToken, metrics = ['page_views_total', 'page_impressions_unique']) {
    try {
      const response = await fetch(
        `https://graph.facebook.com/${config.metaApi.version}/${pageId}/insights?metric=${metrics.join(',')}&access_token=${accessToken}`
      )
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      
      // Handle Meta API specific errors
      if (data.error) {
        const errorCode = data.error.code
        const errorMessage = data.error.message || 'Unknown API error'
        
        // Specific error handling for graceful degradation
        if (errorCode === 190) {
          throw new Error('Access Token หมดอายุ กรุณาล็อกอินใหม่')
        } else if (errorCode === 4 || errorCode === 17) {
          throw new Error('ติดข้อจำกัด Rate Limit ของ Facebook กรุณารอสักครู่')
        } else if (errorCode === 200) {
          throw new Error('ไม่มีสิทธิ์เข้าถึงข้อมูล Insights กรุณาตรวจสอบ Permissions')
        } else {
          throw new Error(`Meta API Insights Error (${errorCode}): ${errorMessage}`)
        }
      }
      
      return data.data || []
    } catch (error) {
      console.error('❌ Meta API Insights Error:', error)
      
      // Handle network errors or other exceptions
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('ไม่สามารถเชื่อมต่อกับ Meta API กรุณาตรวจสอบอินเทอร์เน็ต')
      }
      
      throw error
    }
  }
}
