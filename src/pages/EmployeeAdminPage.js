import { BaseComponent } from '../components/BaseComponent.js'
import { authStore } from '../stores/AuthStore.js'
import { getAdminDb, dbHelpers } from '../utils/database.js'
import { layoutManager } from '../core/LayoutManager.js'
import { Notification } from '../components/Notification.js'

export default class EmployeeAdminPage extends BaseComponent {
  constructor() {
    super()
    this.name = 'EmployeeAdminPage'
    this.employees = []
    this.isLoading = true
  }

  async mount() {
    await this.fetchEmployees()
  }

  async fetchEmployees() {
    this.isLoading = true
    this.renderFull() // Update UI to loading state

    try {
      // In a real scenario, use Admin API or standard DB fetch depending on exact needs. 
      // Because we fetch from public.employees, dbHelpers.fetch is fine (assuming RLS allows super_admin to read all).
      const { data, error } = await dbHelpers.fetch('employees', {
        orderBy: { column: 'created_at', ascending: false }
      })

      if (error) throw error

      this.employees = data || []
    } catch (error) {
      console.error('Failed to fetch employees:', error)
      layoutManager.showError('ไม่สามารถดึงข้อมูลพนักงาน: ' + error.message)
    } finally {
      this.isLoading = false
      this.renderFull() // Update UI with data
    }
  }

  renderFull() {
    const mainContent = document.getElementById('main-content')
    if (mainContent) {
      mainContent.innerHTML = this.render()
      // Setup events on next tick
      setTimeout(() => this.setupEvents(), 0)
    }
  }

  render() {
    return `
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
        <div class="flex justify-between items-center mb-6">
          <div>
            <h1 class="text-2xl font-bold text-gray-900 border-l-4 border-yellow-400 pl-3">จัดการพนักงาน (Employee Management)</h1>
            <p class="mt-1 text-sm text-gray-500">จัดการสิทธิ์ ผู้ใช้งาน และเพิ่มผู้ดูแลระบบ</p>
          </div>
          <button id="btn-show-add-modal" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition shadow-sm flex items-center gap-2">
            <i class="fas fa-user-plus"></i> เพิ่มพนักงานใหม่
          </button>
        </div>

        <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          ${this.isLoading ? `
            <div class="overflow-x-auto">
              <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                  <tr>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">รหัสพนักงาน</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ชื่อ-สกุล</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ตำแหน่ง / สิทธิ์</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">เงินเดือน (บาท)</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">วันที่เพิ่ม</th>
                    <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">จัดการ</th>
                  </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                  ${Array.from({ length: 3 }).map(() => `
                    <tr class="skeleton-row">
                      <td class="px-6 py-4"><div class="skeleton skeleton-text" style="width:80px"></div></td>
                      <td class="px-6 py-4">
                        <div class="flex items-center">
                          <div class="skeleton skeleton-circle h-8 w-8 flex-shrink-0"></div>
                          <div class="ml-3"><div class="skeleton skeleton-text" style="width:120px"></div></div>
                        </div>
                      </td>
                      <td class="px-6 py-4"><div class="skeleton skeleton-badge"></div></td>
                      <td class="px-6 py-4"><div class="skeleton skeleton-text" style="width:100px"></div></td>
                      <td class="px-6 py-4"><div class="skeleton skeleton-text" style="width:70px"></div></td>
                      <td class="px-6 py-4 text-right"><div class="skeleton skeleton-text" style="width:60px;margin-left:auto"></div></td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          ` : `
            <div class="overflow-x-auto">
              <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                  <tr>
                    <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">รหัสพนักงาน</th>
                    <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ชื่อ-สกุล</th>
                    <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ตำแหน่ง / สิทธิ์</th>
                    <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">เงินเดือน (บาท)</th>
                    <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">วันที่เพิ่ม</th>
                    <th scope="col" class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">จัดการ</th>
                  </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                  ${this.employees.length === 0 ? `
                    <tr>
                      <td colspan="6" class="px-6 py-4 text-center text-sm text-gray-500">
                        ไม่พบข้อมูลพนักงาน
                      </td>
                    </tr>
                  ` : this.employees.map(emp => `
                    <tr class="hover:bg-gray-50 transition-colors">
                      <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        ${emp.employee_code || '-'}
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div class="flex items-center">
                          <div class="flex-shrink-0 h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                            ${(emp.first_name || 'U').charAt(0)}
                          </div>
                          <div class="ml-3">
                            <p class="text-sm font-medium text-gray-900">${emp.first_name || ''} ${emp.last_name || ''}</p>
                          </div>
                        </div>
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap">
                        <span class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                          ${emp.role === 'super_admin' ? 'bg-purple-100 text-purple-800' :
        emp.role === 'admin' ? 'bg-red-100 text-red-800' :
          emp.role === 'manager' ? 'bg-yellow-100 text-yellow-800' :
            'bg-green-100 text-green-800'}">
                          ${emp.role}
                        </span>
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                        ฿${Number(emp.base_salary || 0).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ${new Date(emp.created_at).toLocaleDateString('th-TH')}
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button class="text-indigo-600 hover:text-indigo-900 mr-3 edit-btn" data-id="${emp.id}">แก้ไข</button>
                        ${emp.role !== 'super_admin' ? `<button class="text-red-600 hover:text-red-900 delete-btn" data-id="${emp.id}" data-name="${emp.first_name} ${emp.last_name}">ลบ</button>` : ''}
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          `}
        </div>

        <!-- Add Employee Modal (Hidden initially) -->
        <div id="add-employee-modal" class="fixed inset-0 z-50 hidden" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <!-- Background backdrop -->
          <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>

          <div class="fixed inset-0 z-10 overflow-y-auto">
            <div class="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
              <div class="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
                <div class="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                  <div class="flex flex-col items-center justify-center text-center">
                    <div class="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 mb-4">
                      <i class="fas fa-user-plus text-blue-600"></i>
                    </div>
                    <div class="w-full">
                      <h3 class="text-lg font-semibold leading-6 text-gray-900" id="modal-title">เพิ่มพนักงานใหม่</h3>
                      <div class="mt-4 w-full text-left">
                        <form id="add-employee-form" class="space-y-4 w-full">
                          <!-- Form Grid -->
                          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div class="col-span-1 sm:col-span-2">
                              <label for="new-email" class="block text-sm font-medium leading-6 text-gray-900">อีเมล (ใช้เข้าสู่ระบบ)</label>
                              <div class="mt-2">
                                <input type="email" name="email" id="new-email" required class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 px-3">
                              </div>
                            </div>
                            
                            <div class="col-span-1 sm:col-span-2">
                              <label for="new-password" class="block text-sm font-medium leading-6 text-gray-900">รหัสผ่านชั่วคราว</label>
                              <div class="mt-2">
                                <input type="text" name="password" id="new-password" required minlength="6" class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 px-3">
                              </div>
                            </div>

                            <div>
                              <label for="new-fname" class="block text-sm font-medium leading-6 text-gray-900">ชื่อ</label>
                              <div class="mt-2">
                                <input type="text" name="fname" id="new-fname" required class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 px-3">
                              </div>
                            </div>

                            <div>
                              <label for="new-lname" class="block text-sm font-medium leading-6 text-gray-900">นามสกุล</label>
                              <div class="mt-2">
                                <input type="text" name="lname" id="new-lname" required class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 px-3">
                              </div>
                            </div>
                            
                            <div>
                              <label for="new-emp-code" class="block text-sm font-medium leading-6 text-gray-900">รหัสพนักงาน</label>
                              <div class="mt-2">
                                <input type="text" name="emp-code" id="new-emp-code" class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 px-3">
                              </div>
                            </div>
                            
                            <div>
                              <label for="new-salary" class="block text-sm font-medium leading-6 text-gray-900">ฐานเงินเดือน (บาท)</label>
                              <div class="mt-2">
                                <input type="number" step="0.01" min="0" name="salary" id="new-salary" class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 px-3">
                              </div>
                            </div>

                            <div class="col-span-1 sm:col-span-2">
                              <label for="new-role" class="block text-sm font-medium leading-6 text-gray-900">สิทธิ์การใช้งาน (Role)</label>
                              <div class="mt-2">
                                <select id="new-role" name="role" class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 pl-3">
                                  <option value="staff">Staff (พนักงานทั่วไป)</option>
                                  <option value="manager">Manager (หัวหน้าทีม)</option>
                                  <option value="admin">Admin (ผู้จัดการ)</option>
                                  <option value="super_admin">Super Admin (เจ้าของระบบ)</option>
                                </select>
                              </div>
                            </div>
                          </div>
                          
                          <!-- Error message area -->
                          <div id="modal-error-msg" class="text-sm text-red-600 hidden mt-2 py-2 px-3 bg-red-50 rounded-md"></div>
                        </form>
                      </div>
                    </div>
                  </div>
                </div>
                <div class="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                  <button type="button" id="btn-submit-employee" class="inline-flex w-full justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 sm:ml-3 sm:w-auto transition">สร้างพนักงาน</button>
                  <button type="button" id="btn-cancel-modal" class="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto transition">ยกเลิก</button>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    `
  }

  setupEvents() {
    const showModalBtn = document.getElementById('btn-show-add-modal')
    const cancelModalBtn = document.getElementById('btn-cancel-modal')
    const submitBtn = document.getElementById('btn-submit-employee')
    const modal = document.getElementById('add-employee-modal')
    const form = document.getElementById('add-employee-form')
    const errorMsg = document.getElementById('modal-error-msg')

    if (showModalBtn) {
      showModalBtn.addEventListener('click', () => {
        form.reset()
        errorMsg.classList.add('hidden')
        modal.classList.remove('hidden')
      })
    }

    if (cancelModalBtn) {
      cancelModalBtn.addEventListener('click', () => {
        modal.classList.add('hidden')
      })
    }

    if (submitBtn && form) {
      submitBtn.addEventListener('click', async () => {
        // Basic validation
        if (!form.checkValidity()) {
          form.reportValidity()
          return
        }

        const email = document.getElementById('new-email').value
        const password = document.getElementById('new-password').value
        const fName = document.getElementById('new-fname').value
        const lName = document.getElementById('new-lname').value
        const empCode = document.getElementById('new-emp-code').value || null
        const role = document.getElementById('new-role').value
        const salary = document.getElementById('new-salary').value || 0

        submitBtn.disabled = true
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>กำลังบันทึก...'
        errorMsg.classList.add('hidden')

        try {
          const adminDb = getAdminDb()

          // 1. Create User in auth.users using Admin API (Bypasses email confirmation)
          const { data: userData, error: createError } = await adminDb.auth.admin.createUser({
            email: email,
            password: password,
            email_confirm: true // important to allow login immediately
          })

          if (createError) throw new Error(createError.message)

          // 2. Insert Profile Data into public.employees
          // (Since we used service_role_key, RLS is bypassed and we can insert this directly)
          const newUserId = userData.user.id

          const { error: profileError } = await adminDb.from('employees').insert({
            id: newUserId,
            employee_code: empCode,
            first_name: fName,
            last_name: lName,
            role: role,
            base_salary: parseFloat(salary)
          })

          if (profileError) {
            // Rollback if profile creation fails? For brevity, we just log it, 
            // but in production we'd want to delete the auth.user if profile insert fails.
            throw new Error("Failed to create employee profile data: " + profileError.message)
          }

          Notification.show('เพิ่มพนักงานสำเร็จแล้ว', 'success')
          modal.classList.add('hidden')

          // Refresh list
          this.fetchEmployees()

        } catch (error) {
          console.error("Employee Creation Error:", error)
          errorMsg.textContent = error.message
          errorMsg.classList.remove('hidden')
        } finally {
          submitBtn.disabled = false
          submitBtn.innerHTML = 'สร้างพนักงาน'
        }
      })
    }

    // Setup Delete Action
    const tableBody = document.querySelector('tbody')
    if (tableBody) {
      tableBody.addEventListener('click', async (e) => {
        if (e.target.classList.contains('delete-btn')) {
          const id = e.target.dataset.id
          const name = e.target.dataset.name

          if (confirm(`คุณต้องการลบพนักงาน "${name}" ออกจากระบบถาวรใช่หรือไม่?\n(การกระทำนี้ไม่สามารถย้อนกลับได้)`)) {
            try {
              e.target.disabled = true
              e.target.innerHTML = '<i class="fas fa-spinner fa-spin"></i>'

              const adminDb = getAdminDb()

              // 1. Delete from public.employees first (due to foreign key constraint from employees -> auth.users)
              const { error: dbError } = await adminDb.from('employees').delete().eq('id', id)
              if (dbError) throw new Error('ไม่สามารถลบข้อมูลโปรไฟล์ได้: ' + dbError.message)

              // 2. Delete from auth.users via Admin API
              const { error: authError } = await adminDb.auth.admin.deleteUser(id)
              if (authError) throw new Error('ไม่สามารถลบบัญชีผู้ใช้ได้: ' + authError.message)

              Notification.show('ลบพนักงานสำเร็จแล้ว', 'success')
              this.fetchEmployees()
            } catch (error) {
              console.error('Delete error:', error)
              layoutManager.showError('เกิดข้อผิดพลาดในการลบ: ' + error.message)
              e.target.disabled = false
              e.target.innerHTML = 'ลบ'
            }
          }
        }
      })
    }
  }
}
