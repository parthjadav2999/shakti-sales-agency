import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import html2pdf from 'html2pdf.js';
import { ArrowLeft, Save, Printer, Plus, Trash2, Search, Package, User, ChevronDown, X, Download, FileDown, ChevronRight, Check } from 'lucide-react';

const CreateInvoice = () => {
    const navigate = useNavigate();
    const { customers, products, addInvoice, getNextInvoiceId } = useData();

    const [customer, setCustomer] = useState('');
    const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
    const [items, setItems] = useState([]);
    const [subtotal, setSubtotal] = useState(0);
    const [total, setTotal] = useState(0);

    // Dropdown states
    const [customerDropdownOpen, setCustomerDropdownOpen] = useState(false);
    const [customerSearch, setCustomerSearch] = useState('');
    const customerDropdownRef = useRef(null);

    // Product search
    const [productSearch, setProductSearch] = useState('');

    // Invoice preview & print
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [createdInvoice, setCreatedInvoice] = useState(null);
    const [isInvoiceConfirmed, setIsInvoiceConfirmed] = useState(false);

    const filteredCustomers = customers.filter(c =>
        (c.name || '').toLowerCase().includes(customerSearch.toLowerCase()) ||
        (c.phone || '').includes(customerSearch)
    );

    const filteredProducts = products.filter(p =>
        (p.name || '').toLowerCase().includes(productSearch.toLowerCase()) ||
        (p.nameGujarati || '').toLowerCase().includes(productSearch.toLowerCase())
    );

    // Close dropdowns on outside click
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (customerDropdownRef.current && !customerDropdownRef.current.contains(event.target)) {
                setCustomerDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Calculate totals
    useEffect(() => {
        const newSubtotal = items.reduce((sum, item) => {
            const q = parseFloat(item.quantity) || 0;
            const p = parseFloat(item.price) || 0;
            return sum + (q * p);
        }, 0);
        setSubtotal(newSubtotal);
        setTotal(newSubtotal);
    }, [items]);

    const isProductSelected = (productId) => {
        return items.some(item => item.productId === productId);
    };

    const toggleProduct = (product) => {
        if (isProductSelected(product.id)) {
            // Remove from items
            setItems(prev => prev.filter(item => item.productId !== product.id));
        } else {
            // Add to items with qty=1
            setItems(prev => [...prev, {
                id: Date.now(),
                productId: product.id,
                description: product.name,
                gujaratiName: product.nameGujarati || '',
                quantity: 1,
                price: typeof product.salePrice === 'number' ? product.salePrice : (parseFloat(product.salePrice) || product.price || 0),
                unit: product.unit || 'Nos.',
                image: product.image || null
            }]);
        }
    };

    const updateItemQty = (productId, newQty) => {
        if (newQty === 0) {
            setItems(prev => prev.filter(item => item.productId !== productId));
            return;
        }
        setItems(prev => prev.map(item =>
            item.productId === productId ? { ...item, quantity: newQty } : item
        ));
    };

    const updateItemPrice = (productId, newPrice) => {
        setItems(prev => prev.map(item =>
            item.productId === productId ? { ...item, price: newPrice } : item
        ));
    };

    const removeItem = (productId) => {
        setItems(prev => prev.filter(item => item.productId !== productId));
    };

    const getItemQty = (productId) => {
        const item = items.find(i => i.productId === productId);
        return item ? item.quantity : 0;
    };

    const handleIssueInvoice = () => {
        if (!customer) {
            alert('Please select a customer');
            return;
        }
        if (items.length === 0) {
            alert('Please add at least one product');
            return;
        }
        if (items.some(i => !i.quantity || parseFloat(i.quantity) <= 0)) {
            alert('Please enter a valid quantity for all selected products');
            return;
        }

        const invoiceId = getNextInvoiceId();
        const newInvoice = {
            id: invoiceId,
            customer,
            date: invoiceDate,
            items: items.map(item => ({
                id: item.productId,
                description: item.description,
                gujaratiName: item.gujaratiName,
                quantity: item.quantity,
                price: item.price,
                unit: item.unit,
                image: item.image
            })),
            subtotal,
            total,
            status: 'Pending',
            paidAmount: 0,
            payments: []
        };

        // Show preview first
        setCreatedInvoice(newInvoice);
        setIsInvoiceConfirmed(false);
        setIsPreviewOpen(true);
    };

    const handleConfirmInvoice = () => {
        if (!createdInvoice) return;
        addInvoice(createdInvoice);
        setIsInvoiceConfirmed(true);
    };

    const handleThermalPrint = () => {
        const originalTitle = document.title;
        document.title = `Thermal_Bill_${createdInvoice.customer}`;
        document.body.classList.add('print-mode-thermal');
        setTimeout(() => {
            window.print();
            document.body.classList.remove('print-mode-thermal');
            document.title = originalTitle;
        }, 50);
    };

    const handleStandardPrint = () => {
        const originalTitle = document.title;
        document.title = `Standard_Bill_${createdInvoice.customer}`;
        document.body.classList.add('print-mode-standard');
        window.print();
        document.body.classList.remove('print-mode-standard');
        document.title = originalTitle;
    };

    const handleThermalPDF = () => {
        const el = document.getElementById('ci-thermal-receipt');
        if (!el) return;
        el.style.display = 'block';
        html2pdf().set({
            margin: 2,
            filename: `Thermal_${createdInvoice.id}_${createdInvoice.customer}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'mm', format: [80, 200], orientation: 'portrait' }
        }).from(el).save().then(() => {
            el.style.display = '';
        });
    };

    const handleStandardPDF = () => {
        const el = document.getElementById('ci-printable-invoice');
        if (!el) return;
        el.style.display = 'block';
        html2pdf().set({
            margin: 0,
            filename: `Bill_${createdInvoice.id}_${createdInvoice.customer}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        }).from(el).save().then(() => {
            el.style.display = '';
        });
    };

    return (
        <div className="max-w-5xl mx-auto py-8 px-4 md:px-8">
            <div className="flex items-center justify-between mb-6">
                <button
                    onClick={() => navigate('/invoices')}
                    className="flex items-center gap-2 text-gray-500 hover:text-gray-800 transition-colors"
                >
                    <ArrowLeft size={20} />
                    <span className="font-medium text-sm">Back to Invoices</span>
                </button>
            </div>

            {/* Main "Paper" Sheet */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                {/* Header Section */}
                <div className="px-8 py-6 border-b border-gray-100 bg-gray-50/30 flex justify-between items-start">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">New Invoice</h1>
                        <p className="text-gray-500 text-sm mt-1">Select products and set quantities</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleIssueInvoice}
                            className="flex items-center gap-2 px-6 py-2 bg-gray-900 text-white rounded-lg text-sm font-bold hover:bg-gray-800 transition-colors shadow-lg shadow-gray-900/10"
                        >
                            <Save size={16} />
                            Preview & Save Bill
                        </button>
                    </div>
                </div>

                {/* Form Body */}
                <div className="p-8 space-y-8">
                    {/* Customer & Date Row */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="md:col-span-2" ref={customerDropdownRef}>
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Bill To</label>
                            <div className="relative">
                                <div
                                    onClick={() => setCustomerDropdownOpen(!customerDropdownOpen)}
                                    className={`w-full px-4 py-3 bg-white border rounded-lg cursor-pointer flex items-center justify-between text-base transition-all shadow-sm hover:border-gray-400 ${customerDropdownOpen ? 'border-gray-900 ring-1 ring-gray-900' : 'border-gray-200'
                                        }`}
                                >
                                    <span className={customer ? 'text-gray-900 font-medium' : 'text-gray-400'}>
                                        {customer || 'Select a customer...'}
                                    </span>
                                    <ChevronDown size={18} className={`text-gray-400 transition-transform ${customerDropdownOpen ? 'rotate-180' : ''}`} />
                                </div>

                                {customerDropdownOpen && (
                                    <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-100 rounded-lg shadow-xl z-20 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                                        <div className="p-3 border-b border-gray-50 bg-gray-50/50">
                                            <div className="relative">
                                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                                <input
                                                    type="text"
                                                    placeholder="Search..."
                                                    value={customerSearch}
                                                    onChange={(e) => setCustomerSearch(e.target.value)}
                                                    className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-md text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
                                                    autoFocus
                                                />
                                            </div>
                                        </div>
                                        <div className="max-h-60 overflow-y-auto">
                                            {filteredCustomers.length > 0 ? (
                                                filteredCustomers.map(c => (
                                                    <div
                                                        key={c.id}
                                                        onClick={() => {
                                                            setCustomer(c.name);
                                                            setCustomerDropdownOpen(false);
                                                            setCustomerSearch('');
                                                        }}
                                                        className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors border-b border-gray-50 last:border-0 hover:bg-gray-50 ${customer === c.name ? 'bg-gray-50' : ''
                                                            }`}
                                                    >
                                                        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0 text-gray-500 font-bold text-xs">
                                                            {c.name.substring(0, 2).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-semibold text-gray-900">{c.name}</p>
                                                            {c.phone && <p className="text-xs text-gray-500">{c.phone}</p>}
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="px-4 py-6 text-center text-sm text-gray-400">No customers found</div>
                                            )}
                                        </div>
                                        {customerSearch && !filteredCustomers.some(c => c.name.toLowerCase() === customerSearch.toLowerCase()) && (
                                            <div
                                                onClick={() => {
                                                    setCustomer(customerSearch);
                                                    setCustomerDropdownOpen(false);
                                                    setCustomerSearch('');
                                                }}
                                                className="px-4 py-3 border-t border-gray-100 text-sm text-blue-600 font-medium hover:bg-blue-50 cursor-pointer flex items-center gap-2"
                                            >
                                                <Plus size={16} />
                                                Add "{customerSearch}"
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Date</label>
                            <input
                                type="date"
                                value={invoiceDate}
                                onChange={(e) => setInvoiceDate(e.target.value)}
                                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:ring-1 focus:ring-gray-900 focus:border-gray-900 outline-none transition-all text-base text-gray-900 font-medium shadow-sm hover:border-gray-400"
                            />
                        </div>
                    </div>

                    {/* Product Selection Section */}
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">Select Products</label>
                            {items.length > 0 && (
                                <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
                                    {items.length} product{items.length !== 1 ? 's' : ''} selected
                                </span>
                            )}
                        </div>

                        {/* Product Search */}
                        <div className="relative mb-4">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                            <input
                                type="text"
                                placeholder="Search products..."
                                value={productSearch}
                                onChange={(e) => setProductSearch(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none transition-all"
                            />
                        </div>

                        {/* Product Grid - Selectable Cards */}
                        <div className="border border-gray-200 rounded-xl overflow-hidden max-h-[400px] overflow-y-auto">
                            {filteredProducts.length > 0 ? (
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-0.5 bg-gray-100 p-0.5">
                                    {filteredProducts.map(product => {
                                        const selected = isProductSelected(product.id);
                                        const qty = getItemQty(product.id);
                                        return (
                                            <div
                                                key={product.id}
                                                className={`relative bg-white p-3 cursor-pointer transition-all rounded-lg ${selected ? 'ring-2 ring-indigo-500 bg-indigo-50/30' : 'hover:bg-gray-50'
                                                    }`}
                                            >
                                                {/* Checkbox area */}
                                                <div className="flex items-start gap-2 mb-2" onClick={() => toggleProduct(product)}>
                                                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${selected ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300 hover:border-gray-400'
                                                        }`}>
                                                        {selected && <Check size={14} className="text-white" />}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-bold text-gray-900 truncate">{product.name}</p>
                                                        {product.nameGujarati && (
                                                            <p className="text-xs text-gray-500 truncate">{product.nameGujarati}</p>
                                                        )}
                                                        <p className="text-xs font-bold text-indigo-600 mt-0.5">
                                                            ₹{typeof product.salePrice === 'number' ? product.salePrice.toFixed(2) : (product.salePrice || product.price)}
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Qty Controls - only shown if selected */}
                                                {selected && (
                                                    <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-100" onClick={(e) => e.stopPropagation()}>
                                                        <button
                                                            onClick={() => updateItemQty(product.id, Math.max(0, (parseFloat(qty) || 0) - 1))}
                                                            className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 font-bold transition-colors text-sm"
                                                        >
                                                            −
                                                        </button>
                                                        <input
                                                            type="number"
                                                            value={qty}
                                                            onChange={(e) => {
                                                                const val = e.target.value;
                                                                updateItemQty(product.id, val === '' ? '' : parseFloat(val));
                                                            }}
                                                            className="w-14 text-center text-sm font-bold border border-gray-200 rounded-lg py-1 focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 outline-none transition-all"
                                                            min="0"
                                                            step="any"
                                                        />
                                                        <button
                                                            onClick={() => updateItemQty(product.id, (parseFloat(qty) || 0) + 1)}
                                                            className="w-7 h-7 rounded-lg bg-indigo-100 hover:bg-indigo-200 flex items-center justify-center text-indigo-600 font-bold transition-colors text-sm"
                                                        >
                                                            +
                                                        </button>
                                                        <span className="text-[10px] font-bold text-gray-400 uppercase ml-auto">{product.unit || 'Nos.'}</span>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="py-12 text-center text-sm text-gray-400 flex flex-col items-center gap-2">
                                    <Package size={32} className="text-gray-200 mb-2" />
                                    {productSearch ? `No products found matching "${productSearch}"` : 'No products available. Add products first.'}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Selected Items Summary Table */}
                    {items.length > 0 && (
                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Selected Items Summary</label>
                            <div className="border border-gray-200 rounded-lg overflow-hidden ring-1 ring-gray-900/5">
                                <table className="w-full">
                                    <thead>
                                        <tr className="bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-wider">
                                            <th className="text-left px-5 py-3 w-12 text-center">#</th>
                                            <th className="text-left px-4 py-3">Description</th>
                                            <th className="text-center px-2 py-3 w-24">Qty</th>
                                            <th className="text-center px-2 py-3 w-28">Unit</th>
                                            <th className="text-right px-4 py-3 w-32">Rate</th>
                                            <th className="text-right px-4 py-3 w-36">Total</th>
                                            <th className="w-10"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 bg-white">
                                        {items.map((item, index) => (
                                            <tr key={item.productId} className="group hover:bg-gray-50/50 transition-colors">
                                                <td className="px-5 py-3 text-center text-sm text-gray-400 font-medium">{index + 1}</td>
                                                <td className="px-4 py-2">
                                                    <div>
                                                        <p className="text-sm font-bold text-gray-900">{item.description}</p>
                                                        {item.gujaratiName && <p className="text-xs text-gray-500">{item.gujaratiName}</p>}
                                                    </div>
                                                </td>
                                                <td className="px-2 py-2">
                                                    <input
                                                        type="number"
                                                        value={item.quantity}
                                                        onChange={(e) => {
                                                            const val = e.target.value;
                                                            updateItemQty(item.productId, val === '' ? '' : parseFloat(val));
                                                        }}
                                                        className="w-full bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-900 text-center py-1.5 px-2 focus:ring-1 focus:ring-gray-900 outline-none font-semibold transition-all hover:border-gray-300"
                                                    />
                                                </td>
                                                <td className="px-2 py-2 text-center text-xs text-gray-600 font-medium">{item.unit}</td>
                                                <td className="px-4 py-2">
                                                    <div className="relative">
                                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-medium">₹</span>
                                                        <input
                                                            type="number"
                                                            value={item.price}
                                                            onChange={(e) => {
                                                                const val = e.target.value;
                                                                updateItemPrice(item.productId, val === '' ? '' : parseFloat(val));
                                                            }}
                                                            className="w-full bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-900 text-right py-1.5 pl-6 pr-3 focus:ring-1 focus:ring-gray-900 outline-none font-semibold transition-all hover:border-gray-300"
                                                        />
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <span className="text-sm font-bold text-gray-900">₹{((parseFloat(item.quantity) || 0) * (parseFloat(item.price) || 0)).toFixed(2)}</span>
                                                </td>
                                                <td className="px-2 py-3 text-center">
                                                    <button
                                                        onClick={() => removeItem(item.productId)}
                                                        className="p-1.5 text-gray-300 hover:text-red-600 hover:bg-red-50 rounded-md transition-all opacity-0 group-hover:opacity-100"
                                                        title="Remove Item"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>

                                {/* Footer Totals */}
                                <div className="bg-gray-50/50 border-t border-gray-200 p-5 flex justify-end">
                                    <div className="w-64 space-y-3">
                                        <div className="flex justify-between text-sm items-center">
                                            <span className="text-gray-500 font-medium">Subtotal</span>
                                            <span className="font-semibold text-gray-700">₹{subtotal.toFixed(2)}</span>
                                        </div>
                                        <div className="border-t border-gray-200 pt-3 flex justify-between items-end">
                                            <span className="text-base font-bold text-gray-900">Total</span>
                                            <span className="text-2xl font-extrabold text-gray-900 tracking-tight">₹{total.toFixed(2)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Invoice Preview & Print Modal */}
            {isPreviewOpen && createdInvoice && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-2xl max-h-[90vh] rounded-[32px] shadow-2xl flex flex-col animate-in zoom-in-95 duration-300 overflow-hidden">
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-slate-100">
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => {
                                        setIsPreviewOpen(false);
                                    }}
                                    className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition-all"
                                    title="Go Back"
                                >
                                    <ChevronRight size={20} className="rotate-180" />
                                </button>
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900">{isInvoiceConfirmed ? 'Bill Created!' : 'Bill Preview'}</h3>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{createdInvoice.id}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {isInvoiceConfirmed && (
                                    <>
                                        <div className="flex bg-slate-100 rounded-xl p-1 gap-1">
                                            <button
                                                onClick={handleStandardPrint}
                                                className="flex items-center gap-2 px-3 py-1.5 bg-white text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-50 transition-all shadow-sm"
                                            >
                                                <Printer size={14} />
                                                <span>Standard</span>
                                            </button>
                                            <button
                                                onClick={handleStandardPDF}
                                                className="flex items-center gap-2 px-3 py-1.5 hover:bg-white text-slate-500 hover:text-emerald-600 rounded-lg text-xs font-bold transition-all"
                                                title="Download Standard PDF"
                                            >
                                                <FileDown size={14} />
                                            </button>
                                        </div>

                                        <div className="flex bg-purple-100 rounded-xl p-1 gap-1">
                                            <button
                                                onClick={handleThermalPrint}
                                                className="flex items-center gap-2 px-3 py-1.5 bg-purple-600 text-white rounded-lg text-xs font-bold hover:bg-purple-700 transition-all shadow-sm"
                                            >
                                                <Printer size={14} />
                                                <span>Thermal</span>
                                            </button>
                                            <button
                                                onClick={handleThermalPDF}
                                                className="flex items-center gap-2 px-3 py-1.5 hover:bg-purple-600 hover:text-white text-purple-600 rounded-lg text-xs font-bold transition-all"
                                                title="Download Thermal PDF"
                                            >
                                                <FileDown size={14} />
                                            </button>
                                        </div>
                                    </>
                                )}
                                <button onClick={() => { setIsPreviewOpen(false); setCreatedInvoice(null); setIsInvoiceConfirmed(false); }} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-50 text-slate-400">
                                    <X size={20} />
                                </button>
                            </div>
                        </div>

                        {/* Invoice Content */}
                        <div className="flex-1 overflow-y-auto p-8 space-y-6">
                            {/* Customer & Date */}
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Customer</p>
                                    <h3 className="text-xl font-bold text-slate-900">{createdInvoice.customer}</h3>
                                    <p className="text-sm text-slate-500 font-medium">{createdInvoice.date}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total</p>
                                    <h3 className="text-3xl font-black text-indigo-600">₹{createdInvoice.total.toFixed(2)}</h3>
                                </div>
                            </div>

                            {/* Items Table */}
                            <div className="space-y-3">
                                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-widest border-b border-slate-100 pb-2">Line Items</h4>
                                {createdInvoice.items.map((item, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-indigo-100 transition-all group">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-white rounded-xl border border-slate-200 flex items-center justify-center p-2 overflow-hidden">
                                                {item.image ? (
                                                    <img src={item.image} alt="" className="w-full h-full object-contain" />
                                                ) : (
                                                    <Package className="text-slate-200" size={24} />
                                                )}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-900">
                                                    {item.description}
                                                    {item.gujaratiName && <span className="font-normal text-slate-500 ml-1">({item.gujaratiName})</span>}
                                                </p>
                                                <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                                                    <span>{item.quantity} {item.unit || 'Nos.'} x ₹{item.price.toFixed(2)}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <p className="text-sm font-black text-slate-900">₹{((parseFloat(item.quantity) || 0) * (parseFloat(item.price) || 0)).toFixed(2)}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-6 border-t border-slate-100 bg-slate-50/50 space-y-4">
                            <div className="flex justify-between items-center">
                                <p className="text-sm font-bold text-slate-500 uppercase tracking-wide">Grand Total</p>
                                <p className="text-2xl font-black text-slate-900">₹{createdInvoice.total.toFixed(2)}</p>
                            </div>
                            {!isInvoiceConfirmed && (
                                <button
                                    onClick={handleConfirmInvoice}
                                    className="w-full py-3.5 bg-emerald-600 text-white font-bold rounded-2xl hover:bg-emerald-700 transition-all text-sm uppercase tracking-wide shadow-lg shadow-emerald-600/20"
                                >
                                    ✓ Confirm & Create Bill
                                </button>
                            )}
                        </div>

                        {/* HIDDEN STANDARD A4 INVOICE FOR PRINT */}
                        <div className="bg-white w-[210mm] min-h-[297mm] p-[20mm] flex flex-col hidden print:block" id="ci-printable-invoice">
                            <div className="flex justify-between items-start border-b-2 border-slate-900 pb-8">
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-slate-900 rounded-lg flex items-center justify-center text-white font-bold text-2xl">S</div>
                                        <div>
                                            <h2 className="text-xl font-bold text-slate-900">Shakti Sales Agency</h2>
                                        </div>
                                    </div>
                                    <div className="text-[10px] text-slate-600 space-y-0.5 font-medium leading-tight">
                                        <p>Thangadh, Dist. Surendranagar Pincode - 363530</p>
                                    </div>
                                </div>
                                <div className="text-right space-y-2">
                                    <h1 className="text-3xl font-black text-slate-900 tracking-tighter">INVOICE</h1>
                                    <p className="text-xs font-bold text-slate-400">#{createdInvoice.id}</p>
                                    <div className="text-[10px] font-bold text-slate-900">
                                        <p>DATE: {createdInvoice.date}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="py-8 border-b border-slate-100">
                                <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Billed To</h4>
                                <h3 className="text-sm font-bold text-slate-900 mt-1">{createdInvoice.customer}</h3>
                            </div>

                            <div className="flex-1 py-8">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b-2 border-slate-900 text-[9px] font-black text-slate-900 uppercase tracking-widest">
                                            <th className="py-2 text-left">Description</th>
                                            <th className="py-2 text-center">Qty</th>
                                            <th className="py-2 text-center">Unit</th>
                                            <th className="py-2 text-right">Rate</th>
                                            <th className="py-2 text-right">Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-[10px]">
                                        {createdInvoice.items.map((item, idx) => (
                                            <tr key={idx} className="border-b border-slate-100">
                                                <td className="py-3 font-bold text-slate-900">
                                                    {item.description}
                                                    {item.gujaratiName && <span className="font-normal text-slate-500 ml-1">({item.gujaratiName})</span>}
                                                </td>
                                                <td className="py-3 text-center">{item.quantity}</td>
                                                <td className="py-3 text-center">{item.unit || 'Nos.'}</td>
                                                <td className="py-3 text-right">₹{item.price.toFixed(2)}</td>
                                                <td className="py-3 text-right font-bold">₹{((parseFloat(item.quantity) || 0) * (parseFloat(item.price) || 0)).toFixed(2)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="flex justify-end pt-4">
                                <div className="w-[200px] space-y-2">
                                    <div className="flex justify-between text-[10px] font-bold text-slate-600">
                                        <span>Subtotal</span>
                                        <span>₹{createdInvoice.total.toFixed(2)}</span>
                                    </div>
                                    <div className="h-px bg-slate-200"></div>
                                    <div className="flex justify-between items-center py-2">
                                        <span className="text-[10px] font-black text-slate-900 uppercase">Grand Total</span>
                                        <span className="text-lg font-black text-indigo-600 tracking-tighter">₹{createdInvoice.total.toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-auto pt-10 border-t border-slate-100">
                                <div className="text-center space-y-1">
                                    <p className="text-[9px] font-bold text-slate-800">Thank you for your business!</p>
                                    <p className="text-[8px] text-slate-400 font-medium italic">Computer generated invoice.</p>
                                </div>
                            </div>
                        </div>

                        {/* HIDDEN THERMAL RECEIPT */}
                        <div className="thermal-receipt hidden print:block" id="ci-thermal-receipt">
                            <div className="text-center font-bold text-lg mb-1">SHAKTI SALES AGENCY</div>
                            <div className="text-center text-[10px] mb-2">
                                Thangadh, Dist. Surendranagar<br />
                                Pincode - 363530
                            </div>
                            <div className="thermal-dotted"></div>
                            <div className="flex justify-between text-[10px] my-1">
                                <span>Bill No: {createdInvoice.id}</span>
                                <span>{createdInvoice.date}</span>
                            </div>
                            <div className="flex justify-between text-[10px] mb-1">
                                <span>Customer: {createdInvoice.customer}</span>
                            </div>
                            <div className="thermal-dotted"></div>
                            <div className="grid grid-cols-12 gap-1 text-[10px] font-bold mb-1">
                                <div className="col-span-4">ITEM</div>
                                <div className="col-span-2 text-center">QTY</div>
                                <div className="col-span-2 text-center">UNIT</div>
                                <div className="col-span-4 text-right">TOTAL</div>
                            </div>
                            <div className="thermal-dotted"></div>
                            {createdInvoice.items.map((item, i) => (
                                <div key={i} className="grid grid-cols-12 gap-1 text-[10px] my-1">
                                    <div className="col-span-4">
                                        {item.description}
                                        {item.gujaratiName && <span className="font-normal block text-[8px]">({item.gujaratiName})</span>}
                                    </div>
                                    <div className="col-span-2 text-center">{item.quantity}</div>
                                    <div className="col-span-2 text-center">{item.unit || 'Nos.'}</div>
                                    <div className="col-span-4 text-right">₹{(item.quantity * item.price).toFixed(2)}</div>
                                </div>
                            ))}
                            <div className="thermal-dotted"></div>
                            <div className="flex justify-between font-bold text-sm mt-2">
                                <span>GRAND TOTAL</span>
                                <span>₹{createdInvoice.total.toFixed(2)}</span>
                            </div>
                            <div className="thermal-dotted"></div>
                            <div className="text-center text-[9px] mt-4">
                                *** THANK YOU ***<br />
                                VISIT AGAIN
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CreateInvoice;
