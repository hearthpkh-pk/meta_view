# 🚀 Meta Views - HR & Operations System

ระบบจัดการพนักงาน เงินเดือน การลางาน และบัญชี Facebook แบบครบวงจร

## 🎯 สถานะปัจจุบัน

✅ **Phase 1 Complete** - Database Migration สำเร็จ  
🔄 **Phase 2 In Progress** - Application Code Updates  
🏗️ **Phase 3 Planned** - Next.js Architecture

## � โครงสร้างโปรเจค

```
meta_views/
├── � docs/                    # 📚 เอกสารทั้งหมด
│   ├── README.md              # ดัชนีเอกสาร
│   ├── MIGRATION_PLAN.md      # แผนการ Migration (ละเอียด)
│   ├── README_PHASE_1.md      # สรุป Phase 1
│   ├── implementation_plan.md # แผนการ implement
│   ├── ARCHITECTURE.md        # สถาปัตยกรรม
│   ├── DESIGN_SYSTEM.md      # ระบบการออกแบบ
│   ├── DESKTOP_WORKFLOW.md    # การทำงาน Desktop
│   └── UX_ANALYSIS_PLAN.md    # แผนวิเคราะห์ UX
├── 📁 database/               # 🗄️ SQL Scripts ทั้งหมด
│   ├── README.md              # คำอธิบาย SQL scripts
│   ├── database_dynamic_rbac.sql    # Dynamic RBAC
│   ├── database_payroll.sql         # Payroll System
│   ├── database_fb_accounts.sql     # FB Accounts
│   ├── database_rls_update.sql      # RLS Updates
│   └── ...                     # Scripts อื่นๆ
├── 📁 src/                    # ⚛️ Source Code
│   ├── components/            # React Components
│   ├── pages/                 # HTML Pages
│   ├── services/              # API Services
│   ├── stores/                # State Management
│   └── utils/                 # Utilities
├── 📁 supabase/               # 🔥 Supabase Functions
│   └── functions/             # Edge Functions
├── 📁 archive/                # 🗃️ ไฟล์เก่า/ทิ้ง
├── 📁 scripts/                # 🛠️ สคริปต์ต่างๆ
└── 📁 public/                 # 📦 Static Assets
```

## 🚀 Features

### **👥 HR Management**
- 🔐 Dynamic Role-Based Access Control (RBAC)
- 👤 จัดการข้อมูลพนักงาน
- 🏢 จัดการบทบาทและสิทธิ์
- 📊 ระบบ audit logging

### **💰 Payroll System**
- 💵 จัดการเงินเดือน (BigInt precision)
- ⏰ ค่า OT และโบนัส
- 🧾 หักภาษีและประกันสังคม
- 📈 รายงานเงินเดือน

### **📅 Leave Management**
- 🏥 6 ประเภทการลา (ป่วย, กิจ, พักร้อน, คลอด, อื่นๆ)
- ✅ ระบบอนุมัติการลา
- 📊 ติดตามวันลาคงเหลือ
- 📅 ปฏิทินการลา

### **📘 Facebook Management**
- 📱 จัดการบัญชี Facebook (encrypted credentials)
- 📄 จัดการ Facebook Pages
- 👥 มอบหมายพนักงานดูแลบัญชี
- 📊 ติดตามสถิติและ sync status

## 🎯 การเริ่มต้น

### **📋 ขั้นตอนแรก:**

1. **📖 อ่านเอกสาร**:
   ```bash
   # อ่านแผนการทำงาน
   cat docs/MIGRATION_PLAN.md
   
   # อ่านสิ่งที่ทำเสร็จแล้ว
   cat docs/README_PHASE_1.md
   ```

2. **🗄️ Setup Database**:
   ```bash
   # รัน SQL scripts ตามลำดับ
   psql -f database/database_dynamic_rbac.sql
   psql -f database/database_payroll.sql
   psql -f database/database_fb_accounts.sql
   psql -f database/database_rls_update.sql
   ```

3. **⚛️ Start Development**:
   ```bash
   npm install
   npm run dev
   ```

### **🧪 การทดสอบ Database:**

```sql
-- ทดสอบว่า migration สำเร็จ
SELECT COUNT(*) as total_permissions FROM public.permissions; -- 18
SELECT COUNT(*) as total_roles FROM public.roles; -- 8
SELECT COUNT(*) as total_employees_with_role FROM public.employees WHERE role_id IS NOT NULL; -- >=1
SELECT * FROM public.get_user_permissions() LIMIT 5;
SELECT public.get_current_user_role();
```

## 📚 เอกสาร

### **📖 อ่านตามลำดับ:**
1. **[docs/MIGRATION_PLAN.md](./docs/MIGRATION_PLAN.md)** - แผนการ Migration ทั้งหมด
2. **[docs/README_PHASE_1.md](./docs/README_PHASE_1.md)** - สรุปการทำงาน Phase 1
3. **[docs/implementation_plan.md](./docs/implementation_plan.md)** - แผนการ implement
4. **[database/README.md](./database/README.md)** - คำอธิบาย SQL scripts

### **🔗 ลิงก์สำคัญ:**
- **[Database Scripts](./database/README.md)** - SQL ทั้งหมด
- **[Documentation](./docs/README.md)** - เอกสารทั้งหมด
- **[Archive](./archive/README.md)** - ไฟล์เก่า

## 🛠️ Development

### **Scripts:**
```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
```

### **Environment Variables:**
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_META_API_VERSION=v25.0
VITE_APP_NAME=Meta Views HR & Ops
VITE_APP_VERSION=2.0.0
```

## 🔐 Security

- 🔒 Supabase Row Level Security (RLS)
- 🔐 Dynamic Permission System
- 🛡️ Encrypted credentials for FB accounts
- 📊 Comprehensive audit logging
- 🚫 Input validation ทุกจุด

## 🚀 Next Steps

### **🔄 Phase 2: Application Updates**
- [ ] Update Edge Functions สำหรับ Dynamic RBAC
- [ ] Update Frontend Components
- [ ] Add new pages (Payroll, Leave, FB Management)
- [ ] Implement permission-based UI

### **🏗️ Phase 3: Next.js Architecture**
- [ ] Migrate to Next.js App Router
- [ ] Implement TypeScript
- [ ] Add security enhancements
- [ ] Performance optimization

## 📞 ข้อมูลติดต่อ

- **Project**: Meta Views HR & Operations System
- **Status**: Phase 1 Complete ✅
- **Version**: 2.0.0
- **Last Updated**: March 12, 2026

---

**📋 หมายเหตุ**: โปรเจคนี้ evolved จาก Facebook Analytics Dashboard มาเป็น HR & Operations System ครบวงจร
