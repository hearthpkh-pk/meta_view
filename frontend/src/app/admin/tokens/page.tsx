'use client';
import MainLayout from '@/components/ui/MainLayout';
import { KeyRound, CheckCircle2, RefreshCw, Trash2 } from 'lucide-react';
import { useState } from 'react';

export default function TokensPage() {
    const [notification, setNotification] = useState<{ msg: string, type: 'success' | 'error' } | null>(null);
    const [newToken, setNewToken] = useState('');

    const showNotification = (msg: string, type: 'success' | 'error' = 'success') => {
        setNotification({ msg, type });
        setTimeout(() => setNotification(null), 3000);
    };

    const handleAddToken = () => {
        if (!newToken) return;
        showNotification('เชื่อมต่อ Token สำเร็จ');
        setNewToken('');
    }

    return (
        <MainLayout>
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-slate-900">Token Management</h1>
                <p className="text-slate-500">จัดการระบบ Token ของ Facebook API ระดับองค์กร</p>
            </div>

            {notification && (
                <div className={`fixed top-20 right-4 z-[100] px-6 py-3 rounded-xl shadow-lg animate-in slide-in-from-right duration-300 ${
                    notification.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
                }`}>
                    {notification.msg}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in duration-300">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 h-fit">
                    <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <KeyRound size={20} className="text-blue-500" /> 
                        เพิ่ม Token ใหม่ (System-level)
                    </h2>
                    <div className="flex gap-2 mb-4">
                        <input 
                            type="text" 
                            value={newToken}
                            onChange={(e) => setNewToken(e.target.value)}
                            placeholder="วาง Facebook Access Token ที่นี่..."
                            className="flex-1 border border-slate-300 rounded-xl px-4 py-2 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button onClick={handleAddToken} className="bg-blue-600 hover:bg-blue-700 text-white px-6 rounded-xl text-sm font-semibold transition-colors">
                            เชื่อมต่อ
                        </button>
                    </div>
                    <p className="text-xs text-slate-500 bg-blue-50/50 p-3 rounded-lg border border-blue-100">
                        * Token ที่ถูกเพิ่มในหน้านี้จะถือเป็น System Token สำหรับการดึงข้อมูลจาก Graph API โดยอัตโนมัติ กรุณาใช้ Token ที่มีสิทธิ์ระดับ Admin
                    </p>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 h-fit">
                    <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <RefreshCw size={20} className="text-emerald-500" /> 
                        สถานะ Token ปัจจุบัน
                    </h2>
                    
                    <div className="space-y-3">
                        {/* Mock Active Token */}
                        <div className="border border-slate-200 rounded-xl p-4 flex items-center justify-between hover:border-blue-300 transition-colors bg-slate-50">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="font-bold text-slate-700 text-sm">Main System Token</span>
                                    <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded uppercase flex items-center gap-1">
                                        <CheckCircle2 size={10} /> Active
                                    </span>
                                </div>
                                <div className="text-xs text-slate-500 font-mono bg-white px-2 py-1 rounded inline-block border border-slate-100">
                                    EAAG...9xZBZB
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button className="text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition-colors text-xs font-semibold">ตรวจสอบสิทธิ์</button>
                                <button className="text-rose-500 hover:bg-rose-50 p-2 rounded-lg transition-colors"><Trash2 size={16} /></button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
}
