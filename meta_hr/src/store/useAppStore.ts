import { create } from 'zustand';
import { Account, Page, PageType, Employee } from '@/types';

// TODO: Will be replaced by initial fetching from Next.js server components or SWR
interface AppState {
    accounts: Account[];
    pages: Page[];
    employees: Employee[];
    pageTypes: PageType[];
    isLoading: boolean;

    // Actions
    setLoading: (loading: boolean) => void;
    setAccounts: (accounts: Account[]) => void;
    addAccount: (account: Account) => void;
    updateAccount: (id: string, updates: Partial<Account>) => void;
    removeAccount: (id: string) => void;

    setPages: (pages: Page[]) => void;
    addPage: (page: Page) => void;
    updatePage: (id: string, updates: Partial<Page>) => void;
    removePage: (id: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
    accounts: [],
    pages: [],
    employees: [],
    pageTypes: ['Profile Page', 'Classic Page', 'Business', 'Group'],
    isLoading: false,

    setLoading: (isLoading) => set({ isLoading }),

    setAccounts: (accounts) => set({ accounts }),
    addAccount: (account) => set((state) => ({ accounts: [...state.accounts, account] })),
    updateAccount: (id, updates) => set((state) => ({
        accounts: state.accounts.map(acc => acc.id === id ? { ...acc, ...updates } : acc)
    })),
    removeAccount: (id) => set((state) => ({
        accounts: state.accounts.filter(acc => acc.id !== id)
    })),

    setPages: (pages) => set({ pages }),
    addPage: (page) => set((state) => ({ pages: [...state.pages, page] })),
    updatePage: (id, updates) => set((state) => ({
        pages: state.pages.map(page => page.id === id ? { ...page, ...updates } : page)
    })),
    removePage: (id) => set((state) => ({
        pages: state.pages.filter(page => page.id !== id),
        accounts: state.accounts.map(acc => ({
            ...acc,
            pagesManaged: acc.pagesManaged.filter(pId => pId !== id)
        }))
    })),
}));
