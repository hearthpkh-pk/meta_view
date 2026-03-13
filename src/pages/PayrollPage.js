import { BaseComponent } from '../components/BaseComponent.js'
import { dbHelpers } from '../utils/database.js'
import { layoutManager } from '../core/LayoutManager.js'

export default class PayrollPage extends BaseComponent {
  constructor() {
    super()
    this.name = 'PayrollPage'
    this.records = []
    this.isLoading = true
  }

  async mount() {
    await this.fetchPayroll()
  }

  async fetchPayroll() {
    this.isLoading = true
    this.renderFull()
    try {
      const { data, error } = await dbHelpers.fetch('payroll_records', {
        orderBy: { column: 'created_at', ascending: false }
      })
      if (error) throw error
      this.records = data || []
    } catch (error) {
      console.error('Failed to fetch payroll:', error)
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
            <h1 class="text-2xl font-bold text-gray-900 border-l-4 border-green-500 pl-3">ระบบคำนวณเงินเดือน (Payroll Management)</h1>
            <p class="mt-1 text-sm text-gray-500">จัดการเงินเดือน, ค่าล่วงเวลา (OT) และรายการหักเงินพนักงาน</p>
          </div>
          <div class="flex gap-3">
             <button class="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition border border-gray-200">
               <i class="fas fa-download mr-2"></i> นำออกรายงาน
             </button>
             <button class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition shadow-sm flex items-center gap-2">
               <i class="fas fa-calculator"></i> คำนวณเงินเดือนรอบล่าสุด
             </button>
          </div>
        </div>

        <!-- Summary Cards -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div class="flex items-center justify-between mb-2">
              <span class="text-sm font-medium text-gray-500">ยอดเงินจ่ายสุทธิเดือนนี้</span>
              <div class="p-2 bg-green-100 rounded-lg text-green-600"><i class="fas fa-wallet"></i></div>
            </div>
            <p class="text-2xl font-bold text-gray-900">฿0.00</p>
            <p class="text-xs text-gray-400 mt-1">อัปเดตล่าสุด: ยังไม่มีข้อมูล</p>
          </div>
          <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div class="flex items-center justify-between mb-2">
              <span class="text-sm font-medium text-gray-500">จำนวนพนักงานที่จ่ายแล้ว</span>
              <div class="p-2 bg-blue-100 rounded-lg text-blue-600"><i class="fas fa-users"></i></div>
            </div>
            <p class="text-2xl font-bold text-gray-900">0 / 0</p>
            <p class="text-xs text-blue-500 mt-1 font-medium">คิดเป็น 0% ของทั้งหมด</p>
          </div>
          <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div class="flex items-center justify-between mb-2">
              <span class="text-sm font-medium text-gray-500">รายการหักทั้งหมด</span>
              <div class="p-2 bg-red-100 rounded-lg text-red-600"><i class="fas fa-minus-circle"></i></div>
            </div>
            <p class="text-2xl font-bold text-gray-900">฿0.00</p>
            <p class="text-xs text-red-400 mt-1 font-medium">-฿0.00 (สปส. & ภาษี)</p>
          </div>
        </div>

        <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div class="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h3 class="text-sm font-bold text-gray-800 uppercase tracking-wider">รายการเงินเดือนประจำงวด ปัจจุบัน</h3>
            <div class="flex gap-2">
               <select class="text-xs border-gray-300 rounded-md py-1">
                 <option>มีนาคม 2569</option>
                 <option>กุมภาพันธ์ 2569</option>
               </select>
            </div>
          </div>
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-white">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">พนักงาน</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ฐานเงินเดือน</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ค่าคอม/เบี้ยเลี้ยง</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">รายการหัก</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">สุทธิ</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">สถานะ</th>
                  <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">จัดการ</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                ${this.isLoading ? `
                  <tr><td colspan="7" class="px-6 py-10 text-center text-gray-400">กำลังโหลด...</td></tr>
                ` : this.records.length === 0 ? `
                   <tr><td colspan="7" class="px-6 py-20 text-center text-gray-400">ไม่มีข้อมูลการจ่ายเงินในงวดนี้</td></tr>
                ` : this.records.map(rec => `
                   <tr class="hover:bg-gray-50 transition-colors">
                     <!-- Data rows here -->
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
