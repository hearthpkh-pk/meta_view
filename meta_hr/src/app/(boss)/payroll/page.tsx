'use client';
import MainLayout from '@/components/ui/MainLayout';
import { Briefcase, CreditCard, PieChart } from 'lucide-react';

export default function PayrollPage() {
    return (
        <MainLayout>
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-slate-900">ระบบเงินเดือน (Payroll)</h1>
                <p className="text-slate-500">จัดการเงินเดือนและภาษีสำหรับพนักงาน (Meta HR)</p>
            </div>

            <div className="bg-white rounded-3xl border-2 border-dashed border-slate-200 p-12 text-center text-slate-400">
                <div className="w-20 h-20 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CreditCard size={40} />
                </div>
                <h2 className="text-xl font-bold text-slate-800 mb-2">ระบบ Payroll กำลังอยู่ระหว่างการพัฒนา</h2>
                <p className="max-w-md mx-auto">ฟีเจอร์นี้สงวนสิทธิ์สำหรับ Super Admin ในการจัดการระบบการเงินและภาษีพนักงานในอนาคต</p>
            </div>
        </MainLayout>
    );
}
