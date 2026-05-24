import React, { useMemo } from 'react';
import { useData } from '../context/DataContext';
import { useNavigate } from 'react-router-dom';
import {
    Users, FileText, IndianRupee, Package, ArrowUpRight,
    TrendingUp, CheckCircle2, Clock, AlertCircle, ChevronRight, Wallet, Plus, ArrowRight, LayoutGrid
} from 'lucide-react';

const Dashboard = () => {
    const { products, customers, invoices } = useData();
    const navigate = useNavigate();

    // Computed stats
    const stats = useMemo(() => {
        const totalRevenue = invoices.reduce((acc, inv) => acc + (inv.total || 0), 0);
        const totalReceived = invoices.reduce((acc, inv) => acc + (inv.paidAmount || 0), 0);
        const totalOutstanding = totalRevenue - totalReceived;
        const pendingCount = invoices.filter(inv => inv.status === 'Pending').length;
        const partialCount = invoices.filter(inv => inv.status === 'Partial').length;
        const paidCount = invoices.filter(inv => inv.status === 'Paid').length;

        // Top customers by revenue
        const customerMap = {};
        invoices.forEach(inv => {
            const name = inv.customer || 'Cash';
            if (!customerMap[name]) customerMap[name] = { name, total: 0, bills: 0 };
            customerMap[name].total += (inv.total || 0);
            customerMap[name].bills += 1;
        });
        const topCustomers = Object.values(customerMap).sort((a, b) => b.total - a.total).slice(0, 5);

        return { totalRevenue, totalReceived, totalOutstanding, pendingCount, partialCount, paidCount, topCustomers };
    }, [invoices]);

    const recentInvoices = invoices.slice(0, 6);

    const getStatusStyle = (status) => {
        switch (status) {
            case 'Paid': return 'bg-emerald-100 text-emerald-700';
            case 'Partial': return 'bg-blue-100 text-blue-700';
            case 'Pending': return 'bg-amber-100 text-amber-700';
            default: return 'bg-slate-100 text-slate-700';
        }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            {/* Header with Gradient Background */}
            {/* Premium Header Design - Dark Professional Theme */}
            <div className="relative overflow-hidden rounded-3xl bg-slate-900 p-6 shadow-xl shadow-slate-900/20 -mt-2 mb-6 group">
                <div className="absolute inset-0 bg-gradient-to-r from-slate-900 to-indigo-900 opacity-90"></div>

                {/* Decorative Background Shapes */}
                <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-indigo-500 opacity-[0.1] blur-3xl group-hover:opacity-[0.15] transition-opacity duration-700"></div>
                <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 rounded-full bg-indigo-500 opacity-[0.05] blur-3xl group-hover:opacity-[0.1] transition-opacity duration-700"></div>

                {/* Grid Pattern Overlay */}
                <div className="absolute inset-0 opacity-[0.05]"
                    style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='1' fill-rule='evenodd'%3E%3Ccircle cx='3' cy='3' r='1'/%3E%3Ccircle cx='13' cy='13' r='1'/%3E%3C/g%3E%3C/svg%3E")` }}>
                </div>

                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                        <h1 className="text-3xl font-black text-white tracking-tight leading-none drop-shadow-md font-outfit">
                            Dashboard
                        </h1>
                        <p className="text-slate-400 text-sm font-medium opacity-90 max-w-lg">
                            Welcome back! Here's your business overview.
                        </p>
                    </div>

                    <div>
                        <button
                            onClick={() => navigate('/invoices/new')}
                            className="group/btn relative overflow-hidden bg-white text-slate-900 px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-black/20 hover:shadow-xl hover:shadow-black/30 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 flex items-center gap-2"
                        >
                            <div className="absolute inset-0 bg-indigo-50 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300"></div>
                            <div className="relative flex items-center gap-2">
                                <Plus size={18} strokeWidth={3} className="text-indigo-600" />
                                <span className="tracking-wide text-slate-900">New Invoice</span>
                            </div>
                        </button>
                    </div>
                </div>
            </div>

            {/* Key Metrics Row */}
            {/* Key Metrics Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl shadow-slate-100/50 hover:shadow-2xl hover:scale-[1.02] transition-all cursor-pointer group relative overflow-hidden" onClick={() => navigate('/invoices')}>
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <IndianRupee size={80} className="text-indigo-600" />
                    </div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors shadow-sm">
                                <IndianRupee size={20} />
                            </div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Sales</p>
                        </div>
                        <h3 className="text-3xl font-black text-slate-900">₹{stats.totalRevenue.toLocaleString('en-IN')}</h3>
                        <p className="text-xs text-slate-400 mt-2 font-bold bg-slate-50 inline-block px-2 py-1 rounded-lg">{invoices.length} Invoices Generated</p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl shadow-slate-100/50 hover:shadow-2xl hover:scale-[1.02] transition-all cursor-pointer group relative overflow-hidden" onClick={() => navigate('/invoices')}>
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Wallet size={80} className="text-emerald-600" />
                    </div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors shadow-sm">
                                <Wallet size={20} />
                            </div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Received</p>
                        </div>
                        <h3 className="text-3xl font-black text-emerald-600">₹{stats.totalReceived.toLocaleString('en-IN')}</h3>
                        <div className="mt-2 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg inline-block">
                            {stats.paidCount} Fully Paid
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl shadow-slate-100/50 hover:shadow-2xl hover:scale-[1.02] transition-all cursor-pointer group relative overflow-hidden" onClick={() => navigate('/invoices')}>
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <AlertCircle size={80} className="text-rose-600" />
                    </div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-600 group-hover:bg-rose-600 group-hover:text-white transition-colors shadow-sm">
                                <AlertCircle size={20} />
                            </div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Pending</p>
                        </div>
                        <h3 className="text-3xl font-black text-rose-600">₹{stats.totalOutstanding.toLocaleString('en-IN')}</h3>
                        <div className="flex gap-2 mt-2">
                            <span className="text-[10px] font-bold bg-amber-50 text-amber-600 px-2 py-1 rounded-lg">{stats.pendingCount} Unpaid</span>
                            <span className="text-[10px] font-bold bg-blue-50 text-blue-600 px-2 py-1 rounded-lg">{stats.partialCount} Partial</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Split */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Recent Bills Column */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between px-2">
                        <h3 className="text-lg font-bold text-slate-900 tracking-tight">Recent Invoices</h3>
                        <button onClick={() => navigate('/invoices')} className="text-sm font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 px-3 py-1.5 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors">
                            View All <ArrowRight size={14} />
                        </button>
                    </div>

                    <div className="bg-white rounded-[24px] border border-slate-100 shadow-xl shadow-slate-100/50 overflow-hidden">
                        {recentInvoices.length === 0 ? (
                            <div className="p-12 text-center flex flex-col items-center">
                                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-4">
                                    <FileText size={32} />
                                </div>
                                <h4 className="text-slate-900 font-bold">No invoices yet</h4>
                                <p className="text-slate-500 text-sm mt-1">Create your first invoice to get started.</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-50">
                                {recentInvoices.map((inv, i) => (
                                    <div key={i} className="flex items-center justify-between p-5 hover:bg-slate-50 transition-all cursor-pointer group" onClick={() => navigate('/invoices')}>
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-xs font-black text-indigo-600 group-hover:scale-110 transition-transform shadow-sm">
                                                #{inv.id}
                                            </div>
                                            <div>
                                                <p className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{inv.customer || 'Cash Sale'}</p>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <Clock size={12} className="text-slate-400" />
                                                    <p className="text-xs text-slate-400 font-medium">{inv.date}</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-base font-black text-slate-900">₹{inv.total.toLocaleString('en-IN')}</p>
                                            <span className={`inline-flex px-2.5 py-1 text-[10px] font-bold rounded-lg mt-1 uppercase tracking-wider ${getStatusStyle(inv.status)}`}>
                                                {inv.status}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column */}
                <div className="space-y-8">
                    {/* Quick Actions */}
                    <div className="space-y-6">
                        <h3 className="text-lg font-bold text-slate-900 tracking-tight px-2">Quick Actions</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <button onClick={() => navigate('/products', { state: { openAddModal: true } })} className="p-5 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-2xl shadow-lg shadow-cyan-200 hover:shadow-xl hover:scale-105 transition-all text-left group relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-3 opacity-20">
                                    <Package size={60} className="text-white" />
                                </div>
                                <div className="relative z-10 text-white">
                                    <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-3">
                                        <Plus size={24} />
                                    </div>
                                    <p className="text-sm font-bold opacity-90">Add New</p>
                                    <p className="text-lg font-black leading-none">Product</p>
                                </div>
                            </button>
                            <button onClick={() => navigate('/customers', { state: { openAddModal: true } })} className="p-5 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl shadow-lg shadow-purple-200 hover:shadow-xl hover:scale-105 transition-all text-left group relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-3 opacity-20">
                                    <Users size={60} className="text-white" />
                                </div>
                                <div className="relative z-10 text-white">
                                    <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-3">
                                        <Plus size={24} />
                                    </div>
                                    <p className="text-sm font-bold opacity-90">Add New</p>
                                    <p className="text-lg font-black leading-none">Customer</p>
                                </div>
                            </button>
                        </div>
                    </div>

                    {/* Top Customers */}
                    <div className="space-y-6">
                        <div className="flex items-center justify-between px-2">
                            <h3 className="text-lg font-bold text-slate-900 tracking-tight">Top Customers</h3>
                        </div>
                        <div className="bg-white rounded-[24px] border border-slate-100 shadow-xl shadow-slate-100/50 p-6 space-y-4">
                            {stats.topCustomers.length === 0 ? (
                                <p className="text-center text-xs text-slate-400 py-4">No customer data yet.</p>
                            ) : stats.topCustomers.map((c, i) => (
                                <div key={i} className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600">
                                            {c.name.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-900 leading-none">{c.name}</p>
                                            <p className="text-[10px] text-slate-400 mt-1">{c.bills} bill{c.bills > 1 ? 's' : ''}</p>
                                        </div>
                                    </div>
                                    <p className="text-sm font-black text-slate-900">₹{c.total.toLocaleString('en-IN')}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
