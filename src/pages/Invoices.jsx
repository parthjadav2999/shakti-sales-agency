import React, { useState, useRef, useCallback } from 'react';
import { useData } from '../context/DataContext';
import { useNavigate } from 'react-router-dom';
import html2pdf from 'html2pdf.js';
import { Search, Filter, Plus, FileDown, CheckCircle2, Clock, AlertCircle, X, Printer, Trash2, Eye, Package, CheckSquare, IndianRupee, TrendingUp, Wallet, CreditCard, Banknote, Smartphone, Edit2 } from 'lucide-react';

const Invoices = () => {
    const { invoices, deleteInvoice, updateInvoice, addPayment, customers, updatePayment, deletePayment, products } = useData();
    const navigate = useNavigate();
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [selectionMode, setSelectionMode] = useState(false);
    const [statusFilter, setStatusFilter] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [showPaymentForm, setShowPaymentForm] = useState(false);
    const [paymentAmount, setPaymentAmount] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('Cash');
    const [paymentNote, setPaymentNote] = useState('');
    const [editingPayment, setEditingPayment] = useState(null);
    const longPressTimer = useRef(null);

    const startLongPress = useCallback((id) => {
        longPressTimer.current = setTimeout(() => {
            setSelectionMode(true);
            setSelectedIds(new Set([id]));
        }, 500);
    }, []);

    const cancelLongPress = useCallback(() => {
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
        }
    }, []);

    const toggleSelect = (id) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });
    };

    const toggleSelectAll = () => {
        if (selectedIds.size === filteredInvoices.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(filteredInvoices.map(inv => inv.id)));
        }
    };

    const handleBulkDelete = () => {
        if (selectedIds.size === 0) return;
        if (window.confirm(`Are you sure you want to delete ${selectedIds.size} bill(s)?`)) {
            selectedIds.forEach(id => deleteInvoice(id));
            setSelectedIds(new Set());
            setSelectionMode(false);
            setIsDetailOpen(false);
        }
    };

    const exitSelectionMode = () => {
        setSelectedIds(new Set());
        setSelectionMode(false);
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case 'Paid': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            case 'Partial': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'Pending': return 'bg-amber-100 text-amber-700 border-amber-200';
            case 'Overdue': return 'bg-rose-100 text-rose-700 border-rose-200';
            default: return 'bg-slate-100 text-slate-700 border-slate-200';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'Paid': return <CheckCircle2 size={14} />;
            case 'Partial': return <TrendingUp size={14} />;
            case 'Pending': return <Clock size={14} />;
            case 'Overdue': return <AlertCircle size={14} />;
            default: return null;
        }
    };

    const handleDelete = (id) => {
        if (window.confirm('Are you sure you want to delete this invoice?')) {
            deleteInvoice(id);
            if (selectedInvoice?.id === id) setIsDetailOpen(false);
        }
    };

    const handleRecordPayment = () => {
        const amount = parseFloat(paymentAmount);
        if (!amount || amount <= 0) {
            alert('Please enter a valid payment amount.');
            return;
        }

        const outstanding = (selectedInvoice.total || 0) - (selectedInvoice.paidAmount || 0) + (editingPayment ? editingPayment.amount : 0);
        // Small buffer for float precision issues
        if (amount > outstanding + 0.1) {
            alert(`Payment amount cannot exceed outstanding balance of ₹${outstanding.toFixed(2)}`);
            return;
        }

        const paymentData = {
            amount,
            date: new Date().toISOString().split('T')[0],
            method: paymentMethod,
            note: paymentNote
        };

        if (editingPayment) {
            updatePayment(selectedInvoice.id, editingPayment.id, paymentData);
            setEditingPayment(null);

            // Optimistically update UI
            setSelectedInvoice(prev => {
                const newPayments = prev.payments.map(p => p.id === editingPayment.id ? { ...p, ...paymentData } : p);
                const newPaid = newPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
                return {
                    ...prev,
                    payments: newPayments,
                    paidAmount: newPaid,
                    status: newPaid >= prev.total ? 'Paid' : newPaid > 0 ? 'Partial' : 'Pending'
                };
            });
        } else {
            const newPayment = { ...paymentData, id: `PAY-${Date.now()}` };
            addPayment(selectedInvoice.id, newPayment);

            // Optimistically update UI
            setSelectedInvoice(prev => {
                const newPayments = [...(prev.payments || []), newPayment];
                const newPaid = (prev.paidAmount || 0) + amount;
                return {
                    ...prev,
                    payments: newPayments,
                    paidAmount: newPaid,
                    status: newPaid >= prev.total ? 'Paid' : 'Partial'
                };
            });
        }

        setPaymentAmount('');
        setPaymentNote('');
        setPaymentMethod('Cash');
        setShowPaymentForm(false);
    };

    const handleEditPayment = (payment) => {
        setEditingPayment(payment);
        setPaymentAmount(payment.amount.toString());
        setPaymentMethod(payment.method);
        setPaymentNote(payment.note || '');
        setShowPaymentForm(true);
    };

    const handleDeletePayment = (paymentId) => {
        if (window.confirm('Are you sure you want to delete this payment?')) {
            deletePayment(selectedInvoice.id, paymentId);

            // Optimistically update UI
            setSelectedInvoice(prev => {
                const newPayments = prev.payments.filter(p => p.id !== paymentId);
                const newPaid = newPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
                return {
                    ...prev,
                    payments: newPayments,
                    paidAmount: newPaid,
                    status: newPaid >= prev.total ? 'Paid' : newPaid > 0 ? 'Partial' : 'Pending'
                };
            });
        }
    };

    const getMethodIcon = (method) => {
        switch (method) {
            case 'Cash': return <Banknote size={14} className="text-emerald-500" />;
            case 'UPI': return <Smartphone size={14} className="text-blue-500" />;
            case 'Bank': return <CreditCard size={14} className="text-purple-500" />;
            default: return <Wallet size={14} className="text-slate-400" />;
        }
    };

    // Filtering
    const filteredInvoices = invoices.filter(inv => {
        const matchesStatus = statusFilter === 'All' || inv.status === statusFilter;
        const matchesSearch = !searchQuery ||
            (inv.customer || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            String(inv.id).includes(searchQuery);
        return matchesStatus && matchesSearch;
    });

    // Summary calculations
    const totalSales = invoices.reduce((acc, inv) => acc + (inv.total || 0), 0);
    const totalReceived = invoices.reduce((acc, inv) => acc + (inv.paidAmount || 0), 0);
    const totalOutstanding = totalSales - totalReceived;

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Sales Bills</h1>
                    <p className="text-slate-500 mt-1">View and manage all your retail sales bills.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="btn btn-secondary">
                        <FileDown size={18} />
                        <span>Export</span>
                    </button>
                    <button onClick={() => navigate('/invoices/new')} className="btn btn-primary">
                        <Plus size={18} />
                        <span>New Bill</span>
                    </button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="relative overflow-hidden bg-white p-6 rounded-3xl border border-slate-100 shadow-xl shadow-indigo-100/50 group hover:scale-[1.02] transition-all duration-300">
                    <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-indigo-50 rounded-full blur-3xl opacity-50 group-hover:opacity-100 transition-opacity"></div>
                    <div className="relative flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-sm group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
                            <IndianRupee size={28} />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Total Sales</p>
                            <p className="text-3xl font-black text-slate-900 tracking-tight group-hover:text-indigo-600 transition-colors">₹{totalSales.toFixed(2)}</p>
                        </div>
                    </div>
                </div>

                <div className="relative overflow-hidden bg-white p-6 rounded-3xl border border-slate-100 shadow-xl shadow-emerald-100/50 group hover:scale-[1.02] transition-all duration-300">
                    <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-emerald-50 rounded-full blur-3xl opacity-50 group-hover:opacity-100 transition-opacity"></div>
                    <div className="relative flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-sm group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300">
                            <CheckCircle2 size={28} />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Received</p>
                            <p className="text-3xl font-black text-slate-900 tracking-tight group-hover:text-emerald-600 transition-colors">₹{totalReceived.toFixed(2)}</p>
                        </div>
                    </div>
                </div>

                <div className="relative overflow-hidden bg-white p-6 rounded-3xl border border-slate-100 shadow-xl shadow-rose-100/50 group hover:scale-[1.02] transition-all duration-300">
                    <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-rose-50 rounded-full blur-3xl opacity-50 group-hover:opacity-100 transition-opacity"></div>
                    <div className="relative flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shadow-sm group-hover:bg-rose-600 group-hover:text-white transition-all duration-300">
                            <AlertCircle size={28} />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Outstanding</p>
                            <p className="text-3xl font-black text-slate-900 tracking-tight group-hover:text-rose-600 transition-colors">₹{totalOutstanding.toFixed(2)}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="glass overflow-hidden rounded-3xl">

                {/* Bulk Action Bar */}
                {selectedIds.size > 0 && (
                    <div className="sticky top-0 z-40 bg-rose-600 text-white px-6 py-3 rounded-2xl mb-4 flex items-center justify-between shadow-lg shadow-rose-200 animate-in slide-in-from-top duration-300">
                        <div className="flex items-center gap-3">
                            <CheckSquare size={20} />
                            <span className="font-bold text-sm">{selectedIds.size} selected</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <button onClick={exitSelectionMode} className="px-4 py-1.5 bg-white/20 rounded-lg text-sm font-bold hover:bg-white/30 transition-all">
                                Cancel
                            </button>
                            <button onClick={handleBulkDelete} className="px-4 py-1.5 bg-white text-rose-600 rounded-lg text-sm font-bold hover:bg-rose-50 transition-all flex items-center gap-2">
                                <Trash2 size={16} />
                                Delete Selected
                            </button>
                        </div>
                    </div>
                )}
                <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/50">
                    <div className="relative max-w-sm w-full">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search by customer or bill no..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 bg-slate-50 rounded-2xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none transition-all"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        {['All', 'Pending', 'Partial', 'Paid'].map(status => (
                            <button
                                key={status}
                                onClick={() => setStatusFilter(status)}
                                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${statusFilter === status
                                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                    }`}
                            >
                                {status}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50">
                                {selectionMode && (
                                    <th className="px-4 py-4 w-10">
                                        <input
                                            type="checkbox"
                                            checked={filteredInvoices.length > 0 && selectedIds.size === filteredInvoices.length}
                                            onChange={toggleSelectAll}
                                            className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                        />
                                    </th>
                                )}
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Bill No.</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Customer</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Amount</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Paid</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Outstanding</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white/30">
                            {filteredInvoices.length === 0 ? (
                                <tr>
                                    <td colSpan="9" className="px-6 py-12 text-center text-slate-400 font-medium">
                                        No bills found. Create your first bill to get started!
                                    </td>
                                </tr>
                            ) : filteredInvoices.map((inv) => {
                                const outstanding = (inv.total || 0) - (inv.paidAmount || 0);
                                return (
                                    <tr
                                        key={inv?.id || Math.random()}
                                        className={`hover:bg-indigo-50/30 transition-colors group cursor-pointer ${selectedIds.has(inv?.id) ? 'bg-indigo-50/50' : ''}`}
                                        onClick={() => { if (!selectionMode) { setSelectedInvoice(inv); setIsDetailOpen(true); setShowPaymentForm(false); } else { toggleSelect(inv?.id); } }}
                                        onMouseDown={() => startLongPress(inv?.id)}
                                        onMouseUp={cancelLongPress}
                                        onMouseLeave={cancelLongPress}
                                        onTouchStart={() => startLongPress(inv?.id)}
                                        onTouchEnd={cancelLongPress}
                                    >
                                        {selectionMode && (
                                            <td className="px-4 py-4" onClick={e => e.stopPropagation()}>
                                                <input
                                                    type="checkbox"
                                                    checked={selectedIds.has(inv?.id)}
                                                    onChange={() => toggleSelect(inv?.id)}
                                                    className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                                />
                                            </td>
                                        )}
                                        <td className="px-6 py-4 text-sm font-bold text-slate-900">{inv?.id || 'NO-ID'}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-600">
                                                    {(inv?.customer || 'Guest').split(' ').map(n => n[0]).join('')}
                                                </div>
                                                <span className="text-sm font-semibold text-slate-700">{inv?.customer || 'Unknown Customer'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-600 font-medium">{inv?.date || '-'}</td>
                                        <td className="px-6 py-4 text-sm font-bold text-slate-900">₹{(inv?.total || 0).toFixed(2)}</td>
                                        <td className="px-6 py-4 text-sm font-bold text-emerald-600">₹{(inv?.paidAmount || 0).toFixed(2)}</td>
                                        <td className="px-6 py-4 text-sm font-bold text-rose-600">
                                            {outstanding > 0 ? `₹${outstanding.toFixed(2)}` : <span className="text-emerald-500">—</span>}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span
                                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${getStatusStyle(inv?.status || 'Pending')}`}
                                            >
                                                {getStatusIcon(inv?.status || 'Pending')}
                                                {inv?.status || 'Pending'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2" onClick={e => e.stopPropagation()}>
                                                <button
                                                    onClick={() => { setSelectedInvoice(inv); setIsDetailOpen(true); setShowPaymentForm(false); }}
                                                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-lg transition-all"
                                                    title="View Bill Details"
                                                >
                                                    <Eye size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(inv.id)}
                                                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-white rounded-lg transition-all"
                                                    title="Delete"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                <div className="p-6 border-t border-slate-100 bg-white/50 flex items-center justify-between">
                    <p className="text-sm text-slate-500 font-medium">Showing {filteredInvoices.length} of {invoices.length} bills</p>
                </div>
            </div>
            {/* Invoice Detail Drawer */}
            {isDetailOpen && selectedInvoice && (
                <div className="fixed inset-0 z-[100] flex items-center justify-end bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
                    <div
                        className="w-full max-w-xl h-full bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Drawer Header */}
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white">
                            <div className="flex items-center gap-3">
                                <h2 className="text-xl font-black text-slate-900">Bill #{selectedInvoice.id}</h2>
                                <span
                                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${getStatusStyle(selectedInvoice.status)}`}
                                >
                                    {getStatusIcon(selectedInvoice.status)}
                                    {selectedInvoice.status}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                                {/* Print Buttons */}
                                <button
                                    onClick={() => {
                                        const originalTitle = document.title;
                                        document.title = `Bill_${selectedInvoice.id}_${selectedInvoice.customer}`;
                                        document.body.classList.add('print-mode-standard');
                                        window.print();
                                        document.body.classList.remove('print-mode-standard');
                                        document.title = originalTitle;
                                    }}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-bold hover:bg-indigo-100 transition-all"
                                    title="Print Standard A4"
                                >
                                    <Printer size={14} />
                                    Standard
                                </button>
                                <button
                                    onClick={() => {
                                        const originalTitle = document.title;
                                        document.title = `Thermal_${selectedInvoice.id}_${selectedInvoice.customer.replace(/\s+/g, '_')}`;
                                        
                                        // Inject top-level print style for thermal paper roll sizes (standard 80mm roll)
                                        const style = document.createElement('style');
                                        style.id = 'thermal-print-page-style';
                                        style.innerHTML = `@media print { @page { size: 80mm auto; margin: 0; } }`;
                                        document.head.appendChild(style);

                                        document.body.classList.add('print-mode-thermal');
                                        setTimeout(() => {
                                            window.print();
                                            document.body.classList.remove('print-mode-thermal');
                                            const pageStyle = document.getElementById('thermal-print-page-style');
                                            if (pageStyle) pageStyle.remove();
                                            document.title = originalTitle;
                                        }, 100);
                                    }}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 text-purple-700 border border-purple-200 rounded-lg text-xs font-bold hover:bg-purple-100 transition-all"
                                    title="Print Thermal (80mm DMart Style)"
                                >
                                    <Printer size={14} />
                                    Thermal
                                </button>
                                {/* Download PDF Buttons */}
                                <button
                                    onClick={() => {
                                        const el = document.getElementById('printable-invoice');
                                        if (!el) return;
                                        el.style.display = 'block';
                                        html2pdf().set({
                                            margin: 0,
                                            filename: `Bill_${selectedInvoice.id}_${selectedInvoice.customer}.pdf`,
                                            image: { type: 'jpeg', quality: 0.98 },
                                            html2canvas: { scale: 2 },
                                            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
                                        }).from(el).save().then(() => {
                                            el.style.display = '';
                                        });
                                    }}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold hover:bg-emerald-100 transition-all"
                                    title="Download Standard PDF"
                                >
                                    <FileDown size={14} />
                                    Standard PDF
                                </button>
                                <button
                                    onClick={() => {
                                        const el = document.querySelector('.thermal-receipt');
                                        if (!el) return;
                                        el.style.display = 'block';
                                        html2pdf().set({
                                            margin: 2,
                                            filename: `Thermal_${selectedInvoice.id}_${selectedInvoice.customer}.pdf`,
                                            image: { type: 'jpeg', quality: 0.98 },
                                            html2canvas: { scale: 2 },
                                            jsPDF: { unit: 'mm', format: [80, 200], orientation: 'portrait' }
                                        }).from(el).save().then(() => {
                                            el.style.display = '';
                                        });
                                    }}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 text-orange-700 border border-orange-200 rounded-lg text-xs font-bold hover:bg-orange-100 transition-all"
                                    title="Download Thermal PDF"
                                >
                                    <FileDown size={14} />
                                    Thermal PDF
                                </button>
                                <button
                                    onClick={() => handleDelete(selectedInvoice.id)}
                                    className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                                >
                                    <Trash2 size={20} />
                                </button>
                                <button onClick={() => setIsDetailOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all">
                                    <X size={24} />
                                </button>
                            </div>
                        </div>

                        {/* Drawer Content */}
                        <div className="flex-1 overflow-y-auto p-8 space-y-6">
                            {/* Customer & Amount */}
                            <div className="flex items-start justify-between">
                                <div className="space-y-4">
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Customer</p>
                                        <h3 className="text-2xl font-bold text-slate-900">{selectedInvoice.customer}</h3>
                                        <p className="text-sm text-slate-500 font-medium">{selectedInvoice.date}</p>
                                    </div>
                                </div>
                                <div className="text-right space-y-1">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total</p>
                                    <h3 className="text-3xl font-black text-slate-900">₹{selectedInvoice.total.toFixed(2)}</h3>
                                </div>
                            </div>

                            {/* Payment Summary Cards */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                                    <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">Paid</p>
                                    <p className="text-xl font-black text-emerald-700">₹{(selectedInvoice.paidAmount || 0).toFixed(2)}</p>
                                </div>
                                <div className="bg-rose-50 border border-rose-200 rounded-xl p-4">
                                    <p className="text-[10px] font-bold text-rose-500 uppercase tracking-wider">Outstanding</p>
                                    <p className="text-xl font-black text-rose-700">₹{((selectedInvoice.total || 0) - (selectedInvoice.paidAmount || 0)).toFixed(2)}</p>
                                </div>
                            </div>

                            {/* Record Payment */}
                            {selectedInvoice.status !== 'Paid' && (
                                <div className="space-y-3">
                                    {!showPaymentForm ? (
                                        <button
                                            onClick={() => setShowPaymentForm(true)}
                                            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all shadow-md shadow-indigo-200"
                                        >
                                            <Wallet size={18} />
                                            Record Payment
                                        </button>
                                    ) : (
                                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                                            <div className="flex items-center justify-between">
                                                <h4 className="text-sm font-bold text-slate-900">{editingPayment ? 'Edit Payment' : 'Record Payment'}</h4>
                                                <button onClick={() => { setShowPaymentForm(false); setEditingPayment(null); setPaymentAmount(''); setPaymentNote(''); }} className="text-slate-400 hover:text-slate-600">
                                                    <X size={16} />
                                                </button>
                                            </div>
                                            <div>
                                                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Amount (₹)</label>
                                                <input
                                                    type="number"
                                                    value={paymentAmount}
                                                    onChange={(e) => setPaymentAmount(e.target.value)}
                                                    placeholder={`Max: ₹${((selectedInvoice.total || 0) - (selectedInvoice.paidAmount || 0)).toFixed(2)}`}
                                                    className="w-full mt-1 px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none"
                                                    autoFocus
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Method</label>
                                                <div className="flex gap-2 mt-1">
                                                    {['Cash', 'UPI', 'Bank'].map(method => (
                                                        <button
                                                            key={method}
                                                            onClick={() => setPaymentMethod(method)}
                                                            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all ${paymentMethod === method
                                                                ? 'bg-indigo-600 text-white shadow-sm'
                                                                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                                                                }`}
                                                        >
                                                            {getMethodIcon(method)}
                                                            {method}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                            <div>
                                                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Note (optional)</label>
                                                <input
                                                    type="text"
                                                    value={paymentNote}
                                                    onChange={(e) => setPaymentNote(e.target.value)}
                                                    placeholder="e.g. Cheque #1234"
                                                    className="w-full mt-1 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none"
                                                />
                                            </div>
                                            <button
                                                onClick={handleRecordPayment}
                                                className="w-full px-4 py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-bold hover:bg-emerald-700 transition-all"
                                            >
                                                {editingPayment ? 'Update Payment' : 'Save Payment'}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Payment History */}
                            {(selectedInvoice.payments || []).length > 0 && (
                                <div className="space-y-3">
                                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-widest border-b border-slate-100 pb-2">Payment History</h4>
                                    <div className="space-y-2">
                                        {(selectedInvoice.payments || []).map((p, idx) => (
                                            <div key={p.id || idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 group">
                                                <div className="flex items-center gap-3">
                                                    {getMethodIcon(p.method)}
                                                    <div>
                                                        <p className="text-sm font-bold text-slate-900">₹{p.amount.toFixed(2)}</p>
                                                        <p className="text-[10px] text-slate-400 font-medium">{p.date} • {p.method}{p.note ? ` • ${p.note}` : ''}</p>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleEditPayment(p)}
                                                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                                                        title="Edit Payment"
                                                    >
                                                        <Edit2 size={14} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeletePayment(p.id)}
                                                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                                                        title="Delete Payment"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Item List */}
                            <div className="space-y-4">
                                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-widest border-b border-slate-100 pb-2">Line Items</h4>
                                <div className="space-y-3">
                                    {(selectedInvoice.items || []).map((item, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-white rounded-xl border border-slate-200 flex items-center justify-center p-2 overflow-hidden">
                                                    {item.image ? (
                                                        <img src={item.image} alt="" className="w-full h-full object-contain" />
                                                    ) : (
                                                        <Package className="text-slate-200" size={24} />
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-slate-900">{item.description}</p>
                                                    <p className="text-xs text-slate-500 font-medium">{item.quantity} {item.unit || 'Nos.'} x ₹{item.price.toFixed(2)}</p>
                                                </div>
                                            </div>
                                            <p className="text-sm font-black text-slate-900">₹{(item.quantity * item.price).toFixed(2)}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Drawer Footer */}
                        <div className="p-8 border-t border-slate-100 bg-slate-50/50">
                            <div className="flex justify-between items-center">
                                <p className="text-sm font-bold text-slate-500 uppercase tracking-wide">Total Amount</p>
                                <p className="text-3xl font-black text-slate-900">₹{selectedInvoice.total.toFixed(2)}</p>
                            </div>
                        </div>
                        {/* HIDDEN STANDARD A4 BILL */}
                        <div className="bg-white w-[210mm] min-h-[297mm] p-[15mm] flex flex-col hidden print:block" id="printable-invoice">
                            {/* Header */}
                        <div className="flex justify-between items-start border-b border-slate-200 pb-4">
                                <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Bill of Supply</h1>
                                <div className="text-right space-y-1">
                                    <p className="text-[10px] font-bold text-slate-400">#{selectedInvoice.id}</p>
                                    <div className="text-[10px] font-bold text-slate-900">
                                        <p>DATE: {selectedInvoice.date ? selectedInvoice.date.split('-').reverse().join('/') : ''}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Billing Details */}
                            <div className="py-3 border-b border-slate-100">
                                <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Billed To</h4>
                                <h3 className="text-sm font-bold text-slate-900 mt-0.5">{selectedInvoice.customer}</h3>
                                <p className="text-[10px] text-slate-500 font-medium">{customers.find(c => c.name === selectedInvoice.customer)?.phone || ''}</p>
                            </div>

                            {/* Table */}
                            <div className="flex-1 py-2">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b-2 border-slate-900 text-[8px] font-bold text-slate-900 uppercase tracking-widest">
                                            <th className="py-2 text-left pl-2">Item</th>
                                            <th className="py-2 text-center">Qty</th>
                                            <th className="py-2 text-center">Unit</th>
                                            <th className="py-2 text-right">Rate</th>
                                            <th className="py-2 text-right pr-2">Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-[10px]">
                                        {selectedInvoice.items.map((item, idx) => (
                                            <tr key={idx} className="border-b border-slate-100">
                                                <td className="py-1.5 pl-2 font-semibold text-slate-900">
                                                    {item.description}{item.gujaratiName ? ` / ${item.gujaratiName}` : ''}
                                                </td>
                                                <td className="py-1.5 text-center">{item.quantity}</td>
                                                <td className="py-1.5 text-center">{item.unit || 'Nos.'}</td>
                                                <td className="py-1.5 text-right">₹{item.price.toFixed(2)}</td>
                                                <td className="py-1.5 text-right pr-2 font-bold">₹{(item.quantity * item.price).toFixed(2)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Totals */}
                            <div className="flex justify-end pt-2 border-t border-slate-200">
                                <div className="w-[200px] space-y-1">
                                    <div className="flex justify-between text-[10px] font-bold text-slate-600">
                                        <span>Subtotal</span>
                                        <span>₹{selectedInvoice.total.toFixed(2)}</span>
                                    </div>
                                    <div className="h-px bg-slate-200"></div>
                                    <div className="flex justify-between items-center py-1">
                                        <span className="text-[10px] font-black text-slate-900 uppercase">Grand Total</span>
                                        <span className="text-base font-black text-indigo-600">₹{selectedInvoice.total.toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-auto pt-4 border-t border-slate-100">
                                <div className="text-center space-y-0.5">
                                    <p className="text-[9px] font-bold text-slate-800">Thank you for your business!</p>
                                    <p className="text-[8px] text-slate-400 font-medium italic">Computer generated bill.</p>
                                </div>
                            </div>
                        </div>

                        {/* HIDDEN THERMAL RECEIPT (D-Mart Style) */}
                        <div className="thermal-receipt hidden print:block">
                            <div className="text-center font-black text-base uppercase tracking-tight">BILL OF SUPPLY</div>
                            <div className="thermal-dotted"></div>
                            
                            <div className="text-[9px] space-y-0.5 font-semibold">
                                <div className="flex justify-between">
                                    <span>INVOICE NO: #{selectedInvoice.id}</span>
                                    <span>DATE: {selectedInvoice.date ? selectedInvoice.date.split('-').reverse().join('/') : ''}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>OPERATOR: Admin</span>
                                    <span>TIME: {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                                <div>
                                    <span>CUSTOMER: {selectedInvoice.customer}</span>
                                </div>
                                {(() => {
                                    const c = customers.find(cust => cust.name.toLowerCase() === selectedInvoice.customer.toLowerCase());
                                    return c ? (
                                        <div className="text-[8px] leading-tight text-slate-700">
                                            {c.phone && <p>CONTACT: +91 {c.phone}</p>}
                                            {c.address && <p className="uppercase">ADDR: {c.address}</p>}
                                        </div>
                                    ) : null;
                                })()}
                            </div>
                            
                            <div className="thermal-dotted"></div>
                            <div className="text-center text-[9px] font-black uppercase py-0.5">--- retail sales invoice ---</div>
                            <div className="thermal-dotted"></div>

                            {/* Table Items */}
                            <div className="space-y-2.5 my-2">
                                {selectedInvoice.items.map((item, i) => {
                                    // Lookup product details in database to fetch Gujarati translation
                                    const matchProd = products ? products.find(p => p.name.toLowerCase() === item.description.toLowerCase()) : null;
                                    const gujName = matchProd ? matchProd.nameGujarati : '';
                                    return (
                                        <div key={i} className="text-[9px] font-semibold leading-tight">
                                            <div className="font-bold">
                                                {i + 1}. {item.description}
                                                {gujName && <span className="font-medium text-slate-700 font-sans ml-1">({gujName})</span>}
                                            </div>
                                            <div className="flex justify-between pl-3 mt-0.5">
                                                <span>{item.quantity.toFixed(2)} {item.unit || 'Nos.'}  x  ₹{item.price.toFixed(2)}</span>
                                                <span className="font-bold">₹{(item.quantity * item.price).toFixed(2)}</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            
                            <div className="thermal-dotted"></div>
                            
                            {/* Summary Totals */}
                            <div className="text-[9px] space-y-1 font-semibold">
                                <div className="flex justify-between">
                                    <span>TOTAL ITEMS: {selectedInvoice.items.length}</span>
                                    <span>TOTAL QTY: {selectedInvoice.items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>SUB TOTAL</span>
                                    <span>₹{selectedInvoice.total.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>ROUND OFF</span>
                                    <span>₹0.00</span>
                                </div>
                                <div className="thermal-dotted"></div>
                                <div className="flex justify-between font-black text-xs py-0.5 uppercase">
                                    <span>net amount</span>
                                    <span>₹{selectedInvoice.total.toFixed(2)}</span>
                                </div>
                                <div className="thermal-dotted"></div>
                                <div className="flex justify-between font-bold text-emerald-700">
                                    <span>TOTAL PAID</span>
                                    <span>₹{(selectedInvoice.paidAmount || 0).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between font-bold text-rose-700">
                                    <span>OUTSTANDING</span>
                                    <span>₹{((selectedInvoice.total || 0) - (selectedInvoice.paidAmount || 0)).toFixed(2)}</span>
                                </div>
                                {(selectedInvoice.payments || []).length > 0 && (
                                    <div className="text-[8px] pl-2 text-slate-700 space-y-0.5 mt-1 border-l-2 border-slate-200">
                                        <p className="font-bold uppercase text-[7px] text-slate-400">Ledger Payments:</p>
                                        {selectedInvoice.payments.map((p, idx) => (
                                            <p key={idx}>• {p.date} - {p.method}: ₹{p.amount.toFixed(2)}</p>
                                        ))}
                                    </div>
                                )}
                            </div>
                            
                            <div className="thermal-double-dotted"></div>
                            
                            <div className="text-center text-[9px] font-bold space-y-1">
                                <p className="uppercase leading-none tracking-tighter">*** save water, save trees ***</p>
                                <p className="uppercase tracking-wide">Thank You! visit again!</p>
                                <p className="font-sans leading-relaxed text-[10px]">આભાર! ફરી પધારો!</p>
                            </div>
                            
                            {/* Simulated Barcode */}
                            <div className="flex flex-col items-center mt-3 mb-1">
                                <div className="text-[12px] font-mono tracking-[-1px] font-light leading-none select-none text-black select-none">
                                    || | | |||| | ||| | ||| || ||| || ||| | || |||| | |||
                                </div>
                                <div className="text-[8px] font-mono mt-0.5 tracking-wider">#{selectedInvoice.id}</div>
                            </div>
                            <div className="thermal-dotted"></div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Invoices;
