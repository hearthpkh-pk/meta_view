'use client';

import { UserCircle, ShieldCheck, Mail } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import MainLayout from '@/components/ui/MainLayout';
import SetupView from '@/components/views/SetupView';
import { useState } from 'react';

export default function StaffSettingsPage() {
    const currentUser = useAppStore((state) => state.currentUser);
    const currentRole = useAppStore((state) => state.currentRole);
    const [notification, setNotification] = useState<{ msg: string, type: 'success' | 'error' } | null>(null);

    const showNotification = (msg: string, type: 'success' | 'error' = 'success') => {
        setNotification({ msg, type });
        setTimeout(() => setNotification(null), 3000);
    };

    return (
        <MainLayout>
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-slate-900">Personal Settings</h1>
                <p className="text-slate-500">ข้อมูลส่วนตัวและตั้งค่าการแจ้งเตือน</p>
            </div>

            {notification && (
                <div className={`fixed top-20 right-4 z-[100] px-6 py-3 rounded-xl shadow-lg animate-in slide-in-from-right duration-300 ${
                    notification.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
                }`}>
                    {notification.msg}
                </div>
            )}

            <div className="flex flex-col gap-6">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 animate-in fade-in duration-300">
                    <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-100">
                        <div className="p-3 bg-blue-50 text-blue-500 rounded-full">
                            <UserCircle size={40} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-800">{(currentUser as any)?.full_name || currentUser?.email?.split('@')[0] || 'พนักงาน Meta View'}</h2>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs font-bold uppercase tracking-wider bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                                    {currentRole.replace('_', ' ')}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <Mail className="text-slate-400" size={18} />
                            <div>
                                <p className="text-sm font-semibold text-slate-800">Email Address</p>
                                <p className="text-xs text-slate-500">{currentUser?.email || 'N/A'}</p>
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-3 pt-4 border-t border-slate-100 mt-4">
                             <ShieldCheck className="text-slate-400" size={18} />
                             <div>
                                <p className="text-sm font-semibold text-slate-800">เปลี่ยนรหัสผ่าน (Change Password)</p>
                                <button className="text-xs text-blue-600 font-semibold hover:underline mt-1" onClick={() => showNotification('พัฒนาระบบเปลี่ยนรหัสผ่าน', 'success')}>คลิกเพื่อเปลี่ยนรหัสผ่าน</button>
                             </div>
                        </div>
                    </div>
                </div>

                {/* Legacy SetupView logic for fb-manager */}
                <SetupView showNotification={showNotification} />
            </div>
        </MainLayout>
    );
}
