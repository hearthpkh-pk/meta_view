# 🚀 Database Migration Plan: Phase 1 Complete

## 📋 Executive Summary

**Status**: ✅ Phase 1 Complete (Database Migration)  
**Next Phase**: 🔄 Phase 2 - Application Code Updates  
**Completion Date**: March 12, 2026  

---

## ✅ Phase 1: Database Migration (COMPLETED)

### 🎯 Objectives Achieved
- [x] Transform from Enum-based RBAC to Dynamic Permission System
- [x] Implement Payroll & Leave Management System
- [x] Integrate Facebook Account Management
- [x] Update all RLS Policies to use Dynamic RBAC
- [x] Add comprehensive Audit Logging

---

### 🔥 Phase 1.1: Dynamic RBAC System

#### ✅ Tables Created
| Table | Purpose | Key Features |
|-------|---------|--------------|
| `permissions` | Store all system permissions | 18 permissions across 5 categories |
| `roles` | Dynamic role definitions | 8 hierarchical roles |
| `role_permissions` | Many-to-many relationship | Junction table with RLS |

#### ✅ Permissions Implemented (18 total)
**System (3)**
- `manage_users` - จัดการผู้ใช้ระบบ
- `manage_roles` - จัดการสิทธิ์และบทบาท  
- `view_audit_logs` - ดูประวัติการใช้งาน

**Employees (3)**
- `view_all_employees` - ดูข้อมูลพนักงานทั้งหมด
- `manage_employees` - จัดการข้อมูลพนักงาน
- `view_own_profile` - ดูข้อมูลส่วนตัว

**Payroll (3)**
- `manage_payroll` - จัดการระบบเงินเดือน
- `view_payroll_reports` - ดูรายงานเงินเดือน
- `approve_payroll` - อนุมัติเงินเดือน

**Facebook (5)**
- `manage_all_fb` - จัดการบัญชี Facebook ทั้งหมด
- `view_team_fb` - ดูบัญชี Facebook ของทีม
- `manage_own_fb` - จัดการบัญชี Facebook ของตัวเอง
- `view_fb_insights` - ดูสถิติ Facebook
- `manage_fb_tokens` - จัดการ Meta API Tokens

**Leave (3)**
- `request_leave` - ขอลางาน
- `approve_leave` - อนุมัติการลางาน
- `view_team_leaves` - ดูการลางานของทีม

#### ✅ Roles Implemented (8 total)
| Role | Level | Description | Key Permissions |
|------|-------|-------------|-----------------|
| Super Admin | 0 | เจ้าของระบบ | All permissions |
| CEO | 10 | ประธานบริษัท | All except system management |
| Admin | 20 | ผู้จัดการระบบ | Employee, FB, Payroll management |
| HR Manager | 30 | ผู้จัดการฝ่ายบุคคล | Employee & Leave management |
| Finance Manager | 40 | ผู้จัดการการเงิน | Payroll focused |
| Manager | 50 | หัวหน้าทีม | Team management |
| Senior Staff | 60 | พนักงานอาวุโส | Extended staff permissions |
| Staff | 70 | พนักงานทั่วไป | Basic permissions |

#### ✅ Migration Completed
- [x] Added `role_id` column to `employees` table
- [x] Migrated existing enum roles to dynamic roles
- [x] Updated all employee records with new `role_id`
- [x] Maintained backward compatibility with old `role` column

#### ✅ Helper Functions Created
```sql
-- Core permission checking
user_has_permission(permission_id TEXT) RETURNS BOOLEAN
get_user_permissions() RETURNS TABLE(...)
get_current_user_role() RETURNS TEXT

-- Role hierarchy
get_role_hierarchy() RETURNS TABLE(...)
user_can_manage_user(target_user_id UUID) RETURNS BOOLEAN
```

---

### 💰 Phase 1.2: Payroll & Leave System

#### ✅ Tables Created
| Table | Purpose | Key Features |
|-------|---------|--------------|
| `payroll_records` | Monthly salary records | BigInt precision, generated columns |
| `leave_requests` | Leave applications | 6 leave types, approval workflow |
| `leave_balances` | Leave balance tracking | Year-based, auto-calculated |

#### ✅ Payroll Records Features
**Salary Components (BigInt for precision)**
- `base_salary` - เงินเดือนพื้นฐาน (สกุล: สตางค์)
- `overtime_pay` - ค่า OT รวม
- `sales_commission` - ค่าคอมมิชัน
- `performance_bonus` - โบนัสผลงาน
- `other_allowances` - เบี้ยอื่นๆ

**Deductions**
- `late_deduction` - หักเงินขาด/สาย
- `absence_deduction` - หักเงินขาดงาน
- `tax_deduction` - หักภาษี
- `social_security` - ประกันสังคม
- `other_deductions` - หักอื่นๆ

**Generated Columns**
- `gross_income` - รายได้รวม (STORED)
- `total_deductions` - หักรวม (STORED)
- `net_salary` - เงินเดือนสุทธิ (STORED)

#### ✅ Leave Management Features
**Leave Types**
- `sick_leave` - ลาป่วย
- `personal_leave` - ลากิจ
- `vacation` - ลาพักร้อน
- `maternity_leave` - ลาคลอด
- `paternity_leave` - ลาคลอดบิดา
- `other` - อื่นๆ

**Workflow**
- Request → Approval/Rejection → Balance Update
- Attachment support (medical certificates)
- Year-based balance tracking (default 30 days)

#### ✅ Helper Functions Created
```sql
calculate_net_salary(...) RETURNS BIGINT
update_leave_balance(...) RETURNS VOID
```

---

### 📘 Phase 1.3: Facebook Accounts System

#### ✅ Tables Created
| Table | Purpose | Key Features |
|-------|---------|--------------|
| `fb_accounts` | FB account credentials | Encrypted credentials, 2FA support |
| `account_pages` | Page management | Stats tracking, sync status |
| `employee_fb_access` | Access control | Role-based permissions |
| `fb_sync_logs` | Sync tracking | Performance monitoring |

#### ✅ FB Accounts Features
**Account Information**
- `uid` - Facebook User ID (unique)
- `email`, `display_name`, `profile_url`
- Encrypted `username`, `password`, `password_hint`
- Email access with encrypted `email_password`

**Security Features**
- `two_factor_enabled` - 2FA status
- `two_factor_secret` - Encrypted 2FA secret
- `two_factor_backup_codes` - Encrypted backup codes
- `two_pin` - PIN for 2FA

**Account Management**
- `status` - active/inactive/suspended/banned/deleted
- `account_type` - personal/business/creator
- `verification_status` - none/verified/blue_verified
- Assignment tracking (`assigned_to`, `assigned_by`)

#### ✅ Page Management Features
**Page Information**
- `page_id`, `page_name`, `page_category`, `page_username`
- `likes_count`, `followers_count`, `is_verified`
- `has_admin_access`, `access_level`

**Sync Features**
- `last_sync_at`, `sync_status`
- Performance tracking with `sync_duration_seconds`

#### ✅ Employee Access Control
**Access Levels**
- `owner` - เจ้าของบัญชี
- `admin` - ผู้ดูแลระบบ
- `editor` - ผู้แก้ไข
- `viewer` - ผู้ดู

**Permissions**
- `can_post`, `can_comment`, `can_analyze`
- Active/Revoked status tracking
- Assignment audit trail

#### ✅ Helper Functions Created
```sql
get_user_fb_accounts() RETURNS TABLE(...)
get_user_accessible_pages() RETURNS TABLE(...)
```

#### ✅ Views Created
```sql
fb_accounts_with_pages -- Account summary with page count
employee_fb_summary -- Employee access summary
```

---

### 🔒 Phase 1.4: Updated RLS Policies & Audit

#### ✅ RLS Policies Updated
**Employees Table**
- Dynamic permission checking instead of enum roles
- Fine-grained access control per permission
- Self-profile access for all users

**Existing Tables Updated**
- `page_categories` - `manage_employees` permission
- `pages` - FB permissions (`manage_all_fb`, `view_team_fb`, `manage_own_fb`)
- `tokens` - FB token permissions (`manage_fb_tokens`, `manage_own_fb`)
- `daily_stats` - Insight permissions (`view_fb_insights`, `manage_all_fb`)

#### ✅ Audit Logging System
**Audit Logs Table**
- Tracks all INSERT/UPDATE/DELETE operations
- Records `old_values` and `new_values` (JSONB)
- Captures `user_id`, `user_role`, `ip_address`, `user_agent`
- Automatic triggers on critical tables

**Triggers Applied**
- `employees` table - All changes tracked
- `fb_accounts` table - All changes tracked  
- `payroll_records` table - All changes tracked

#### ✅ Security Enhancements
- Row Level Security on ALL new tables
- Column-level encryption for sensitive data
- Permission-based access control
- Comprehensive audit trail

---

## 🎯 Database Migration Results

### ✅ Verification Tests Passed
```sql
-- All tests successful
SELECT COUNT(*) as total_permissions FROM public.permissions; -- 18 ✅
SELECT COUNT(*) as total_roles FROM public.roles; -- 8 ✅
SELECT COUNT(*) as total_employees_with_role FROM public.employees WHERE role_id IS NOT NULL; -- 1 ✅
SELECT * FROM public.get_user_permissions() LIMIT 5; -- Working ✅
SELECT public.get_current_user_role(); -- "Super Admin" ✅
```

### 📊 Migration Statistics
- **Tables Created**: 7 new tables
- **Functions Created**: 8 helper functions
- **Views Created**: 2 summary views
- **Triggers Created**: 6 audit triggers
- **RLS Policies**: 25+ policies updated/created
- **Permissions**: 18 granular permissions
- **Roles**: 8 hierarchical roles
- **Migration Time**: ~2 hours
- **Zero Downtime**: ✅ All operations used `IF NOT EXISTS`

---

## 🔄 Phase 2: Application Code Updates (NEXT)

### 🎯 Phase 2 Objectives
- [ ] Update Edge Functions to use Dynamic RBAC
- [ ] Update Frontend Components for new permission system
- [ ] Add new pages for Payroll, Leave, FB Management
- [ ] Update Services and Stores
- [ ] Implement permission-based UI controls

---

### 🔧 Phase 2.1: Update Edge Functions (HIGH PRIORITY)

#### 🔄 manage-employee Function
**File**: `supabase/functions/manage-employee/index.ts`

**Current Issues**:
```typescript
// OLD: Hardcoded role check
if (callerData?.role !== 'super_admin') {
    throw new Error('Forbidden: Only super_admin can perform this action')
}
```

**Required Changes**:
```typescript
// NEW: Dynamic permission check
const { data: permissions } = await supabaseAdmin
    .from('role_permissions')
    .select('permission_id')
    .eq('role_id', callerData.role_id);

const hasManagePermission = permissions?.some(p => p.permission_id === 'manage_employees');
if (!hasManagePermission) {
    throw new Error('Forbidden: Requires manage_employees permission');
}
```

**Updates Needed**:
- [ ] Replace enum role check with permission check
- [ ] Update role assignment to use `role_id` instead of enum
- [ ] Add permission validation for each action
- [ ] Update error messages to be permission-specific

#### 🔄 exchange-fb-token Function
**File**: `supabase/functions/exchange-fb-token/index.ts`

**Required Changes**:
- [ ] Add `manage_fb_tokens` permission check
- [ ] Update user validation to use dynamic roles
- [ ] Add audit logging for token operations

---

### ⚛️ Phase 2.2: Update Frontend Components (HIGH PRIORITY)

#### 🔄 EmployeeAdminPage.js
**File**: `src/pages/EmployeeAdminPage.js`

**Current Issues**:
```javascript
// OLD: Hardcoded roles array
const ROLES = [
  { value: 'staff', label: 'Staff (พนักงานทั่วไป)', color: 'bg-green-100 text-green-800' },
  { value: 'manager', label: 'Manager (หัวหน้าทีม)', color: 'bg-yellow-100 text-yellow-800' },
  // ...
]
```

**Required Changes**:
```javascript
// NEW: Load roles from database
const [roles, setRoles] = useState([])
const [permissions, setPermissions] = useState([])

useEffect(() => {
  loadRoles()
  loadUserPermissions()
}, [])

const loadRoles = async () => {
  const { data } = await dbHelpers.fetch('roles', { orderBy: { column: 'name', ascending: true } })
  setRoles(data || [])
}

const hasPermission = (permission) => {
  return permissions.some(p => p.id === permission)
}
```

**Updates Needed**:
- [ ] Remove hardcoded ROLES array
- [ ] Load roles dynamically from database
- [ ] Load current user permissions
- [ ] Add permission-based UI controls
- [ ] Update form to use `role_id` instead of enum
- [ ] Add role colors from database or CSS

#### 🔄 AuthStore.js
**File**: `src/stores/AuthStore.js`

**Required Changes**:
```javascript
// NEW: Add permission management
class AuthStore {
  constructor() {
    this.user = null
    this.permissions = []
    this.userRole = null
  }

  async loadUserPermissions() {
    if (!this.user) return
    
    const { data } = await db.rpc('get_user_permissions')
    this.permissions = data || []
    
    const roleData = await db.rpc('get_current_user_role')
    this.userRole = roleData
  }

  hasPermission(permission) {
    return this.permissions.some(p => p.id === permission)
  }

  canManageEmployees() {
    return this.hasPermission('manage_employees')
  }

  canManagePayroll() {
    return this.hasPermission('manage_payroll')
  }
}
```

**Updates Needed**:
- [ ] Add permission loading and caching
- [ ] Add permission checking methods
- [ ] Update login flow to load permissions
- [ ] Add role-based UI state management

---

### 🎨 Phase 2.3: Add New Pages (MEDIUM PRIORITY)

#### ➕ RoleManagementPage.js
**Purpose**: จัดการสิทธิ์และบทบาท (Super Admin only)

**Features**:
- [ ] View/Edit roles and permissions
- [ ] Create custom roles
- [ ] Assign permissions to roles
- [ ] Role hierarchy management
- [ ] Permission audit trail

**Permission Required**: `manage_roles`

#### ➕ PayrollPage.js
**Purpose**: จัดการระบบเงินเดือน

**Features**:
- [ ] Monthly payroll processing
- [ ] Salary component management
- [ ] Deduction calculations
- [ ] Payroll reports and analytics
- [ ] Approval workflow

**Permission Required**: `manage_payroll`

#### ➕ LeaveManagementPage.js
**Purpose**: จัดการการลางาน

**Features**:
- [ ] Leave request submission
- [ ] Approval/rejection workflow
- [ ] Leave balance tracking
- [ ] Calendar view
- [ ] Leave history and reports

**Permission Required**: `approve_leave` (for managers), `request_leave` (for employees)

#### ➕ FBAccountsPage.js
**Purpose**: จัดการบัญชี Facebook

**Features**:
- [ ] FB account management
- [ ] Page assignment and tracking
- [ ] Employee access control
- [ ] Sync status monitoring
- [ ] Account credentials (encrypted)

**Permission Required**: `manage_all_fb` (full access), `view_team_fb` (team view)

#### ➕ AuditLogsPage.js
**Purpose**: ดูประวัติการใช้งาน

**Features**:
- [ ] Audit log viewing and filtering
- [ ] Change tracking per table
- [ ] User activity monitoring
- [ ] Export functionality
- [ ] Advanced search and filtering

**Permission Required**: `view_audit_logs`

---

### 🛠️ Phase 2.4: Update Services (MEDIUM PRIORITY)

#### 🔄 EmployeeService.js
**Required Changes**:
- [ ] Update role handling to use `role_id`
- [ ] Add permission-based filtering
- [ ] Integrate with new RLS policies

#### ➕ PayrollService.js
**New Service**:
```javascript
export class PayrollService {
  static async getPayrollRecords(month, year) {
    return await dbHelpers.fetch('payroll_records', {
      filters: { month, year },
      orderBy: { column: 'created_at', ascending: false }
    })
  }

  static async calculatePayroll(employeeId, month, year) {
    // Complex payroll calculation logic
  }

  static async approvePayroll(payrollId) {
    return await db.rpc('approve_payroll_record', { payroll_id: payrollId })
  }
}
```

#### ➕ LeaveService.js
**New Service**:
```javascript
export class LeaveService {
  static async requestLeave(leaveData) {
    return await dbHelpers.insert('leave_requests', leaveData)
  }

  static async approveLeave(requestId, notes) {
    return await db.rpc('approve_leave_request', { 
      request_id: requestId, 
      notes: notes 
    })
  }

  static async getLeaveBalance(employeeId, year) {
    return await dbHelpers.fetch('leave_balances', {
      filters: { employee_id: employeeId, year }
    })
  }
}
```

#### ➕ FBAccountService.js
**New Service**:
```javascript
export class FBAccountService {
  static async getUserAccounts() {
    return await db.rpc('get_user_fb_accounts')
  }

  static async assignAccount(employeeId, accountId, accessLevel) {
    return await dbHelpers.insert('employee_fb_access', {
      employee_id: employeeId,
      fb_account_id: accountId,
      access_level: accessLevel
    })
  }

  static async syncAccount(accountId) {
    return await db.rpc('sync_fb_account', { account_id: accountId })
  }
}
```

#### ➕ PermissionService.js
**New Service**:
```javascript
export class PermissionService {
  static async getUserPermissions() {
    return await db.rpc('get_user_permissions')
  }

  static async hasPermission(permission) {
    const permissions = await this.getUserPermissions()
    return permissions.some(p => p.id === permission)
  }

  static async getAllRoles() {
    return await dbHelpers.fetch('roles')
  }

  static async getAllPermissions() {
    return await dbHelpers.fetch('permissions')
  }
}
```

---

## 🏗️ Phase 3: Next.js Architecture (FUTURE)

### 📁 Phase 3.1: Project Restructuring

**Current Structure**:
```
src/
├── components/
├── pages/
├── services/
├── stores/
└── utils/
```

**Target Structure (Next.js App Router)**:
```
src/
├── app/                    # Next.js App Router
│   ├── (dashboard)/        # Route Group: Dashboard
│   │   ├── employees/      # Employee Management
│   │   │   ├── page.tsx
│   │   │   ├── create/
│   │   │   └── [id]/
│   │   ├── payroll/        # Payroll System
│   │   │   ├── page.tsx
│   │   │   ├── records/
│   │   │   └── reports/
│   │   ├── leave/          # Leave Management
│   │   │   ├── page.tsx
│   │   │   ├── request/
│   │   │   └── balance/
│   │   ├── facebook/       # FB Accounts
│   │   │   ├── page.tsx
│   │   │   ├── accounts/
│   │   │   └── pages/
│   │   └── settings/       # System Settings
│   │       ├── roles/
│   │       ├── permissions/
│   │       └── audit/
│   ├── (auth)/             # Route Group: Authentication
│   │   ├── login/
│   │   └── register/
│   ├── layout.tsx          # Root Layout
│   ├── globals.css
│   └── loading.tsx
├── components/             # Reusable Components
│   ├── ui/                 # UI Components
│   ├── forms/              # Form Components
│   └── charts/             # Chart Components
├── lib/                    # Utilities & Helpers
│   ├── db.ts              # Database client
│   ├── auth.ts            # Authentication
│   └── permissions.ts     # Permission helpers
├── hooks/                  # Custom Hooks
│   ├── useAuth.ts
│   ├── usePermissions.ts
│   └── useRoles.ts
├── types/                  # TypeScript Definitions
│   ├── auth.ts
│   ├── permissions.ts
│   └── database.ts
└── middleware.ts           # Route protection
```

### 🔐 Phase 3.2: Security Enhancements

**Encryption**:
- [ ] AES-256-GCM for sensitive data
- [ ] Key management system
- [ ] Encrypted backups

**Rate Limiting**:
- [ ] API endpoint rate limiting
- [ ] Login attempt limiting
- [ ] DDoS protection

**Enhanced Audit**:
- [ ] IP address tracking
- [ ] Device fingerprinting
- [ ] Session monitoring

**2FA Support**:
- [ ] TOTP-based 2FA
- [ ] SMS 2FA
- [ ] Backup codes

---

## 📊 Implementation Timeline

### 🗓️ Phase 2: Application Updates (2-3 weeks)

**Week 1: Core Updates**
- [ ] Update `manage-employee` Edge Function
- [ ] Update `EmployeeAdminPage.js`
- [ ] Update `AuthStore.js`
- [ ] Test basic functionality

**Week 2: New Pages**
- [ ] Create `RoleManagementPage.js`
- [ ] Create `PayrollPage.js`
- [ ] Create `LeaveManagementPage.js`
- [ ] Test new features

**Week 3: FB & Final**
- [ ] Create `FBAccountsPage.js`
- [ ] Create `AuditLogsPage.js`
- [ ] Update all services
- [ ] Final testing and deployment

### 🗓️ Phase 3: Next.js Migration (4-6 weeks)

**Week 4-5: Setup & Structure**
- [ ] Initialize Next.js project
- [ ] Setup folder structure
- [ ] Configure TypeScript
- [ ] Setup authentication

**Week 6-8: Migration**
- [ ] Migrate components
- [ ] Migrate pages
- [ ] Migrate services
- [ ] Implement new features

**Week 9-10: Security & Polish**
- [ ] Implement security enhancements
- [ ] Add comprehensive testing
- [ ] Performance optimization
- [ ] Documentation

---

## 🎯 Success Metrics

### ✅ Phase 1 Success Metrics (ACHIEVED)
- [x] 100% Database Migration Complete
- [x] Zero Data Loss
- [x] All Tests Passing
- [x] RLS Policies Working
- [x] Audit Logging Active

### 🔄 Phase 2 Success Metrics (TARGET)
- [ ] All Edge Functions Updated
- [ ] Frontend Components Working
- [ ] New Pages Functional
- [ ] Permission-based UI Controls
- [ ] User Testing Complete

### 🏗️ Phase 3 Success Metrics (FUTURE)
- [ ] Next.js Architecture Complete
- [ ] Performance Improved
- [ ] Security Enhanced
- [ ] Documentation Complete
- [ ] Production Ready

---

## 🚨 Risk Assessment & Mitigation

### ⚠️ Phase 2 Risks
**Risk**: Breaking existing functionality
**Mitigation**: 
- Thorough testing before deployment
- Feature flags for gradual rollout
- Rollback plan ready

**Risk**: Performance issues
**Mitigation**:
- Database query optimization
- Caching strategies
- Load testing

### ⚠️ Phase 3 Risks
**Risk**: Migration complexity
**Mitigation**:
- Incremental migration approach
- Parallel running period
- Comprehensive testing

**Risk**: User adoption
**Mitigation**:
- User training sessions
- Documentation
- Support plan

---

## 📞 Next Steps

### 🎯 Immediate Actions (This Week)
1. **Update `manage-employee` Edge Function** (Day 1-2)
2. **Update `EmployeeAdminPage.js`** (Day 2-3)
3. **Update `AuthStore.js`** (Day 3-4)
4. **Test Integration** (Day 4-5)

### 🔄 Short Term (Next 2 Weeks)
1. Create new management pages
2. Update all services
3. Implement permission-based UI
4. User acceptance testing

### 🏗️ Long Term (Next 1-2 Months)
1. Next.js migration planning
2. Security enhancements
3. Performance optimization
4. Production deployment

---

## 📞 Contact & Support

**Project Lead**: [Your Name]  
**Database Architect**: [Your Name]  
**Frontend Lead**: [Team Member]  
**DevOps**: [Team Member]

**Status Meetings**: Every Monday & Thursday  
**Sprint Reviews**: End of each phase  
**Emergency Contact**: [Contact Info]

---

## 📝 Documentation

- **Database Schema**: `database_*.sql` files
- **API Documentation**: To be created
- **User Manual**: To be created
- **Deployment Guide**: To be created

---

**Last Updated**: March 12, 2026  
**Next Review**: March 19, 2026  
**Version**: 1.0
