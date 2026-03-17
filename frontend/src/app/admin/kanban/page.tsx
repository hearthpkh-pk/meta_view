'use client';

import MainLayout from '@/components/ui/MainLayout';
import KanbanView from '@/components/views/KanbanView';

export default function AdminKanbanPage() {
    const showNotification = (msg: string, type: 'success' | 'error' = 'success') => {
        alert(msg); // Placeholder for a real notification system
    };

    return (
        <MainLayout>
             <div className="space-y-6">
                <div className="flex flex-col gap-1">
                    <h1 className="text-2xl font-bold text-slate-900">Admin Oversight: Page Groups</h1>
                    <p className="text-sm text-slate-500 text-left">จัดการสถานะและหมวดหมู่ของเพจทั้งหมดในรูปแบบ Kanban Board</p>
                </div>
                <KanbanView showNotification={showNotification} />
            </div>
        </MainLayout>
    );
}
