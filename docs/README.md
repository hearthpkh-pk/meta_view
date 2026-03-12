# 📚 Meta Views Documentation

## 📋 แฟ้มเอกสารทั้งหมด

### **🗂️ หมวดหมู่เอกสาร**

#### **🚀 Migration & Planning**
- **[MIGRATION_PLAN.md](./MIGRATION_PLAN.md)** - แผนการ Migration ฐานข้อมูล Phase 1-3 (ละเอียดที่สุด)
- **[README_PHASE_1.md](./README_PHASE_1.md)** - สรุปผลการทำงาน Phase 1
- **[implementation_plan.md](./implementation_plan.md)** - แผนการ implement ระบบ HR & Operations

#### **🏗️ Architecture & Design**
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - สถาปัตยกรรมระบบโดยรวม
- **[DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md)** - ระบบการออกแบบ UI/UX
- **[DESKTOP_WORKFLOW.md](./DESKTOP_WORKFLOW.md)** - การทำงานบน Desktop

#### **🎨 UX & Analysis**
- **[UX_ANALYSIS_PLAN.md](./UX_ANALYSIS_PLAN.md)** - แผนการวิเคราะห์ UX

---

## 🗃️ โครงสร้างโฟลเดอร์

```
meta_views/
├── 📁 docs/                    # เอกสารทั้งหมด
│   ├── README.md              # ไฟล์นี้ (ดัชนีเอกสาร)
│   ├── MIGRATION_PLAN.md      # แผนการ Migration
│   ├── README_PHASE_1.md      # สรุป Phase 1
│   ├── implementation_plan.md # แผนการ implement
│   ├── ARCHITECTURE.md        # สถาปัตยกรรม
│   ├── DESIGN_SYSTEM.md      # ระบบการออกแบบ
│   ├── DESKTOP_WORKFLOW.md    # การทำงาน Desktop
│   └── UX_ANALYSIS_PLAN.md    # แผนวิเคราะห์ UX
├── 📁 database/               # SQL Scripts ทั้งหมด
│   ├── database_dynamic_rbac.sql    # Dynamic RBAC
│   ├── database_payroll.sql         # Payroll System
│   ├── database_fb_accounts.sql     # FB Accounts
│   ├── database_rls_update.sql      # RLS Updates
│   ├── database_setup.sql           # Basic Setup
│   ├── database_rbac.sql            # Old RBAC
│   ├── database_migration_script.sql # Migration Script
│   ├── add_bank_columns.sql         # Bank Columns
│   ├── add_salary_column.sql        # Salary Column
│   ├── drop_old_policies.sql        # Drop Policies
│   └── update_tokens_schema.sql     # Token Schema
├── 📁 scripts/                # สคริปต์ต่างๆ (ว่าง)
├── 📁 archive/                # ไฟล์เก่า/ทิ้ง
│   ├── *.html                 # HTML ไฟล์เก่า
│   ├── *.txt                  # Text ไฟล์เก่า
│   └── *.zip                  # Archive ไฟล์
├── 📁 src/                    # Source Code
├── 📁 supabase/               # Supabase Functions
└── 📁 public/                 # Public Assets
```

---

## 🎯 การใช้งาน

### **📖 อ่านเอกสารตามลำดับ:**
1. **[MIGRATION_PLAN.md](./MIGRATION_PLAN.md)** - ดูแผนการทำงานทั้งหมด
2. **[README_PHASE_1.md](./README_PHASE_1.md)** - ดูสิ่งที่ทำเสร็จแล้ว
3. **[implementation_plan.md](./implementation_plan.md)** - ดูแผนรวม
4. **[ARCHITECTURE.md](./ARCHITECTURE.md)** - ดูสถาปัตยกรรม
5. **[DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md)** - ดูระบบการออกแบบ

### **🗄️ รัน SQL Scripts:**
```bash
# ตามลำดับใน MIGRATION_PLAN.md
1. database/database_dynamic_rbac.sql
2. database/database_payroll.sql
3. database/database_fb_accounts.sql
4. database/database_rls_update.sql
```

---

## 📞 ข้อมูลติดต่อ

- **Project**: Meta Views HR & Operations System
- **Status**: Phase 1 Complete ✅
- **Next Phase**: Phase 2 - Application Updates
- **Last Updated**: March 12, 2026

---

**📋 หมายเหตุ**: ไฟล์เอกสารทั้งหมดถูกจัดระเบียบตามหมวดหมู่เพื่อความสะดวกในการค้นหาและอ้างอิง
