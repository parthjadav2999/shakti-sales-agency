import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useData } from '../context/DataContext';
import {
    LayoutDashboard,
    Users,
    Package,
    FileText,
    Settings,
    PlusCircle,
    LogOut,
    Bell,
    Search,
    Menu,
    X
} from 'lucide-react';

const Layout = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const navigate = useNavigate();
    const location = useLocation();

    const { invoices, customers } = useData();
    const [searchQuery, setSearchQuery] = useState('');

    // Search Logic
    const searchResults = React.useMemo(() => {
        if (!searchQuery.trim()) return { invoices: [], customers: [] };

        const query = searchQuery.toLowerCase();

        const matchingInvoices = invoices.filter(inv =>
            inv.id?.toString().includes(query) ||
            inv.customer?.toLowerCase().includes(query)
        ).slice(0, 5);

        const matchingCustomers = customers.filter(cust =>
            cust.name?.toLowerCase().includes(query) ||
            cust.mobile?.includes(query)
        ).slice(0, 5);

        return { invoices: matchingInvoices, customers: matchingCustomers };
    }, [searchQuery, invoices, customers]);

    const navItems = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
        { icon: FileText, label: 'Bills', path: '/invoices' },
        { icon: Users, label: 'Customers', path: '/customers' },
        { icon: Package, label: 'Products', path: '/products' },
    ];

    return (
        <div className="flex h-screen overflow-hidden bg-[#F8FAFC]">
            {/* Sidebar - Corporate Professional Design */}
            <aside
                className={`${isSidebarOpen ? 'w-72' : 'w-24'
                    } transition-all duration-300 ease-in-out bg-slate-950 border-r border-slate-800 flex flex-col h-full shadow-2xl z-20`}
            >
                {/* Brand Header - High Impact & Vibrant */}
                <div className="h-24 flex items-center px-6 border-b border-slate-800/50 bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-900/20">
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <div className="absolute inset-0 bg-indigo-500 blur-md opacity-20 rounded-full"></div>
                            <div className="relative w-11 h-11 bg-gradient-to-br from-indigo-500 via-indigo-600 to-violet-700 rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-indigo-500/30 ring-1 ring-white/10 group-hover:scale-105 transition-transform duration-300">
                                <FileText size={24} className="text-white fill-white/10" />
                            </div>
                        </div>
                        {isSidebarOpen && (
                            <div className="flex flex-col justify-center">
                                <span className="font-outfit font-extrabold text-2xl text-transparent bg-clip-text bg-gradient-to-r from-white to-indigo-300 tracking-tight drop-shadow-sm">
                                    SHAKTI
                                </span>
                                <span className="text-[11px] font-bold text-indigo-400 tracking-[0.25em] uppercase pl-0.5">BILLING SUITE</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Navigation Links */}
                <nav className="flex-1 px-4 py-8 space-y-2 overflow-y-auto custom-scrollbar">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) => `
                                relative group flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-200 border border-transparent
                                ${isActive
                                    ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20 shadow-sm'
                                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                                }
                            `}
                        >
                            {({ isActive }) => (
                                <>
                                    <item.icon
                                        size={22}
                                        className={`shrink-0 transition-transform duration-300 ${!isSidebarOpen && 'mx-auto'}`}
                                        strokeWidth={2}
                                    />
                                    {isSidebarOpen && (
                                        <span className="font-medium tracking-wide text-sm">{item.label}</span>
                                    )}

                                    {/* Active Indicator - Subtle Left Line */}
                                    {isActive && isSidebarOpen && (
                                        <div className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1 bg-indigo-500 rounded-r-full" />
                                    )}
                                </>
                            )}
                        </NavLink>
                    ))}
                </nav>

                {/* Standalone HTML Sync Link & Reset Button */}
                {isSidebarOpen ? (
                    <div className="px-6 mb-4 flex flex-col gap-2">
                        <a
                            href="/shakti_sales_agency.html"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-500/20 text-xs uppercase tracking-wider flex items-center justify-center gap-2 ring-1 ring-white/10 text-center"
                        >
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-300"></span>
                            </span>
                            Standalone HTML App
                        </a>
                        <button
                            onClick={() => {
                                if (window.confirm('This will RESET your entire local database and load the imported historical snack products and Indian customers. Proceed?')) {
                                    localStorage.removeItem('products');
                                    localStorage.removeItem('customers');
                                    localStorage.removeItem('invoices');
                                    window.location.reload();
                                }
                            }}
                            className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 font-semibold rounded-xl transition-all text-[11px] uppercase tracking-wider flex items-center justify-center gap-2 ring-1 ring-slate-800"
                        >
                            Reset & Load Defaults
                        </button>
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-2 mb-4 px-2">
                        <a
                            href="/shakti_sales_agency.html"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-12 h-12 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20 ring-1 ring-white/10 relative transition-all"
                            title="Open Standalone Offline HTML App"
                        >
                            <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-300"></span>
                            </span>
                            <FileText size={20} />
                        </a>
                    </div>
                )}

                {/* User Profile Card */}
                <div className="p-4 border-t border-slate-800/50">
                    <div className={`
                        relative overflow-hidden rounded-xl bg-slate-900/50 border border-slate-800 p-4 transition-all duration-300
                        ${isSidebarOpen ? 'hover:bg-slate-900 border-slate-700' : 'bg-transparent border-0 p-0 flex justify-center'}
                    `}>
                        <div className="flex items-center gap-4">
                            <div className="relative shrink-0">
                                <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-indigo-400 font-bold text-sm ring-1 ring-slate-700">
                                    AM
                                </div>
                                <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-slate-900"></div>
                            </div>

                            {isSidebarOpen && (
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-slate-200 truncate">Admin User</p>
                                    <p className="text-xs text-slate-500 truncate">admin@shakti.com</p>
                                </div>
                            )}

                            {isSidebarOpen && (
                                <button className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-400/10 rounded-lg transition-colors" title="Sign Out">
                                    <LogOut size={18} />
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col overflow-hidden">
                {/* Topbar */}
                <header className="h-20 border-b border-slate-200 bg-white flex items-center justify-between px-8 shrink-0">
                    <button
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-600"
                    >
                        {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>

                    <div className={`flex-1 max-w-md mx-8 relative ${location.pathname !== '/' ? 'hidden' : ''}`}>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                type="text"
                                placeholder="Search bills, customers..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-slate-100 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all outline-none text-slate-700"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                                >
                                    <X size={14} />
                                </button>
                            )}
                        </div>

                        {/* Search Dropdown */}
                        {searchQuery && (searchResults.invoices.length > 0 || searchResults.customers.length > 0) && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl shadow-slate-200 border border-slate-100 overflow-hidden z-50 max-h-96 overflow-y-auto">
                                {searchResults.invoices.length > 0 && (
                                    <div className="p-2">
                                        <p className="px-3 py-1 text-xs font-bold text-slate-400 uppercase tracking-wider">Invoices</p>
                                        {searchResults.invoices.map(inv => (
                                            <div
                                                key={inv.id}
                                                onClick={() => {
                                                    navigate('/invoices');
                                                    setSearchQuery('');
                                                }}
                                                className="px-3 py-2 hover:bg-slate-50 rounded-xl cursor-pointer flex items-center justify-between group transition-colors"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-xs group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                                        #{inv.id}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-slate-900">{inv.customer || 'Cash Sale'}</p>
                                                        <p className="text-xs text-slate-500">{inv.date}</p>
                                                    </div>
                                                </div>
                                                <span className="text-sm font-bold text-slate-900">₹{inv.total?.toLocaleString('en-IN')}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {searchResults.invoices.length > 0 && searchResults.customers.length > 0 && (
                                    <div className="h-px bg-slate-100 my-1 mx-2"></div>
                                )}

                                {searchResults.customers.length > 0 && (
                                    <div className="p-2">
                                        <p className="px-3 py-1 text-xs font-bold text-slate-400 uppercase tracking-wider">Customers</p>
                                        {searchResults.customers.map(cust => (
                                            <div
                                                key={cust.id}
                                                onClick={() => {
                                                    navigate('/customers');
                                                    setSearchQuery('');
                                                }}
                                                className="px-3 py-2 hover:bg-slate-50 rounded-xl cursor-pointer flex items-center gap-3 group transition-colors"
                                            >
                                                <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                                                    <Users size={16} />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-slate-900">{cust.name}</p>
                                                    <p className="text-xs text-slate-500">{cust.mobile}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {searchQuery && searchResults.invoices.length === 0 && searchResults.customers.length === 0 && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl shadow-slate-200 border border-slate-100 p-4 text-center z-50">
                                <p className="text-slate-500 text-sm">No results found for "{searchQuery}"</p>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => alert("No new notifications")}
                            className="p-3 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all relative"
                            title="Notifications"
                        >
                            <Bell size={24} />
                            <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white"></span>
                        </button>
                    </div>
                </header>

                {/* Content Area */}
                <div className="flex-1 overflow-auto p-8">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default Layout;
