# 🚀 แผนปฏิบัติการเชิงลึก: Next.js Monolithic HR & Operations (อัปเดตใหม่)

เอกสารนี้คือพิมพ์เขียว (Blueprint) ระดับปฏิบัติการสำหรับการควบรวมระบบ `meta_views` (หน้าแบบ Admin) และ `fb-manager` (หน้าแบบ Staff) เข้าด้วยกัน พร้อมการจัดเตรียมหน้าสำหรับ Boss (Payroll/การเงิน) โดยใช้โครงสร้างที่ยืดหยุ่นสูง (Dynamic Roles)

---

## 🏗️ Phase 1: Database Schema & Dynamic RBAC (ฐานข้อมูลและสิทธิ์แบบยืดหยุ่น)
ถอดระบบ Role แบบตายตัว (Enum) ออก และเปลี่ยนเป็นระบบสิทธิ์ที่ **สามารถเพิ่ม/แก้ไข Role และ Permission จากหน้า UI ได้อิสระ 100%**

### 1.1 Tables Design (โครงสร้างตารางหลัก)
**A. ระบบจัดการสิทธิ์ (Dynamic Permissions)**
1. **`public.permissions`**: [id](file:///c:/dev/meta_views/src/utils/metaApi.js#50-67) (Text เช่น 'manage_payroll', 'manage_all_fb', 'view_team_fb'), `description` (Text)
2. **`public.roles`**: [id](file:///c:/dev/meta_views/src/utils/metaApi.js#50-67) (UUID), `name` (Text เช่น 'CEO', 'Senior Admin', 'Content Staff'), `description` (Text)
3. **`public.role_permissions`**: `role_id` (UUID), `permission_id` (Text)

**B. ระบบพนักงานและเงินเดือน (พนักงาน & Payroll)**
4. **`public.employees`**: [id](file:///c:/dev/meta_views/src/utils/metaApi.js#50-67) (UUID, FK -> auth.users.id), `email` (Text), `role_id` (UUID, FK -> roles.id), `base_salary` (BigInt - เก็บเป็นตัวเลขจำนวนเต็ม ห้ามใช้ Float)
5. **`public.leave_requests`**: [id](file:///c:/dev/meta_views/src/utils/metaApi.js#50-67) (UUID), `employee_id` (UUID), `type` (Text เช่น 'ลาป่วย', 'ลากิจ'), `start_date` (Date), `end_date` (Date), `status` (Text) *(ตัดระบบ Time Attendance ออก เน้นเฉพาะการลา)*
6. **`public.payroll_records`**: [id](file:///c:/dev/meta_views/src/utils/metaApi.js#50-67) (UUID), `employee_id` (UUID), `month` (Int), `year` (Int), `base_salary` (BigInt), `commissions` (BigInt), `deductions` (BigInt - เช่น ขาดงาน/ภาษี), `net_salary` (BigInt), `status` (Text)

**C. ระบบ Facebook Management (แอคเคาท์ & เพจ)**
7. **`public.fb_accounts`** (รวมมาจาก fb-manager): [id](file:///c:/dev/meta_views/src/utils/metaApi.js#50-67) (UUID), `uid` (Text), `mail`, `password`, `passmail` (ทั้งหมด Encrypted), `two_pin` (Text), `status` (Text), `note` (Text), `url` (Text)
8. **`public.pages`**: `page_id` (Text), `name` (Text), `type` (Text), `status` (Text)
9. **`public.account_pages`**: `account_id` (UUID), `page_id` (Text) (บัญชีไหนดูแลเพจไหน)
10. **`public.employee_fb_access`**: `employee_id` (UUID), `account_id` (UUID) (Assign พนักงานให้ดูแลบัญชีไหน)

### 1.2 RLS Policies (ระบบตรวจจับสิทธิ์แบบ Dynamic)
แทนที่จะดักจับด้วยชื่อ Role (`boss`, `admin`) เราจะเขียน RLS ให้เช็คจาก `role_permissions`:
- เช่น นโยบายของตาราง `payroll_records`: ให้อ่านและเขียนได้เฉพาะ User ที่มี Permission `manage_payroll` อยู่ใน Role ของตัวเอง
- นโยบายตาราง `fb_accounts`: 
  - หากมี Permission `manage_all_fb` (Admin) -> เห็นทั้งหมด
  - หากไม่มี ให้เช็ค `employee_fb_access` ว่าตัวเองได้รับมอบหมายให้ดูแลบัญชีนี้หรือไม่ (Staff)

---

## 📂 Phase 2: Next.js Architecture & Routing (โครงสร้างหน้าจอ)
โปรเจกต์จะถูกจัดกลุ่ม (Route Groups) ตาม Role อย่างชัดเจน:

### 2.1 โครงสร้าง Directory `src/app/`
```text
src/app/
├── (auth)/                  # โซนหน้าล็อกอิน
├── (boss)/                  # 🏢 มุมมอง BOSS (ระบบบริษัท)
│   ├── dashboard/           # ภาพรวมบริษัท/การเงิน
│   ├── payroll/             # ระบบรันเงินเดือน (เพิ่มค่าคอม/หักเงิน)
│   └── settings/roles/      # ⚙️ หน้าจัดการ Role/Permission แบบเป๊ะๆ
├── (admin)/                 # ⚙️ มุมมอง ADMIN (ย้าย meta_views มาไว้ที่นี่)
│   ├── fb-accounts/         # ดูบัญชี FB ทุกคนในบริษัทได้
│   ├── fb-pages/            # ดูเพจทั้งหมด
│   └── tokens/              # Meta Views Token Manager เดิม
├── (staff)/                 # 👥 มุมมอง STAFF (ลอก fb-manager มาไว้ที่นี่)
│   ├── my-accounts/         # เห็นแค่บัญชี/เพจที่ตัวเองโดน Assign มา
│   └── leaves/              # หน้าสำหรับกรอกฟอร์มขอลางาน
└── api/                     # ฝั่ง Backend (การเข้ารหัส, ส่ง API)
```

---

## 🧩 Phase 3: Component & Logic Migration (การพอร์ตโค้ด)
1. **พอร์ต `fb-manager`:** ให้รับบทบาทเป็นโซน `/(staff)` และบางส่วนไปอยู่ `/(admin)` โดยยังคงระบบ UI/UX สวยงามไว้ แต่เปลี่ยน Zustand Store ให้ดึงข้อมูลที่ตัวเองมีสิทธิ์ (Row Level Security จะกรองข้อมูลให้เอง)
2. **พอร์ต `meta_views`:** ให้รับบทบาทเป็นโซน `/(admin)` เน้นการจัดการ API Token ของ Meta และดึง Insights ของเพจรวม
3. **สร้างระบบ Company & Payroll:** พัฒนาโซน `/(boss)` ใหม่ทั้งหมด เน้นการคำนวณฐานเงินเดือน (BigInt) ลดทอนความยุ่งยากของ Time Attendance ออกเหลือแค่ หักลบกลบหนี้ด้วยใบลางาน

---

## 🔑 Phase 4: Security & Master Key (การเข้ารหัสชั้นสูง 100%)
- **Edge Functions (Backend):** การกด Import ไฟล์ F1/F2/F3 จากหน้า Frontend จะถูกส่งไปเข้ารหัสที่ Server เสมอ
- **AES-256-GCM:** สตริงทุกอย่างที่เกี่ยวกับ Password/Email Pass จะถูกขยำผสมกับ `process.env.MASTER_KEY` ไม่มีใครอ่านรหัสได้จากฐานข้อมูล ต่อให้เป็น Supabase Admin ก็ตาม
- **Audit Logs:** การกดรูปดวงตา 👁️ เพื่อดูรหัสผ่านเฟซบุ๊ก จะมีการแอบบันทึกลงตาราง `audit_logs` ว่าใคร เป็นคนดู และดูตอนกี่โมง ป้องกันปัญหาคนในทีมขโมยแอคเคาท์

---

## 🚦 คำถามเชิงกลยุทธ์ก่อนเริ่ม Phase 1 (Database)

กรุณาคอนเฟิร์มขั้นตอนถัดไปในแชทครับ!
