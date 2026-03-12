export type PageType = 'Profile Page' | 'Classic Page' | 'Business' | 'Group' | string;

export type Status = 'Active' | 'Rest' | 'Warning' | 'Restricted' | 'Error';

export interface Account {
    id: string; // UUID from Supabase
    uid: string;
    mail: string;
    // We do not store plain text password/passmail here unless decrypted by edge function
    password?: string;
    passmail?: string;
    twoPin?: string;
    url?: string;
    note?: string;
    status: Status;
    pagesManaged: string[]; // Array of Page IDs they have access to
    showPassword?: boolean; // Client-side UI state only
    showPassmail?: boolean; // Client-side UI state only
}

export interface Page {
    id: string; // UUID
    page_id: string; // FB Page ID
    name: string;
    type: PageType;
    url: string;
    status: Status;
    comment: string;
}

export interface Employee {
    id: string;
    email: string;
    full_name: string;
    role_id: string;
    team_id: string;
    base_salary: number; // Stored as integer
    is_active: boolean;
}

// TODO: Add more types for Payroll, Roles, LeaveRequests later
