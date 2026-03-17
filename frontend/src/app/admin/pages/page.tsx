'use client';

import MainLayout from '@/components/ui/MainLayout';
import PagesView from '@/components/views/PagesView';

export default function AdminPagesPage() {
    const showNotification = (msg: string, type: 'success' | 'error' = 'success') => {
        alert(msg); // Placeholder for a real notification system
    };

    return (
        <MainLayout>
             <div className="space-y-6">
                <div className="flex flex-col gap-1">
                    <h1 className="text-2xl font-bold text-slate-900">Admin Oversight: Facebook Pages</h1>
                    <p className="text-sm text-slate-500 text-left">ตรวจสอบและจัดการเพจทั้งหมดที่พนักงานถือครอง</p>
                </div>
                <PagesView showNotification={showNotification} />
            </div>
        </MainLayout>
    );
}
