import { BaseComponent } from '../components/BaseComponent.js'
import { authStore } from '../stores/AuthStore.js'
import { db, dbHelpers } from '../utils/database.js'
import { layoutManager } from '../core/LayoutManager.js'
import { Notification } from '../components/Notification.js'

const ROLES = [
  { value: 'staff', label: 'Staff (พนักงานทั่วไป)', color: 'bg-green-100 text-green-800' },
  { value: 'manager', label: 'Manager (หัวหน้าทีม)', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'admin', label: 'Admin (ผู้จัดการ)', color: 'bg-red-100 text-red-800' },
  { value: 'super_admin', label: 'Super Admin (เจ้าของระบบ)', color: 'bg-purple-100 text-purple-800' }
]

const getRoleColor = (roleValue) => {
  const role = ROLES.find(r => r.value === roleValue)
  return role ? role.color : 'bg-gray-100 text-gray-800'
}

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
                        <span class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleColor(emp.role)}">
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
                        <button class="text-indigo-600 hover:text-indigo-900 mr-3 edit-btn" data-id="${emp.id}" 
                          data-code="${emp.employee_code || ''}" 
                          data-fname="${emp.first_name || ''}" 
                          data-lname="${emp.last_name || ''}" 
                          data-role="${emp.role}" 
                          data-salary="${emp.base_salary || 0}"
                          data-bankname="${emp.bank_name || ''}"
                          data-bankacc="${emp.bank_account_number || ''}">แก้ไข</button>
                        ${emp.role !== 'super_admin' ? `<button class="text-red-600 hover:text-red-900 delete-btn" data-id="${emp.id}" data-name="${emp.first_name} ${emp.last_name}">ลบ</button>` : ''}
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          `}
        </div>

        <!-- Add/Edit Employee Modal (Hidden initially) -->
        <div id="add-employee-modal" class="fixed inset-0 z-50 hidden" aria-labelledby="modal-title" role="dialog" aria-modal="true">
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
                          <input type="hidden" id="edit-employee-id" value="">
                          
                          <!-- Form Grid -->
                          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div class="col-span-1 sm:col-span-2" id="email-field-container">
                              <label for="new-email" class="block text-sm font-medium leading-6 text-gray-900">อีเมล (ใช้เข้าสู่ระบบ)</label>
                              <div class="mt-2">
                                <input type="email" name="email" id="new-email" required class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 px-3">
                              </div>
                            </div>
                            
                            <div class="col-span-1 sm:col-span-2" id="password-field-container">
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
                            
                            <!-- Financial / Banking -->
                            <div>
                              <label for="new-bank-name" class="block text-sm font-medium leading-6 text-gray-900">ชื่อธนาคาร (Bank Name)</label>
                              <div class="mt-2">
                                <input type="text" name="bank-name" id="new-bank-name" placeholder="เช่น KBank, SCB, Citi" class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 px-3">
                              </div>
                            </div>

                            <div>
                              <label for="new-bank-acc" class="block text-sm font-medium leading-6 text-gray-900">เลขบัญชี (Account Number)</label>
                              <div class="mt-2">
                                <input type="text" name="bank-acc" id="new-bank-acc" class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 px-3">
                              </div>
                            </div>

                            <div class="col-span-1 sm:col-span-2">
                              <label for="new-role" class="block text-sm font-medium leading-6 text-gray-900">สิทธิ์การใช้งาน (Role)</label>
                              <div class="mt-2">
                                <select id="new-role" name="role" class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 pl-3">
                                  ${ROLES.map(r => `<option value="${r.value}">${r.label}</option>`).join('')}
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
                  <button type="button" id="btn-submit-employee" class="inline-flex w-full justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 sm:ml-3 sm:w-auto transition">บันทึก</button>
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
    const modalTitle = document.getElementById('modal-title')

    if (showModalBtn) {
      showModalBtn.addEventListener('click', () => {
        form.reset()
        document.getElementById('edit-employee-id').value = ''
        modalTitle.textContent = 'เพิ่มพนักงานใหม่'
        submitBtn.innerHTML = 'สร้างพนักงาน'

        document.getElementById('email-field-container').classList.remove('hidden')
        document.getElementById('password-field-container').classList.remove('hidden')
        document.getElementById('new-email').required = true
        document.getElementById('new-password').required = true

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
        if (!form.checkValidity()) {
          form.reportValidity()
          return
        }

        const editId = document.getElementById('edit-employee-id').value
        const isEditMode = !!editId

        const email = document.getElementById('new-email').value
        const password = document.getElementById('new-password').value
        const fName = document.getElementById('new-fname').value
        const lName = document.getElementById('new-lname').value
        const empCode = document.getElementById('new-emp-code').value || null
        const role = document.getElementById('new-role').value
        const salary = document.getElementById('new-salary').value || 0
        const bankName = document.getElementById('new-bank-name').value || null
        const bankAcc = document.getElementById('new-bank-acc').value || null

        submitBtn.disabled = true
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>กำลังบันทึก...'
        errorMsg.classList.add('hidden')

        try {
          if (isEditMode) {
            // Edit Profile (Directly via Public API - Super Admins bypass RLS by nature)
            const { error: updateError } = await db.from('employees').update({
              employee_code: empCode,
              first_name: fName,
              last_name: lName,
              role: role,
              base_salary: salary, // Stored smoothly as a string formatted into DECIMAL
              bank_name: bankName,
              bank_account_number: bankAcc
            }).eq('id', editId)

            if (updateError) throw new Error("ไม่สามารถอัปเดตข้อมูลพนักงาน: " + updateError.message)
            Notification.show('อัปเดตข้อมูลพนักงานสำเร็จ', 'success')

          } else {
            // Create via secure Edge Function to bypass Auth required emails and utilize Service Role securely
            // This function creates the Supabase user, then creates the profile natively with rollback protection.
            const { data, error } = await db.functions.invoke('manage-employee', {
              body: {
                action: 'create',
                payload: {
                  email,
                  password,
                  firstName: fName,
                  lastName: lName,
                  employeeCode: empCode,
                  role,
                  baseSalary: salary,
                  bankName: bankName,
                  bankAccountNumber: bankAcc
                }
              }
            })

            if (error) throw new Error("การเชื่อมต่อฐานข้อมูลล้มเหลว: " + error.message)
            if (data && !data.success) throw new Error(data.error || "เกิดข้อผิดพลาดในการสร้างบัญชี")

            Notification.show('เพิ่มพนักงานสำเร็จแล้ว', 'success')
          }

          modal.classList.add('hidden')
          this.fetchEmployees()

        } catch (error) {
          console.error("Employee Saving Error:", error)
          errorMsg.textContent = error.message
          errorMsg.classList.remove('hidden')
        } finally {
          submitBtn.disabled = false
          submitBtn.innerHTML = isEditMode ? 'บันทึกการแก้ไข' : 'สร้างพนักงาน'
        }
      })
    }

    // Setup Edit and Delete Actions inside table
    const tableBody = document.querySelector('tbody')
    if (tableBody) {
      tableBody.addEventListener('click', async (e) => {
        // Edit Action
        if (e.target.classList.contains('edit-btn')) {
          const id = e.target.dataset.id

          form.reset()
          document.getElementById('edit-employee-id').value = id
          modalTitle.textContent = 'แก้ไขพนักงาน'
          submitBtn.innerHTML = 'บันทึกการแก้ไข'

          // Hide email & password fields since Auth updates require a different secure flow/token
          document.getElementById('email-field-container').classList.add('hidden')
          document.getElementById('password-field-container').classList.add('hidden')
          document.getElementById('new-email').required = false
          document.getElementById('new-password').required = false

          // Populate fields
          document.getElementById('new-fname').value = e.target.dataset.fname || ''
          document.getElementById('new-lname').value = e.target.dataset.lname || ''
          document.getElementById('new-emp-code').value = e.target.dataset.code || ''
          document.getElementById('new-role').value = e.target.dataset.role || 'staff'
          document.getElementById('new-salary').value = e.target.dataset.salary || '0'
          document.getElementById('new-bank-name').value = e.target.dataset.bankname || ''
          document.getElementById('new-bank-acc').value = e.target.dataset.bankacc || ''

          errorMsg.classList.add('hidden')
          modal.classList.remove('hidden')
        }

        // Delete Action
        if (e.target.classList.contains('delete-btn')) {
          const id = e.target.dataset.id
          const name = e.target.dataset.name

          if (confirm(`คุณต้องการลบพนักงาน "${name}" ออกจากระบบถาวรใช่หรือไม่?\n(การกระทำนี้ไม่สามารถย้อนกลับได้)`)) {
            try {
              e.target.disabled = true
              e.target.innerHTML = '<i class="fas fa-spinner fa-spin"></i>'

              // Delete via secure Edge Function (deletes profile, then deletes auth user)
              const { data, error } = await db.functions.invoke('manage-employee', {
                body: { action: 'delete', payload: { id } }
              })

              if (error) throw new Error("การเชื่อมต่อฐานข้อมูลล้มเหลว: " + error.message)
              if (data && !data.success) throw new Error(data.error || "ไม่สามารถลบลำกัดสิทธิ์ได้")

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
