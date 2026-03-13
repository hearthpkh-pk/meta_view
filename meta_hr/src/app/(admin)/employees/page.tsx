'use client';
import { useState } from 'react';
import MainLayout from '@/components/ui/MainLayout';
import { useAppStore } from '@/store/useAppStore';
import { 
    Users2, Phone, Mail, Building2, Plus, 
    MoreVertical, Edit2, Trash2, CreditCard, 
    Banknote, ShieldCheck 
} from 'lucide-react';

export default function EmployeesPage() {
    const employees = useAppStore((state) => state.employees);
    const teams = useAppStore((state) => state.teams);
    const [isModalOpen, setIsModalOpen] = useState(false);

    return (
        <MainLayout>
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Employee Hub</h1>
                    <p className="text-slate-500 text-sm">Manage your organization's human resources and structure.</p>
                </div>
                <button 
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-bold shadow-lg shadow-blue-200 transition-all active:scale-95"
                >
                    <Plus size={18} />
                    <span>Add Employee</span>
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {employees.map(emp => (
                    <div key={emp.id} className="group relative bg-white border border-slate-200 rounded-3xl p-5 shadow-sm hover:shadow-xl hover:border-blue-200 transition-all duration-300">
                        {/* Status/Role Badge */}
                        <div className="absolute top-5 right-5">
                            <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                                emp.role_id === 'super_admin' ? 'bg-rose-50 text-rose-600' :
                                emp.role_id === 'admin' ? 'bg-blue-50 text-blue-600' :
                                emp.role_id === 'manager' ? 'bg-amber-50 text-amber-600' :
                                'bg-slate-50 text-slate-500'
                            }`}>
                                {emp.role_id}
                            </span>
                        </div>

                        <div className="flex items-start gap-4 mb-6">
                            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-inner uppercase">
                                {emp.full_name.charAt(0)}
                            </div>
                            <div className="text-left">
                                <h3 className="font-bold text-slate-900 text-lg leading-tight group-hover:text-blue-600 transition-colors uppercase">{emp.full_name}</h3>
                                <p className="text-xs text-slate-400 font-mono mt-0.5">{emp.employee_code || `EMP-${emp.id.slice(0, 4).toUpperCase()}`}</p>
                            </div>
                        </div>

                        <div className="space-y-3 pt-4 border-t border-slate-50">
                            <div className="flex items-center gap-3 text-sm text-slate-600">
                                <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                                    <Mail size={14} />
                                </div>
                                <span className="font-medium">{emp.email}</span>
                            </div>
                            
                            <div className="flex items-center gap-3 text-sm text-slate-600">
                                <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                                    <Building2 size={14} />
                                </div>
                                <span className="font-medium">
                                    {teams.find(t => t.id === emp.team_id)?.name || 'General Operations'}
                                </span>
                            </div>

                            <div className="flex items-center gap-3 text-sm text-slate-600">
                                <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                                    <Banknote size={14} />
                                </div>
                                <span className="font-bold text-slate-900 capitalize">
                                    {emp.salary ? `${emp.salary.toLocaleString()} THB` : 'Not Set'}
                                </span>
                                <span className="text-[10px] text-slate-400 font-bold ml-1 uppercase">Base Salary</span>
                            </div>
                        </div>

                        {/* Actions Overlay for hover */}
                        <div className="mt-6 flex items-center gap-2 pt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button className="flex-1 bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-600 py-2 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2">
                                <Edit2 size={14} /> Edit
                            </button>
                            <button className="flex-1 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 py-2 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2">
                                <Trash2 size={14} /> Terminate
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal Placeholder */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <h2 className="text-xl font-bold text-slate-900">Add New Employee</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-2"><Plus className="rotate-45" size={24} /></button>
                        </div>
                        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 ml-1">Full Name</label>
                                    <input type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="First Last" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 ml-1">Email</label>
                                    <input type="email" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="name@company.com" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 ml-1">Role</label>
                                    <select className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                                        <option value="staff">Staff</option>
                                        <option value="manager">Manager</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 ml-1">Base Salary (Integer)</label>
                                    <input type="number" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="30000" />
                                </div>
                            </div>
                            <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100 space-y-4">
                                <p className="text-[10px] font-black text-blue-600 uppercase flex items-center gap-2"><CreditCard size={12} /> Banking Details</p>
                                <div className="grid grid-cols-2 gap-4">
                                    <input type="text" className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none" placeholder="Bank Name (e.g. SCB)" />
                                    <input type="text" className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none" placeholder="Account Number" />
                                </div>
                            </div>
                        </div>
                        <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3">
                            <button onClick={() => setIsModalOpen(false)} className="flex-1 py-3 text-sm font-bold text-slate-500 hover:bg-slate-200 rounded-2xl transition-all">Cancel</button>
                            <button className="flex-[2] py-3 text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-2xl shadow-lg shadow-blue-200 transition-all">Create Profile</button>
                        </div>
                    </div>
                </div>
            )}
        </MainLayout>
    );
}
