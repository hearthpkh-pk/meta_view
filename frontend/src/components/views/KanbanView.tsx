'use client';
import { useMemo, useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { Plus, GripVertical, Trash2, Edit2, Flag, MoreVertical } from 'lucide-react';
import { Page, PageCategory } from '@/types';

export default function KanbanView({ showNotification }: { showNotification: (msg: string, type?: 'success' | 'error') => void }) {
    const pages = useAppStore((state) => state.pages);
    const categories = useAppStore((state) => state.categories);
    const updatePage = useAppStore((state) => state.updatePage);
    const addCategory = useAppStore((state) => state.addCategory);
    const updateCategory = useAppStore((state) => state.updateCategory);
    const removeCategory = useAppStore((state) => state.removeCategory);

    const [newCategoryName, setNewCategoryName] = useState('');
    const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
    const [editValue, setEditValue] = useState('');

    const boardData = useMemo(() => {
        const uncategorized = pages.filter(p => !p.category_id);
        const grouped = categories.map(cat => ({
            ...cat,
            pages: pages.filter(p => p.category_id === cat.id)
        }));

        return [
            { id: 'uncategorized', name: 'ยังไม่ได้จัดหมวดหมู่', pages: uncategorized, color: '#94a3b8' },
            ...grouped
        ];
    }, [pages, categories]);

    const handleAddCategory = async () => {
        if (!newCategoryName.trim()) return;
        try {
            await addCategory({
                name: newCategoryName.trim(),
                sort_order: categories.length + 1
            });
            setNewCategoryName('');
            showNotification('เพิ่มหมวดหมู่สำเร็จ', 'success');
        } catch (error: any) {
            showNotification(error.message, 'error');
        }
    };

    const handleMovePage = async (pageId: string, categoryId: string | null) => {
        try {
            await updatePage(pageId, { category_id: categoryId || undefined });
            showNotification('ย้ายเพจสำเร็จ', 'success');
        } catch (error: any) {
            showNotification(error.message, 'error');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4 items-end bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex-1">
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">ชื่อหมวดหมู่ใหม่</label>
                    <input
                        type="text"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        placeholder="เช่น สายขาว, สายเทา, ยิงแอด..."
                        className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                        onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
                    />
                </div>
                <button
                    onClick={handleAddCategory}
                    className="bg-slate-900 text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-slate-800 transition-colors h-[42px] flex items-center gap-2"
                >
                    <Plus size={18} /> เพิ่มหมวดหมู่
                </button>
            </div>

            <div className="flex gap-6 overflow-x-auto pb-6 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
                {boardData.map((column) => (
                    <div
                        key={column.id}
                        className="flex-shrink-0 w-80 flex flex-col gap-4"
                    >
                        <div className="flex justify-between items-center px-2">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: column.color || '#3b82f6' }}></div>
                                <h3 className="font-bold text-slate-700">{column.name}</h3>
                                <span className="text-xs text-slate-400 font-medium bg-slate-100 px-2 py-0.5 rounded-full">{column.pages.length}</span>
                            </div>
                            {column.id !== 'uncategorized' && (
                                <div className="flex items-center gap-1">
                                    <button 
                                        onClick={() => removeCategory(column.id)}
                                        className="text-slate-400 hover:text-rose-500 p-1.5 hover:bg-rose-50 rounded-lg transition-colors"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            )}
                        </div>

                        <div 
                            className={`flex flex-col gap-3 p-3 rounded-2xl min-h-[500px] transition-colors ${column.id === 'uncategorized' ? 'bg-slate-100/50' : 'bg-slate-50 border border-slate-200/60'}`}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => {
                                e.preventDefault();
                                const pageId = e.dataTransfer.getData('pageId');
                                handleMovePage(pageId, column.id === 'uncategorized' ? null : column.id);
                            }}
                        >
                            {column.pages.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-40 border-2 border-dashed border-slate-200 rounded-xl text-slate-300">
                                    <p className="text-xs font-medium">ลากเพจมาวางที่นี่</p>
                                </div>
                            ) : (
                                column.pages.map((page) => (
                                    <div
                                        key={page.id}
                                        draggable
                                        onDragStart={(e) => e.dataTransfer.setData('pageId', page.id)}
                                        className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-200 transition-all cursor-grab active:cursor-grabbing group"
                                    >
                                        <div className="flex justify-between items-start gap-2 mb-2">
                                            <h4 className="text-sm font-bold text-slate-800 line-clamp-2">{page.name}</h4>
                                            <GripVertical size={14} className="text-slate-300 group-hover:text-slate-400" />
                                        </div>
                                        <div className="flex flex-wrap gap-1.5 mt-2">
                                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 font-bold border border-blue-100">
                                                {page.page_type}
                                            </span>
                                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${getStatusColor(page.status)}`}>
                                                {page.status}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

import { getStatusColor } from '@/lib/utils';
