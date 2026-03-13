export type PageType = 'Profile Page' | 'Classic Page' | 'Business' | 'Group' | string;

export type Status = 
    | 'ใช้งานปกติ' | 'ใช้งาน (แจ้งเตือน)' | 'ใช้งาน (จำกัด)' 
    | 'พักเพจปกติ' | 'พักเพจ (แจ้งเตือน)' | 'พักเพจ (จำกัด)' 
    | 'เพจมีปัญหา' | string;

export interface Account {
    id: string; // UUID from Supabase
    uid: string;
    name: string;
    username?: string; // Standardized from 'mail'
    password?: string;
    passmail?: string;
    two_pin?: string; // Standardized from 'twoPin'
    url?: string;
    note?: string;
    status: string;
    comment?: string;
    pages_managed: string[]; // Array of Page IDs, standardized from 'pagesManaged'
    show_password?: boolean; // standardized from 'showPassword'
    assigned_to?: string; // Employee ID
    managed_by?: string;
    created_at?: string;
    updated_at?: string;
}

export interface Page {
    id: string; // UUID
    fb_page_id: string; // FB Page ID, required
    name: string;
    page_type: PageType; // Standardized from 'type'
    url?: string;
    status: string;
    comment?: string;
    order_index?: number; // Standardized from 'order'
    account_id?: string; // Parent account
    assigned_to?: string; // Employee ID
    created_at?: string;
}

export interface Employee {
    id: string;
    email: string;
    first_name?: string;
    last_name?: string;
    full_name: string;
    role_id: string;
    team_id?: string;
    salary?: number; // Stored as integer
    employee_code?: string;
    bank_name?: string;
    bank_account?: string;
    is_active: boolean;
}

export interface Team {
    id: string;
    name: string;
    manager_id?: string;
}

// TODO: Add more types for Payroll, Roles, LeaveRequests later
