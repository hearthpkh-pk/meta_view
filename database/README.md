# 🗄️ Database Scripts

## 📋 SQL Scripts ทั้งหมด

### **🚀 Phase 1: Database Migration (เรียงลำดับรัน)**

#### **1️⃣ Dynamic RBAC System**
- **[database_dynamic_rbac.sql](./database_dynamic_rbac.sql)**
  - สร้างตาราง permissions, roles, role_permissions
  - 18 permissions, 8 roles
  - Migration จาก enum → dynamic
  - Helper functions: user_has_permission(), get_user_permissions()

#### **2️⃣ Payroll & Leave System**
- **[database_payroll.sql](./database_payroll.sql)**
  - สร้างตาราง payroll_records, leave_requests, leave_balances
  - BigInt precision for salary
  - 6 leave types
  - Helper functions: calculate_net_salary(), update_leave_balance()

#### **3️⃣ Facebook Accounts System**
- **[database_fb_accounts.sql](./database_fb_accounts.sql)**
  - สร้างตาราง fb_accounts, account_pages, employee_fb_access, fb_sync_logs
  - Encrypted credentials, 2FA support
  - Helper functions: get_user_fb_accounts(), get_user_accessible_pages()

#### **4️⃣ RLS Policies Update**
- **[database_rls_update.sql](./database_rls_update.sql)**
  - อัปเดต RLS policies ทั้งหมดให้ใช้ Dynamic RBAC
  - สร้าง audit_logs table
  - Audit triggers สำหรับ tracking

---

### **📦 Supporting Scripts**

#### **🔧 Basic Setup**
- **[database_setup.sql](./database_setup.sql)**
  - สร้าง page_categories table
  - พื้นฐานของระบบ

#### **🔄 Legacy & Migration**
- **[database_rbac.sql](./database_rbac.sql)**
  - RBAC แบบเก่า (enum-based)
  - ใช้อ้างอิงเท่านั้น ไม่ต้องรัน

- **[database_migration_script.sql](./database_migration_script.sql)**
  - Script รวมสำหรับ migration
  - มีตัวอย่างการทดสอบ

#### **🛠️ Maintenance Scripts**
- **[add_bank_columns.sql](./add_bank_columns.sql)**
  - เพิ่มคอลัมน์ธนาคารใน employees table

- **[add_salary_column.sql](./add_salary_column.sql)**
  - เพิ่มคอลัมน์เงินเดือนใน employees table

- **[drop_old_policies.sql](./drop_old_policies.sql)**
  - ลบ policies เก่าก่อนอัปเกรด

- **[update_tokens_schema.sql](./update_tokens_schema.sql)**
  - อัปเดต schema สำหรับ tokens

---

## 🎯 วิธีการรัน

### **📋 ลำดับการรันที่ถูกต้อง:**

```bash
# 1. Basic Setup (ถ้ายังไม่เคยรัน)
psql -f database_setup.sql

# 2. Dynamic RBAC (จำเป็น)
psql -f database_dynamic_rbac.sql

# 3. Payroll System
psql -f database_payroll.sql

# 4. Facebook Accounts
psql -f database_fb_accounts.sql

# 5. RLS Updates (สุดท้าย)
psql -f database_rls_update.sql
```

### **🧪 การทดสอบ:**

```sql
-- ทดสอบหลังรันทุก scripts
SELECT COUNT(*) as total_permissions FROM public.permissions; -- 18
SELECT COUNT(*) as total_roles FROM public.roles; -- 8
SELECT COUNT(*) as total_employees_with_role FROM public.employees WHERE role_id IS NOT NULL; -- >=1
SELECT * FROM public.get_user_permissions() LIMIT 5;
SELECT public.get_current_user_role();
```

---

## 📊 สรุปผลลัพธ์

### **✅ หลังรันสำเร็จ:**
- **Tables**: 7 ตารางใหม่
- **Functions**: 8 helper functions
- **Views**: 2 summary views
- **Triggers**: 6 audit triggers
- **Policies**: 25+ RLS policies
- **Permissions**: 18 granular permissions
- **Roles**: 8 hierarchical roles

---

## 🚨 คำเตือน

### **⚠️ ข้อควรระวัง:**
1. **รันตามลำดับ** - ต้องรันตามลำดับที่กำหนด
2. **Backup ก่อน** - สำรองข้อมูลก่อนรัน
3. **Test Environment** - ทดสอบใน environment ทดสอบก่อน
4. **Review** - ตรวจสอบ scripts ก่อกรัน

### **🔄 Rollback:**
```sql
-- ถ้าต้องการ rollback
DROP TABLE IF EXISTS public.payroll_records CASCADE;
DROP TABLE IF EXISTS public.leave_requests CASCADE;
DROP TABLE IF EXISTS public.leave_balances CASCADE;
DROP TABLE IF EXISTS public.fb_accounts CASCADE;
DROP TABLE IF EXISTS public.account_pages CASCADE;
DROP TABLE IF EXISTS public.employee_fb_access CASCADE;
DROP TABLE IF EXISTS public.fb_sync_logs CASCADE;
DROP TABLE IF EXISTS public.audit_logs CASCADE;
DROP TABLE IF EXISTS public.role_permissions CASCADE;
DROP TABLE IF EXISTS public.roles CASCADE;
DROP TABLE IF EXISTS public.permissions CASCADE;
```

---

## 📞 ข้อมูลเพิ่มเติม

- **เวอร์ชัน**: 1.0
- **วันที่**: March 12, 2026
- **สถานะ**: ✅ Phase 1 Complete
- **ถัดไป**: Phase 2 - Application Updates

**📋 หมายเหตุ**: ทุก scripts ใช้ `IF NOT EXISTS` และ `DROP IF EXISTS` เพื่อความปลอดภัย
