'use client';

import AccountsView from '@/components/views/AccountsView';
import MainLayout from '@/components/ui/MainLayout';
import { useState } from 'react';
import Link from 'next/link';

export default function AdminAccountsPage() {
    const [notification, setNotification] = useState<{ msg: string, type: 'success' | 'error' } | null>(null);

    const showNotification = (msg: string, type: 'success' | 'error' = 'success') => {
        setNotification({ msg, type });
        setTimeout(() => setNotification(null), 3000);
    };

    const navTabs = (
        <div className="flex items-center gap-1">
            <Link href="/fb-pages" className="px-3 py-1.5 rounded-lg hover:bg-white/10 text-sm font-medium text-white/70 hover:text-white transition-all">
                Pages
            </Link>
            <Link href="/fb-accounts" className="px-3 py-1.5 rounded-lg bg-white/20 text-sm font-bold text-white transition-all">
                Accounts
            </Link>
            <Link href="/tokens" className="px-3 py-1.5 rounded-lg hover:bg-white/10 text-sm font-medium text-white/70 hover:text-white transition-all">
                Tokens
            </Link>
        </div>
    );

    return (
        <MainLayout navTabs={navTabs}>
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-slate-900">Facebook Accounts (Admin)</h1>
                <p className="text-slate-500">จัดการข้อมูลบัญชีเฟซบุ๊กทั้งหมดของบริษัท</p>
            </div>

            {notification && (
                <div className={`fixed top-20 right-4 z-[100] px-6 py-3 rounded-xl shadow-lg animate-in slide-in-from-right duration-300 ${
                    notification.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
                }`}>
                    {notification.msg}
                </div>
            )}

            <AccountsView showNotification={showNotification} />
        </MainLayout>
    );
}
