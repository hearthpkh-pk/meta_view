'use client';

import AccountsView from '@/components/views/AccountsView';
import MainLayout from '@/components/ui/MainLayout';
import { useState } from 'react';

export default function MyAccountsPage() {
    const [notification, setNotification] = useState<{ msg: string, type: 'success' | 'error' } | null>(null);

    const showNotification = (msg: string, type: 'success' | 'error' = 'success') => {
        setNotification({ msg, type });
        setTimeout(() => setNotification(null), 3000);
    };

    return (
        <MainLayout>
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-slate-900">My Facebook Accounts</h1>
                <p className="text-slate-500">จัดการบัญชีเฟซบุ๊กที่คุณได้รับมอบหมาย</p>
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
