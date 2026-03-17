'use client';

import MainLayout from '@/components/ui/MainLayout';
import AccountsView from '@/components/views/AccountsView';
import { useAppStore } from '@/store/useAppStore';

export default function AdminAccountsPage() {
    const showNotification = (msg: string, type: 'success' | 'error' = 'success') => {
        alert(msg); // Placeholder for a real notification system
    };

    return (
        <MainLayout>
            <div className="space-y-6">
                <div className="flex flex-col gap-1">
                    <h1 className="text-2xl font-bold text-slate-900">Admin Oversight: Facebook Accounts</h1>
                    <p className="text-sm text-slate-500 text-left">สถานะและการจัดการบัญชีโฆษณาของพนักงานทั้งหมดในระบบ</p>
                </div>
                <AccountsView showNotification={showNotification} />
            </div>
        </MainLayout>
    );
}
