'use client';
import { ReactNode, useEffect } from 'react';
import { UserCircle2, LayoutDashboard, Users2, ShieldCheck, Briefcase, ChevronRight, Home, LogOut, Layout, Settings, LayoutGrid } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

interface MainLayoutProps {
    children: ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
    const currentRole = useAppStore((state) => state.currentRole);
    const currentUser = useAppStore((state) => state.currentUser);
    const setCurrentUser = useAppStore((state) => state.setCurrentUser);
    const setCurrentRole = useAppStore((state) => state.setCurrentRole);
    const fetchWorkspaceData = useAppStore((state) => state.fetchWorkspaceData);
    const fetchEmployees = useAppStore((state) => state.fetchEmployees);
    const selectedStaffId = useAppStore((state) => state.selectedStaffId);
    const setSelectedStaffId = useAppStore((state) => state.setSelectedStaffId);
    const employees = useAppStore((state) => state.employees);
    const pathname = usePathname();

    useEffect(() => {
        const init = async () => {
            try {
                const supabase = createClient();
                if (!supabase) return;
                
                const { data: { user }, error: authError } = await supabase.auth.getUser();
                
                if (authError) throw authError;

                if (user && !currentUser) {
                    // Fetch role from employee record
                    const { data: employeeData, error: empError } = await supabase
                        .from('employees')
                        .select('*, roles(name)')
                        .eq('id', user.id)
                        .single();

                    if (empError && empError.code !== 'PGRST116') { // PGRST116 is 'no rows'
                        console.error('Error fetching employee roles:', empError);
                    }

                    let userRole = 'staff';
                    if (employeeData && employeeData.roles && employeeData.roles.name) {
                         userRole = employeeData.roles.name.toLowerCase().replace(' ', '_');
                    }

                    const newRole = user.app_metadata?.role || userRole;
                    
                    setCurrentUser({
                        id: user.id,
                        email: user.email || '',
                        role: newRole,
                        full_name: employeeData?.first_name ? `${employeeData.first_name} ${employeeData.last_name || ''}`.trim() : null
                    });
                    setCurrentRole(newRole);
                    
                    // Fetch employees if user has oversight roles (use newRole here)
                    if (['super_admin', 'admin', 'manager'].includes(newRole)) {
                        await fetchEmployees();
                    }
                } else if (currentUser) {
                    // If user already exists, still check for oversight
                    if (['super_admin', 'admin', 'manager'].includes(currentUser.role)) {
                        await fetchEmployees();
                    }
                }

                // Call remote data fetch on mount
                await fetchWorkspaceData();
            } catch (error) {
                console.error('Error in MainLayout initialization:', error);
            }
        };
        init();
    }, [currentUser, setCurrentUser, setCurrentRole, fetchWorkspaceData, fetchEmployees]);

    // Update viewMode based on route
    useEffect(() => {
        const isManagement = pathname.includes('/admin/') || 
                            pathname.includes('/employees') || 
                            pathname.includes('/tokens');
        
        const newMode = isManagement ? 'management' : 'personal';
        if (useAppStore.getState().viewMode !== newMode) {
            useAppStore.getState().setViewMode(newMode);
        }
    }, [pathname]);

    const roles = [
        { id: 'super_admin', label: 'Super Admin', color: 'bg-indigo-600 text-white border-indigo-500' },
        { id: 'admin', label: 'Admin', color: 'bg-rose-600 text-white border-rose-500' },
        { id: 'manager', label: 'Manager', color: 'bg-amber-500 text-white border-amber-400' },
        { id: 'staff', label: 'Staff', color: 'bg-emerald-500 text-white border-emerald-400' },
    ];

    const currentRoleConfig = roles.find(r => r.id === currentRole) || roles[3];

    type NavGroup = {
        title: string;
        items: { label: string; href: string; icon: any; roles: string[] }[];
        requiredRoles: string[]; // Group only visible if user has one of these roles
    };

    const navGroups: NavGroup[] = [
        {
            title: 'My Workspace',
            requiredRoles: ['super_admin', 'admin', 'manager', 'staff'],
            items: [
                { label: 'Overview', href: '/dashboard', icon: Layout, roles: ['super_admin', 'admin', 'manager', 'staff'] },
                { label: 'My Accounts', href: '/my-accounts', icon: LayoutDashboard, roles: ['super_admin', 'admin', 'manager', 'staff'] },
                { label: 'My Pages', href: '/my-pages', icon: Briefcase, roles: ['super_admin', 'admin', 'manager', 'staff'] },
                { label: 'Personal Settings', href: '/settings', icon: Settings, roles: ['super_admin', 'admin', 'manager', 'staff'] },
            ]
        },
        {
            title: 'Administration',
            requiredRoles: ['super_admin', 'admin', 'manager'],
            items: [
                { label: 'Oversight Accounts', href: '/admin/accounts', icon: Users2, roles: ['super_admin', 'admin', 'manager'] },
                { label: 'Oversight Pages', href: '/admin/pages', icon: Briefcase, roles: ['super_admin', 'admin', 'manager'] },
                { label: 'Page Groups', href: '/admin/kanban', icon: LayoutGrid, roles: ['super_admin', 'admin', 'manager'] },
            ]
        },
        {
            title: 'System & HR',
            requiredRoles: ['super_admin', 'admin'],
            items: [
                { label: 'Employee Hub', href: '/admin/employees', icon: Users2, roles: ['super_admin', 'admin'] },
                { label: 'Token Manager', href: '/admin/tokens', icon: ShieldCheck, roles: ['super_admin', 'admin'] },
                { label: 'Payroll Center', href: '/payroll', icon: ShieldCheck, roles: ['super_admin'] },
            ]
        }
    ];

    const handleLogout = async () => {
        if (!confirm('ยืนยันการออกจากระบบ?')) return;
        const { createClient } = await import('@/lib/supabase/client');
        const supabase = createClient();
        await supabase.auth.signOut();
        useAppStore.getState().logout();
        window.location.href = '/login';
    };

    return (
        <div className="flex min-h-screen bg-slate-50 font-sans lg:flex-row flex-col">
            
            {/* Mobile Header (Hidden on LG+) */}
            <header className="lg:hidden bg-blue-700 text-white sticky top-0 z-50 shadow-md h-16 flex items-center justify-between px-4">
                <Link href="/" className="flex items-center gap-2">
                    <svg viewBox="0 0 24 24" className="w-[24px] h-[24px] fill-white" aria-label="Facebook Logo">
                        <path d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.989C18.343 21.129 22 16.99 22 12c0-5.523-4.477-10-10-10z" />
                    </svg>
                    <span className="font-heading font-bold text-lg tracking-wide">Meta View</span>
                </Link>
                {/* Mobile menu toggle could go here, for now it relies on users scrolling down or using a drawer */}
                <div className="flex items-center gap-2">
                     <span className={`text-[10px] font-bold px-2 py-1 rounded border ${currentRoleConfig.color} uppercase tracking-wider`}>
                        {currentRoleConfig.label}
                    </span>
                    <button onClick={handleLogout} className="p-2 hover:bg-rose-500/20 rounded-lg text-rose-200 transition">
                        <LogOut size={18} />
                    </button>
                </div>
            </header>

            {/* Main Content Area (Left side) */}
            <main className="flex-1 w-full p-4 md:p-6 lg:p-8 overflow-y-auto">
                {children}
            </main>

            {/* Right Sidebar (Navigation & Profile) space-y-6 */}
            <aside className="w-full lg:w-[280px] xl:w-[320px] bg-slate-900 text-slate-300 lg:min-h-screen flex-shrink-0 flex flex-col border-l border-slate-800 shadow-2xl relative order-last lg:order-none z-40 pb-10 lg:pb-0">
                
                {/* Brand & Fixed Header (Desktop) */}
                <div className="hidden lg:flex items-center gap-3 px-6 h-20 border-b border-slate-800/50 flex-shrink-0 bg-slate-900/95 sticky top-0 z-10 backdrop-blur-md">
                   <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-inner shadow-blue-400/20">
                        <svg viewBox="0 0 24 24" className="w-[22px] h-[22px] fill-white" aria-label="Facebook Logo">
                            <path d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.989C18.343 21.129 22 16.99 22 12c0-5.523-4.477-10-10-10z" />
                        </svg>
                   </div>
                   <div>
                       <h1 className="font-heading font-black text-xl text-white tracking-wide leading-none">Meta View</h1>
                       <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest mt-1">Enterprise HR</p>
                   </div>
                </div>

                {/* User Profile Card */}
                <div className="px-6 py-6 border-b border-slate-800/50 bg-slate-800/20">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 rounded-full bg-slate-700 flex items-center justify-center border-2 border-slate-600 overflow-hidden shadow-md">
                            <UserCircle2 size={32} className="text-slate-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h2 className="text-sm font-bold text-white truncate" title={(currentUser as any)?.full_name || currentUser?.email}>
                                {(currentUser as any)?.full_name || currentUser?.email?.split('@')[0] || 'User Profile'}
                            </h2>
                            <p className="text-[11px] text-slate-400 truncate">{currentUser?.email || 'No email'}</p>
                        </div>
                    </div>
                    
                    {/* Strict Role Badge */}
                    <div className="flex items-center justify-between bg-slate-800 p-2.5 rounded-xl border border-slate-700/50">
                        <span className="text-xs font-semibold text-slate-400">Current Role:</span>
                        <span className={`text-[10px] font-black px-2.5 py-1 rounded-md border ${currentRoleConfig.color} uppercase tracking-widest shadow-sm`}>
                            {currentRoleConfig.label}
                        </span>
                    </div>


                </div>

                {/* Global Staff Filter Form (Visible if they have oversight rights) */}
                {['super_admin', 'admin', 'manager'].includes(currentRole) && (
                    <div className="px-6 py-5 border-b border-slate-800/50">
                        <div className="flex items-center gap-2 mb-2 text-slate-400">
                            <Users2 size={14} />
                            <span className="text-[11px] font-bold uppercase tracking-wider">Global Filter (Oversight)</span>
                        </div>
                        <select 
                            value={selectedStaffId}
                            onChange={(e) => setSelectedStaffId(e.target.value)}
                            className="w-full bg-slate-800 text-sm font-bold text-white outline-none cursor-pointer border border-slate-700/50 rounded-xl px-3 py-2.5 focus:border-blue-500 transition-colors appearance-none"
                            style={{ backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%2394a3b8%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right .7rem top 50%', backgroundSize: '.65rem auto' }}
                        >
                            <option value="all">Everyone in Hub</option>
                            {employees.map(emp => (
                                <option key={emp.id} value={emp.id}>{emp.full_name}</option>
                            ))}
                        </select>
                    </div>
                )}

                {/* Vertical Navigation Matrix */}
                <nav className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-6">
                    {navGroups.map((group) => {
                        // Bulletproof Check: Entire group is hidden if role doesn't match
                        if (!group.requiredRoles.includes(currentRole)) return null;

                        // Filter items within the group
                        const visibleItems = group.items.filter(item => item.roles.includes(currentRole));
                        if (visibleItems.length === 0) return null;

                        return (
                            <div key={group.title} className="mb-2">
                                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-3 mb-2 flex items-center gap-2">
                                    {group.title}
                                    <div className="h-px bg-slate-700/50 flex-1 ml-1"></div>
                                </h3>
                                <div className="space-y-1">
                                    {visibleItems.map(item => {
                                        const isActive = pathname === item.href;
                                        return (
                                            <Link
                                                key={item.href}
                                                href={item.href}
                                                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group relative overflow-hidden ${
                                                    isActive 
                                                    ? 'bg-blue-600 text-white shadow-md shadow-blue-900/20' 
                                                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                                                }`}
                                            >
                                                {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-white rounded-r-full"></div>}
                                                <item.icon size={18} className={isActive ? 'text-white' : 'text-slate-500 group-hover:text-slate-300 transition-colors'} />
                                                <span className={`text-sm font-semibold tracking-wide ${isActive ? 'text-white' : ''}`}>{item.label}</span>
                                                {isActive && <ChevronRight size={14} className="ml-auto opacity-50" />}
                                            </Link>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </nav>

                {/* Bottom Logout Area */}
                <div className="p-4 border-t border-slate-800/50 bg-slate-900 mt-auto">
                     <button 
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-800 hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 rounded-xl transition-colors border border-slate-700/50 hover:border-rose-500/30 text-sm font-bold group"
                    >
                        <LogOut size={16} className="group-hover:animate-pulse" />
                        Sign Out System
                    </button>
                </div>
            </aside>
        </div>
    );
}
