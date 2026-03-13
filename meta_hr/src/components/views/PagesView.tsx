'use client';
import { useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { Trash2, Copy, Plus, Flag, LayoutGrid, List } from 'lucide-react';
import { handleCopy, getStatusColor } from '@/lib/utils';
import { PageType, Status } from '@/types';

export default function PagesView({ showNotification }: { showNotification: (msg: string, type?: 'success' | 'error') => void }) {
    const pages = useAppStore((state) => state.pages);
    const pageTypes = useAppStore((state) => state.pageTypes);
    const addPage = useAppStore((state) => state.addPage);
    const updatePage = useAppStore((state) => state.updatePage);
    const removePage = useAppStore((state) => state.removePage);

    const [newPageName, setNewPageName] = useState('');
    const [newPageUrl, setNewPageUrl] = useState('');
    const [isFetchingName, setIsFetchingName] = useState(false);
    const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

    const sortedPages = [...pages].sort((a, b) => (a.id > b.id ? 1 : -1));

    const handleAddPage = () => {
        if (!newPageName.trim()) {
            showNotification('กรุณาใส่ชื่อเพจ', 'error');
            return;
        }

        addPage({
            id: crypto.randomUUID(),
            page_id: '', // Will be filled by user or API
            name: newPageName.trim(),
            type: pageTypes[0] || 'Profile Page',
            url: newPageUrl.trim(),
            status: 'Active',
            comment: ''
        });

        setNewPageName('');
        setNewPageUrl('');
        showNotification('เพิ่มเพจสำเร็จ');
    };

    const handleUrlBlur = async () => {
        const url = newPageUrl.trim();
        if (!url || !url.startsWith('http')) return;
        if (newPageName.trim()) return;

        try {
            setIsFetchingName(true);
            // This API point doesn't exist yet in the new project, but we'll implement it later
            const response = await fetch(`/api/fetch-fb-meta?url=${encodeURIComponent(url)}`);

            if (response.ok) {
                const data = await response.json();
                if (data.title) {
                    setNewPageName(data.title);
                    showNotification(`ดึงชื่อเพจอัตโนมัติ: ${data.title}`, 'success');
                }
            }
        } catch (error) {
            console.warn('URL auto-fetch skipped');
        } finally {
            setIsFetchingName(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-5 border-b border-slate-100 flex items-center gap-2">
                    <div className="bg-blue-100 p-1.5 rounded-lg text-blue-600"><Plus size={18} /></div>
                    <h2 className="text-lg font-semibold text-slate-800">เพิ่มเพจใหม่เข้าระบบ</h2>
                </div>
                <div className="p-5 flex flex-col sm:flex-row gap-4 items-end bg-slate-50/50">
                    <div className="w-full sm:flex-1">
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">ลิงก์เพจ (URL)</label>
                        <input
                            type="text"
                            value={newPageUrl}
                            onChange={(e) => setNewPageUrl(e.target.value)}
                            onBlur={handleUrlBlur}
                            placeholder="https://facebook.com/..."
                            className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        />
                    </div>
                    <div className="w-full sm:w-1/3">
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">ชื่อเพจ (Name Page) <span className="text-rose-500">*</span></label>
                        <input
                            type="text"
                            value={newPageName}
                            onChange={(e) => setNewPageName(e.target.value)}
                            placeholder={isFetchingName ? "กำลังดึงข้อมูล..." : "เช่น ร้านเสื้อผ้าแฟชั่น..."}
                            disabled={isFetchingName}
                            className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all disabled:bg-slate-100"
                        />
                    </div>
                    <button
                        onClick={handleAddPage}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-6 rounded-xl transition-all shadow-sm hover:shadow w-full sm:w-auto h-[42px]"
                    >
                        บันทึกเพจ
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-5 border-b border-slate-100 flex justify-between items-center">
                    <h2 className="text-lg font-semibold text-slate-800">คลังเพจทั้งหมด ({pages.length})</h2>
                    <div className="flex bg-slate-100 p-1 rounded-lg">
                        <button
                            onClick={() => setViewMode('table')}
                            className={`p-1.5 rounded-md transition-colors ${viewMode === 'table' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            <List size={16} />
                        </button>
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-1.5 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            <LayoutGrid size={16} />
                        </button>
                    </div>
                </div>

                {viewMode === 'table' ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[1000px]">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-sm">
                                    <th className="py-4 px-5 font-semibold w-1/5">ชื่อเพจ</th>
                                    <th className="py-4 px-5 font-semibold w-32">ประเภท</th>
                                    <th className="py-4 px-5 font-semibold w-1/3">URL</th>
                                    <th className="py-4 px-5 font-semibold w-32">สถานะ</th>
                                    <th className="py-4 px-5 font-semibold w-48">หมายเหตุ</th>
                                    <th className="py-4 px-5 font-semibold w-24 text-center">จัดการ</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {pages.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="py-16 text-center text-slate-400">
                                            <Flag size={48} className="mx-auto mb-3 opacity-20" />
                                            <p>ยังไม่มีข้อมูลเพจ</p>
                                        </td>
                                    </tr>
                                ) : (
                                    sortedPages.map((page) => (
                                        <tr key={page.id} className="hover:bg-slate-50 transition-colors group">
                                            <td className="py-2 px-5">
                                                <input
                                                    type="text"
                                                    value={page.name}
                                                    onChange={(e) => updatePage(page.id, { name: e.target.value })}
                                                    className="w-full bg-transparent border border-transparent focus:border-blue-300 focus:bg-white rounded-lg px-2 py-1.5 outline-none text-sm font-medium text-slate-800 transition-all"
                                                />
                                            </td>
                                            <td className="py-2 px-5">
                                                <select
                                                    value={page.type}
                                                    onChange={(e) => updatePage(page.id, { type: e.target.value as PageType })}
                                                    className="w-full bg-transparent border border-transparent hover:border-slate-200 rounded-lg px-2 py-1.5 text-sm outline-none transition-all"
                                                >
                                                    {pageTypes.map(t => <option key={t} value={t}>{t}</option>)}
                                                </select>
                                            </td>
                                            <td className="py-2 px-5">
                                                <div className="flex items-center gap-1">
                                                    <input
                                                        type="text"
                                                        value={page.url}
                                                        onChange={(e) => updatePage(page.id, { url: e.target.value })}
                                                        className="w-full bg-transparent border border-transparent focus:border-blue-300 focus:bg-white rounded-lg px-2 py-1.5 outline-none text-sm truncate transition-all"
                                                    />
                                                    <button onClick={() => handleCopy(page.url, () => showNotification('คัดลอกสำเร็จ'))} className="text-slate-400 hover:text-blue-600 p-1.5 opacity-0 group-hover:opacity-100 bg-slate-100 rounded transition-all">
                                                        <Copy size={14} />
                                                    </button>
                                                </div>
                                            </td>
                                            <td className="py-2 px-5">
                                                <select
                                                    value={page.status}
                                                    onChange={(e) => updatePage(page.id, { status: e.target.value as Status })}
                                                    className={`w-full appearance-none border rounded-lg px-3 py-1.5 text-xs font-bold uppercase tracking-wider outline-none transition-colors ${getStatusColor(page.status)}`}
                                                >
                                                    <option value="Active">🟢 Active</option>
                                                    <option value="Warning">🟡 Warning</option>
                                                    <option value="Restricted">🔴 Restricted</option>
                                                    <option value="Rest">⚪ Rest/Unpub</option>
                                                </select>
                                            </td>
                                            <td className="py-2 px-5">
                                                <input
                                                    type="text"
                                                    value={page.comment}
                                                    onChange={(e) => updatePage(page.id, { comment: e.target.value })}
                                                    placeholder="เพิ่มหมายเหตุ..."
                                                    className="w-full bg-transparent border border-transparent hover:border-slate-200 focus:border-blue-400 focus:bg-white rounded-lg px-2 py-1.5 outline-none text-sm transition-all"
                                                />
                                            </td>
                                            <td className="py-2 px-5 text-center">
                                                <button
                                                    onClick={() => {
                                                        removePage(page.id);
                                                        showNotification('ลบข้อมูลเพจแล้ว');
                                                    }}
                                                    className="text-slate-400 hover:text-rose-600 p-2 hover:bg-rose-50 rounded-lg transition-colors"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 bg-slate-50/50">
                        {pages.map((page) => (
                            <div key={page.id} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all flex flex-col gap-3 group">
                                <div className="flex justify-between items-start gap-2 border-b border-slate-100 pb-3">
                                    <div className="flex-1 min-w-0">
                                        <input
                                            type="text"
                                            value={page.name}
                                            onChange={(e) => updatePage(page.id, { name: e.target.value })}
                                            className="w-full bg-transparent border border-transparent focus:border-blue-300 rounded px-1 -ml-1 outline-none text-sm font-bold text-slate-800 transition-all truncate"
                                        />
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <select
                                            value={page.status}
                                            onChange={(e) => updatePage(page.id, { status: e.target.value as Status })}
                                            className={`appearance-none border rounded-lg px-2 py-1 text-[10px] font-bold uppercase tracking-wider outline-none transition-all ${getStatusColor(page.status)}`}
                                        >
                                            <option value="Active">🟢 Active</option>
                                            <option value="Warning">🟡 Warning</option>
                                            <option value="Restricted">🔴 Restricted</option>
                                            <option value="Rest">⚪ Rest/Unpub</option>
                                        </select>
                                        <button
                                            onClick={() => {
                                                removePage(page.id);
                                                showNotification('ลบข้อมูลเพจแล้ว');
                                            }}
                                            className="text-slate-400 hover:text-rose-600 p-1.5 hover:bg-rose-50 rounded-lg transition-colors"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-2 flex-1">
                                    <div className="flex items-center gap-2 bg-slate-50 rounded-lg p-2 border border-slate-100">
                                        <div className="text-[10px] font-semibold text-slate-500 w-10">Type:</div>
                                        <select
                                            value={page.type}
                                            onChange={(e) => updatePage(page.id, { type: e.target.value as PageType })}
                                            className="flex-1 bg-transparent outline-none text-xs text-slate-800 cursor-pointer p-0.5 rounded"
                                        >
                                            {pageTypes.map(t => <option key={t} value={t}>{t}</option>)}
                                        </select>
                                    </div>

                                    <div className="flex items-center gap-2 bg-slate-50 rounded-lg p-2 border border-slate-100">
                                        <div className="text-[10px] font-semibold text-slate-500 w-10">URL:</div>
                                        <input
                                            type="text"
                                            value={page.url}
                                            onChange={(e) => updatePage(page.id, { url: e.target.value })}
                                            className="flex-1 bg-transparent outline-none text-xs text-slate-800 min-w-0"
                                        />
                                        <button onClick={() => handleCopy(page.url, () => showNotification('คัดลอกสำเร็จ'))} className="text-slate-400 hover:text-blue-600 p-1 transition-all"><Copy size={12} /></button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
