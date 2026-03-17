import { BaseComponent } from '../components/BaseComponent.js'
import { dbHelpers } from '../utils/database.js'
import { layoutManager } from '../core/LayoutManager.js'

export default class FBAccountsPage extends BaseComponent {
  constructor() {
    super()
    this.name = 'FBAccountsPage'
    this.accounts = []
    this.isLoading = true
  }

  async mount() {
    await this.fetchAccounts()
  }

  async fetchAccounts() {
    this.isLoading = true
    this.renderFull()
    try {
      const { data, error } = await dbHelpers.fetch('fb_accounts', {
        orderBy: { column: 'created_at', ascending: false }
      })
      if (error) throw error
      this.accounts = data || []
    } catch (error) {
      console.error('Failed to fetch FB accounts:', error)
    } finally {
      this.isLoading = false
      this.renderFull()
    }
  }

  renderFull() {
    const mainContent = document.getElementById('main-content')
    if (mainContent) {
      mainContent.innerHTML = this.render()
    }
  }

  render() {
    return `
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
        <div class="flex justify-between items-center mb-6">
          <div>
            <h1 class="text-2xl font-bold text-gray-900 border-l-4 border-blue-600 pl-3">การจัดการบัญชี Facebook (FB Accounts)</h1>
            <p class="mt-1 text-sm text-gray-500">จัดการข้อมูลบัญชีผู้ใช้, รหัสผ่าน และสถานะการใช้งาน</p>
          </div>
          <button class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition shadow-sm flex items-center gap-2">
            <i class="fas fa-plus"></i> เพิ่มบัญชีใหม่
          </button>
        </div>

        <!-- Filters & Search -->
        <div class="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-6 flex flex-wrap gap-4 items-center">
          <div class="relative flex-1 min-w-[300px]">
            <span class="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
              <i class="fas fa-search"></i>
            </span>
            <input type="text" placeholder="ค้นหา UID, ชื่อบัญชี หรือหมายเหตุ..." class="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm">
          </div>
          <select class="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500">
            <option value="">ทุกสถานะ</option>
            <option value="active">ปกติ (Active)</option>
            <option value="suspended">ระงับการใช้งาน</option>
            <option value="banned">โดนแบน</option>
          </select>
        </div>

        <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">บัญชี (UID)</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ประเภท</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">สถานะ</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ผู้ดูแล / ผู้รับผิดชอบ</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">อัปเดตล่าสุด</th>
                  <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">จัดการ</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                ${this.isLoading ? `
                  <tr><td colspan="6" class="px-6 py-10 text-center text-gray-400 font-medium">กำลังโหลดข้อมูล...</td></tr>
                ` : this.accounts.length === 0 ? `
                  <tr>
                    <td colspan="6" class="px-6 py-12 text-center">
                      <div class="flex flex-col items-center">
                        <i class="fab fa-facebook text-gray-200 text-5xl mb-4"></i>
                        <p class="text-gray-500 text-sm">ยังไม่มีข้อมูลบัญชีในระบบ</p>
                        <button class="mt-4 text-blue-600 hover:text-blue-700 text-sm font-medium">เพิ่มบัญชีแรกของคุณ</button>
                      </div>
                    </td>
                  </tr>
                ` : this.accounts.map(acc => `
                  <tr class="hover:bg-gray-50 transition-colors">
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div class="flex items-center">
                        <div class="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mr-3">
                          <i class="fab fa-facebook-f text-xs"></i>
                        </div>
                        <div>
                          <p class="text-sm font-semibold text-gray-900">${acc.name}</p>
                          <p class="text-xs text-gray-500 font-mono">${acc.uid}</p>
                        </div>
                      </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600 capitalize">
                      ${acc.account_type || 'Personal'}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <span class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${acc.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                        ${acc.status === 'active' ? 'ปกติ' : 'โดนแบน'}
                      </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      ${acc.assigned_to_name || 'ไม่ได้ระบุ'}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      ${new Date(acc.updated_at).toLocaleDateString('th-TH')}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button class="text-blue-600 hover:text-blue-900 mr-3">รายละเอียด</button>
                        <button class="text-gray-400 hover:text-red-600"><i class="fas fa-trash"></i></button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `
  }
}
