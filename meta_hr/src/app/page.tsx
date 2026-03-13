import Link from 'next/link';
import { ShieldCheck, Users, Briefcase } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
      <div className="max-w-4xl w-full text-center space-y-8">
        <div className="space-y-3">
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight sm:text-5xl">
            Meta HR Operations
          </h1>
          <p className="text-xl text-slate-600">
            ระบบบริหารจัดการพนักงาน บัญชีเฟซบุ๊ก และรายได้ อย่างครบวงจร
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          {/* Boss Perspective */}
          <Link 
            href="/dashboard" 
            className="group p-8 bg-white rounded-3xl shadow-sm border border-slate-200 hover:border-blue-500 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
          >
            <div className="bg-blue-100 w-16 h-16 rounded-2xl flex items-center justify-center text-blue-600 mb-6 group-hover:scale-110 transition-transform">
              <ShieldCheck size={32} />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Boss</h2>
            <p className="text-slate-500">
              ภาพรวมบริษัท การเงิน และระบบจัดการสิทธิ์ (RBAC)
            </p>
          </Link>

          {/* Admin Perspective */}
          <Link 
            href="/fb-pages" 
            className="group p-8 bg-white rounded-3xl shadow-sm border border-slate-200 hover:border-indigo-500 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
          >
            <div className="bg-indigo-100 w-16 h-16 rounded-2xl flex items-center justify-center text-indigo-600 mb-6 group-hover:scale-110 transition-transform">
              <Briefcase size={32} />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Admin</h2>
            <p className="text-slate-500">
              จัดการเพจ บัญชีเฟซบุ๊กทั้งหมด และ Meta Tokens
            </p>
          </Link>

          {/* Staff Perspective */}
          <Link 
            href="/my-accounts" 
            className="group p-8 bg-white rounded-3xl shadow-sm border border-slate-200 hover:border-emerald-500 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
          >
            <div className="bg-emerald-100 w-16 h-16 rounded-2xl flex items-center justify-center text-emerald-600 mb-6 group-hover:scale-110 transition-transform">
              <Users size={32} />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Staff</h2>
            <p className="text-slate-500">
              จัดการบัญชีและเพจที่ได้รับมอบหมาย รวมถึงการลางาน
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
}
