'use client';

import DashboardView from '@/components/views/DashboardView';
import MainLayout from '@/components/ui/MainLayout';
import { useRouter } from 'next/navigation';

export default function BossDashboard() {
    const router = useRouter();

    return (
        <MainLayout>
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
                <p className="text-slate-500">ข้อมูลสรุปผลการดำเนินงานและสถานะเพจทั้งหมด</p>
            </div>

            <DashboardView onGoToPages={() => router.push('/my-pages')} />
        </MainLayout>
    );
}
