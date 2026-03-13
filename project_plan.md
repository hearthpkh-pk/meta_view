# Project Summary & Roadmap: Meta Views (Simplified HRM)
# สรุปภาพรวมโครงการและแนวทางการพัฒนา: Meta Views (HRM แบบย่อ)

Simplified project scope focusing on FB management and core staff information.
วิเคราะห์สถานะปัจจุบันและปรับลดขอบเขตให้เน้นที่การจัดการ FB และข้อมูลพนักงานพื้นฐาน

---

## 🏗️ Technical Architecture / สถาปัตยกรรมทางเทคนิค

Current state is a **Hybrid Architecture** during migration.
สถานะปัจจุบันเป็น **สถาปัตยกรรมแบบผสม (Hybrid)** ในระหว่างการย้ายระบบ

| Component / ส่วนประกอบ | Technology / เทคโนโลยี | Role / หน้าที่ |
| :--- | :--- | :--- |
| **Frontend (New)** | Next.js 16 (App Router), React 19 | Primary platform for new features / แพลตฟอร์มหลักสำหรับฟีเจอร์ใหม่ |
| **Frontend (Legacy)** | Vite + React (JavaScript) | Legacy features awaiting migration / ฟีเจอร์เดิมที่รอการย้ายระบบ |
| **Backend** | Supabase (PostgreSQL) | Auth, Database, Storage, Edge Functions / ระบบสมาชิก, ฐานข้อมูล, พื้นที่เก็บข้อมูล |
| **Styling** | Tailwind CSS v4 | Global styling system / ระบบจัดการสไตล์ส่วนกลาง |

---

## 🔍 Codebase Analysis / วิเคราะห์ซอร์สโค้ด

### 1. Database Layer (`/database`) / ชั้นข้อมูล
- **Simplified Roles**: 4 Access Levels as per web app:
- **การปรับปรุงสิทธิ์การเข้าถึง**: 4 ระดับตามหน้าเว็บจริง:
    1. **Staff** (พนักงานทั่วไป)
    2. **Manager** (หัวหน้าทีม)
    3. **Admin** (ผู้จัดการ)
    4. **Super Admin** (เจ้าของระบบ)
- **Currency Handling**: Standard `INTEGER` used (No Satang/Decimals required).
- **การจัดการตัวเลขเงิน**: ใช้หน่วย `INTEGER` ปกติ (ไม่ใช้สตางค์/ทศนิยม)
- **FB Account Management**: Robust schema for FB accounts and pages.
- **การจัดการบัญชี FB**: โครงสร้างความสัมพันธ์ระหว่างพนักงาน บัญชี และเพจ Facebook

### 2. Modern App (`/meta_hr`) / แอปพลิเคชันรุ่นใหม่
- **Role-based Groups**: `(admin)`, `(boss)`, `(staff)`, and `(auth)`.
- **Type Safety**: TypeScript definitions for core entities (Employee, Account, Page).

---

## 🗺️ Implementation Roadmap / แผนการดำเนินงาน

### Phase 1: Core Migration (In Progress) / ระยะที่ 1: การย้ายโครงสร้างหลัก (กำลังดำเนินการ)
- [x] Establish Next.js 16 environment / ติดตั้งสภาพแวดล้อม Next.js 16
- [x] Configure Supabase Auth / ตั้งค่า Supabase Auth
- [/] Migrate `AccountsView` (Staff) / ย้ายหน้าจัดการบัญชีสำหรับพนักงาน
- [ ] Implement `EmployeeManagement` (Admin) / พัฒนาระบบจัดการพนักงานสำหรับ Admin

### Phase 2: Core HRM & FB Management / ระยะที่ 2: ข้อมูลพนักงานและการจัดการ FB
- [ ] Implement `PayrollDashboard` (Integers) / แผงควบคุมเงินเดือน (ยอดเงินจำนวนเต็ม)
- [ ] **FB Integration**: Finalize Token Management UI / พัฒนาหน้าจัดการ Token Facebook
- [ ] Performance Dashboards / แผงแสดงผลประสิทธิภาพของเพจ

---

## 🏗️ Database Consolidation Strategy / กลยุทธ์การจัดระเบียบฐานข้อมูล

### 1. Source of Truth / แหล่งข้อมูลหลัก
- **Rule**: Your local `.sql` files are the ONLY source of truth.
- **กฎ**: ไฟล์ `.sql` ในเครื่องของคุณคือแหล่งอ้างอิงเพียงหนึ่งเดียวเท่านั้น

### 2. Migration Sequencing / การจัดลำดับ Migration
| Sequence / ลำดับ | File Name / ชื่อไฟล์ | Content / เนื้อหา |
| :--- | :--- | :--- |
| **001** | `001_initial_setup.sql` | Base tables (Employees, Teams) |
| **002** | `002_dynamic_rbac.sql` | Permissions & 4-Level Roles |
| **003** | `003_fb_accounts.sql` | FB Management & Junctions |
| **004** | `004_security_rls.sql` | Global RLS & Access Policies |

---

## ⚠️ Known Debt & Risks / หนี้ทางเทคนิคและความเสี่ยง
- **Dual Styling**: Consistency between legacy and new app / ความสอดคล้องของดีไซน์
- **Legacy Cleanup**: Surplus files awaiting deletion / การกำจัดการทำงานที่ไม่จำเป็น (เช่น ระบบลงเวลา, สตางค์)

> [!NOTE]
> We have removed "Time Attendance" and "Satang precision" to keep the system lightweight and aligned with the current web implementation.
> ตัดระบบลงเวลาและหน่วยสตางค์ออกเพื่อให้ระบบกระชับและตรงตามการใช้งานจริงครับ
