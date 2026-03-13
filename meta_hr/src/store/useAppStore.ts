import { create } from 'zustand';
import { Account, Page, PageType, Employee, Team } from '@/types';
import { supabase } from '@/lib/supabase/client';

interface AppState {
    accounts: Account[];
    pages: Page[];
    employees: Employee[];
    teams: Team[];
    pageTypes: PageType[];
    isLoading: boolean;
    currentUser: { id: string, email: string, role: string } | null;

    currentRole: string; // 'super_admin' | 'admin' | 'manager' | 'staff'
    viewMode: 'personal' | 'management';
    selectedStaffId: string;

    // Actions
    setLoading: (loading: boolean) => void;

    // Remote Fetching
    fetchWorkspaceData: () => Promise<void>;
    fetchEmployees: () => Promise<void>;

    // CRUD Actions (Persistent)
    addAccount: (account: Omit<Account, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
    updateAccount: (id: string, updates: Partial<Account>) => Promise<void>;
    removeAccount: (id: string) => Promise<void>;

    addPage: (page: Omit<Page, 'id' | 'created_at'>) => Promise<void>;
    updatePage: (id: string, updates: Partial<Page>) => Promise<void>;
    removePage: (id: string) => Promise<void>;

    // State only or small config
    addPageType: (type: string) => void;
    removePageType: (type: string) => void;
    updatePageOrder: (orderedPages: Page[]) => Promise<void>;

    setCurrentUser: (user: any) => void;
    setCurrentRole: (role: string) => void;
    setViewMode: (mode: 'personal' | 'management') => void;
    setSelectedStaffId: (id: string) => void;
    logout: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
    accounts: [],
    pages: [],
    employees: [],
    teams: [],
    pageTypes: ['รายการ', 'หนัง', 'ซีรี่ส์', 'ข่าว'],
    isLoading: false,
    currentUser: null,
    currentRole: 'staff',
    viewMode: 'personal',
    selectedStaffId: 'all',

    setLoading: (isLoading) => set({ isLoading }),

    fetchWorkspaceData: async () => {
        if (!supabase) return;
        set({ isLoading: true });
        try {
            const { data: accounts, error: accError } = await supabase.from('fb_accounts').select('*').order('created_at', { ascending: false });
            const { data: pages, error: pageError } = await supabase.from('pages').select('*').order('order_index', { ascending: true });

            if (accError) throw accError;
            if (pageError) throw pageError;

            set({ accounts: accounts || [], pages: pages || [] });
        } catch (error) {
            console.error('Error fetching workspace data:', error);
        } finally {
            set({ isLoading: false });
        }
    },

    fetchEmployees: async () => {
        if (!supabase) return;
        try {
            const { data, error } = await supabase
                .from('employees')
                .select('*')
                .eq('is_active', true)
                .order('first_name');

            if (error) throw error;

            // Map to the Employee interface
            const mapped = (data || []).map((emp: Employee) => ({
                ...emp,
                full_name: `${emp.first_name} ${emp.last_name || ''}`.trim()
            }));

            set({ employees: mapped });
        } catch (error) {
            console.error('Error fetching employees:', error);
        }
    },

    addAccount: async (account) => {
        if (!supabase) throw new Error('Supabase client not initialized');
        const currentUser = get().currentUser;

        const payload = {
            ...account,
            assigned_to: account.assigned_to || currentUser?.id
        };

        const { data, error } = await supabase.from('fb_accounts').insert([payload]).select().single();
        if (error) throw new Error(error.message || 'Error adding account');
        if (data) {
            set((state) => ({ accounts: [data, ...state.accounts] }));
        }
    },

    updateAccount: async (id, updates) => {
        if (!supabase) throw new Error('Supabase client not initialized');
        const { error } = await supabase.from('fb_accounts').update(updates).eq('id', id);
        if (error) throw new Error(error.message || 'Error updating account');
        set((state) => ({
            accounts: state.accounts.map(acc => acc.id === id ? { ...acc, ...updates } : acc)
        }));
    },

    removeAccount: async (id) => {
        if (!supabase) throw new Error('Supabase client not initialized');
        const { error } = await supabase.from('fb_accounts').delete().eq('id', id);
        if (error) throw new Error(error.message || 'Error removing account');
        set((state) => ({
            accounts: state.accounts.filter(acc => acc.id !== id),
            pages: state.pages.filter(page => page.account_id !== id)
        }));
    },

    addPage: async (page) => {
        if (!supabase) throw new Error('Supabase client not initialized');
        const currentUser = get().currentUser;

        const payload = {
            ...page,
            assigned_to: page.assigned_to || currentUser?.id
        };

        const { data, error } = await supabase.from('pages').insert([payload]).select().single();
        if (error) throw new Error(error.message || 'Error adding page');
        if (data) {
            set((state) => ({ pages: [...state.pages, data] }));
        }
    },

    updatePage: async (id, updates) => {
        if (!supabase) throw new Error('Supabase client not initialized');
        const { error } = await supabase.from('pages').update(updates).eq('id', id);
        if (error) throw new Error(error.message || 'Error updating page');
        set((state) => ({
            pages: state.pages.map(page => page.id === id ? { ...page, ...updates } : page)
        }));
    },

    removePage: async (id) => {
        if (!supabase) throw new Error('Supabase client not initialized');
        const { error } = await supabase.from('pages').delete().eq('id', id);
        if (error) throw new Error(error.message || 'Error removing page');
        set((state) => ({
            pages: state.pages.filter(page => page.id !== id),
            accounts: state.accounts.map(acc => ({
                ...acc,
                pages_managed: (acc.pages_managed || []).filter(pId => pId !== id)
            }))
        }));
    },

    addPageType: (type) => set((state) => ({
        pageTypes: [...state.pageTypes, type]
    })),

    removePageType: (type) => set((state) => ({
        pageTypes: state.pageTypes.filter(t => t !== type)
    })),

    updatePageOrder: async (orderedPages) => {
        if (!supabase) return;

        // Update local state first for immediate UI response
        set({ pages: orderedPages });

        try {
            // In a real app with high scale, we'd use a RPC or bulk update
            // For 50-100 items per user, individual updates or a structured query are okay
            // Here we'll do them in parallel for speed if the set is small
            const updates = orderedPages.map((page, index) =>
                supabase.from('pages').update({ order_index: index + 1 }).eq('id', page.id)
            );
            await Promise.all(updates);
        } catch (error) {
            console.error('Error updating page order:', error);
            // Optionally revert local state or show error
        }
    },

    setCurrentUser: (user) => set({ currentUser: user }),
    setCurrentRole: (role) => set({ currentRole: role }),
    setViewMode: (viewMode) => set({ viewMode }),
    setSelectedStaffId: (id) => set({ selectedStaffId: id }),
    logout: () => set({ currentUser: null, currentRole: 'staff', viewMode: 'personal', accounts: [], pages: [], employees: [], teams: [] }),
}));
