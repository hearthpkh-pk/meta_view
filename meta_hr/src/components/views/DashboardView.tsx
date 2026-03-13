'use client';
import { useState, useMemo } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { LayoutDashboard, Plus, Link as LinkIcon, Users, Filter } from 'lucide-react';
import { getStatusColor } from '@/lib/utils';

export default function DashboardView({ onGoToPages }: { onGoToPages: () => void }) {
    const pages = useAppStore((state) => state.pages);
    const accounts = useAppStore((state) => state.accounts);
    const viewMode = useAppStore((state) => state.viewMode);
    const currentUser = useAppStore((state) => state.currentUser);

    const [groupBy, setGroupBy] = useState<'None' | 'Type' | 'Status'>('Status');

    // Filter pages based on mode
    const filteredPages = useMemo(() => {
        if (viewMode === 'management') return pages;
        return pages.filter(p => p.assigned_to === currentUser?.id);
    }, [pages, viewMode, currentUser]);

    const sortedPages = useMemo(() => 
        [...filteredPages].sort((a, b) => (a.order_index || 0) - (b.order_index || 0)),
    [filteredPages]);

    // Map page IDs to their overall sequential number
    const pageNumberMap = useMemo(() => {
        const map = new Map<string, number>();
        sortedPages.forEach((p, idx) => map.set(p.id, idx + 1));
        return map;
    }, [sortedPages]);

    const groupedPages = useMemo(() => {
        if (groupBy === 'None') return { 'ทั้งหมด': sortedPages };

        const groups = sortedPages.reduce((acc, page) => {
            const key = groupBy === 'Type' ? (page.page_type || 'ไม่ระบุประเภท') : (page.status || 'Active');
            if (!acc[key]) acc[key] = [];
            acc[key].push(page);
            return acc;
        }, {} as Record<string, typeof filteredPages>);

        // Sort keys to prioritize 'ใช้งานปกติ' if grouping by Status
        if (groupBy === 'Status') {
            const priorityOrder = [
                'ใช้งานปกติ', 'ใช้งาน (แจ้งเตือน)', 'ใช้งาน (จำกัด)',
                'พักเพจปกติ', 'พักเพจ (แจ้งเตือน)', 'พักเพจ (จำกัด)',
                'เพจมีปัญหา'
            ];

            const sortedKeys = Object.keys(groups).sort((a, b) => {
                const idxA = priorityOrder.indexOf(a);
                const idxB = priorityOrder.indexOf(b);
                
                if (idxA !== -1 && idxB !== -1) return idxA - idxB;
                if (idxA !== -1) return -1;
                if (idxB !== -1) return 1;
                return a.localeCompare(b);
            });
            
            const sortedGroups: Record<string, typeof filteredPages> = {};
            sortedKeys.forEach(k => sortedGroups[k] = groups[k]);
            return sortedGroups;
        }

        return groups;
    }, [sortedPages, groupBy]);

    if (filteredPages.length === 0) {
        return (
            <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center font-sans">
                <LayoutDashboard size={48} className="mx-auto text-slate-300 mb-4" />
                <h3 className="text-lg font-semibold text-slate-800">ยังไม่มีข้อมูลเพจ</h3>
                <p className="text-slate-500 mt-1 mb-4 font-sans text-sm">เริ่มต้นการใช้งานโดยการเพิ่มเพจที่คุณดูแลเข้าสู่ระบบก่อน</p>
                <button
                    onClick={onGoToPages}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors inline-flex items-center gap-2"
                >
                    <Plus size={18} /> ไปที่หน้าจัดการเพจ
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            {/* Filter & Options Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-white rounded-xl shadow-sm border border-slate-200 p-3 px-5 gap-4">
                <div className="flex items-center gap-2 text-slate-700 font-medium">
                    <Filter size={18} className="text-blue-500" />
                    <span className="text-sm">จัดกลุ่มการแสดงผล:</span>
                </div>
                <div className="flex bg-slate-100 p-1 rounded-lg self-start sm:self-auto overflow-x-auto w-full sm:w-auto">
                    {(['None', 'Type', 'Status'] as const).map(option => (
                        <button
                            key={option}
                            onClick={() => setGroupBy(option)}
                            className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all whitespace-nowrap flex-1 sm:flex-none ${groupBy === option ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}
                        >
                            {option === 'None' ? 'ไม่จัดกลุ่ม' : option === 'Type' ? 'แยกตามประเภท' : 'แยกตามสถานะ'}
                        </button>
                    ))}
                </div>
            </div>

            <div className="space-y-8">
                {Object.entries(groupedPages).map(([groupName, groupPages]) => (
                    <div key={groupName} className="space-y-4">
                        {groupBy !== 'None' && (
                            <h2 className="text-lg font-bold text-slate-800 border-b border-slate-200 pb-2 flex items-center gap-2">
                                {groupName}
                                <span className="text-xs font-normal text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                                    {groupPages.length} เพจ
                                </span>
                            </h2>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
                             {groupPages.map((page) => {
                                const admins = accounts.filter(acc => (acc.pages_managed || []).includes(page.id));
                                const pageNum = pageNumberMap.get(page.id);

                                return (
                                    <div key={page.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 hover:shadow-md transition-shadow flex flex-col h-full items-center text-center font-sans relative overflow-hidden group">

                                        {/* Sequence Number Badge */}
                                        <div className="absolute top-0 left-0 bg-slate-800 text-white text-[10px] font-bold px-2 py-1 rounded-br-lg opacity-80 z-10 shadow-sm">
                                            #{pageNum}
                                        </div>

                                        <div className="w-full flex justify-end mb-2 h-5">
                                            <span className={`inline-flex px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${getStatusColor(page.status)}`}>
                                                {page.status}
                                            </span>
                                        </div>

                                        <h3 className="text-sm md:text-base font-bold text-slate-800 line-clamp-2 w-full mb-1 leading-snug px-3" title={page.name}>
                                            {page.name}
                                        </h3>

                                        <div className="flex items-center justify-center gap-1.5 mb-3 mt-1">
                                            <span className="bg-slate-50 border border-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px] font-semibold tracking-wide truncate max-w-[120px]" title={page.page_type}>
                                                {page.page_type}
                                            </span>
                                            {page.url && (
                                                <a href={page.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-600 bg-blue-50 p-1 rounded transition-colors" title="เปิดเพจ">
                                                    <LinkIcon size={12} />
                                                </a>
                                            )}
                                        </div>

                                        {page.comment && (
                                            <div className="text-[11px] text-slate-500 bg-slate-50 w-full rounded-md p-2 mb-3 border border-slate-100 italic line-clamp-2" title={page.comment}>
                                                "{page.comment}"
                                            </div>
                                        )}

                                        <div className="flex-grow"></div>

                                        <div className="w-full pt-3 border-t border-slate-100 mt-2">
                                            <h4 className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-center gap-1">
                                                <Users size={12} /> ผู้ดูแล (<span className="text-slate-600 font-bold">{admins.length}</span>)
                                            </h4>

                                            {admins.length === 0 ? (
                                                <div className="text-[10px] text-slate-400 bg-slate-50 border border-dashed border-slate-200 rounded py-2 w-full text-center">
                                                    - ไม่มีบัญชี -
                                                </div>
                                            ) : (
                                                <div className="flex flex-wrap justify-center gap-1">
                                                    {admins.map(admin => (
                                                        <div
                                                            key={admin.id}
                                                            className={`text-[10px] px-1.5 py-0.5 rounded border font-medium max-w-[80px] truncate ${admin.status === 'Active' ? 'bg-white border-slate-200 text-slate-700' :
                                                                admin.status === 'Error' ? 'bg-rose-50 border-rose-200 text-rose-700' :
                                                                    'bg-amber-50 border-amber-200 text-amber-700'
                                                                }`}
                                                            title={`ID: ${admin.uid || '-'} | สถานะ: ${admin.status}`}
                                                        >
                                                            {admin.username ? admin.username.split('@')[0] : (admin.uid ? admin.uid : 'No Name')}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
