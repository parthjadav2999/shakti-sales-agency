import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { Search, Plus, Users, Edit2, Trash2, Mail, Phone, MapPin, X, Upload, Download, ArrowLeft } from 'lucide-react';

const Customers = () => {
    const { customers, setCustomers, addCustomer, updateCustomer, deleteCustomer } = useData();
    const navigate = useNavigate();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState(null);
    const [newCustomer, setNewCustomer] = useState({ name: '', email: '', phone: '', address: '' });

    const location = useLocation();
    useEffect(() => {
        if (location.state?.openAddModal) {
            setIsModalOpen(true);
            setEditingCustomer(null);
            window.history.replaceState({}, document.title);
        }
    }, [location]);

    const [selectedIds, setSelectedIds] = useState(new Set());
    const [selectionMode, setSelectionMode] = useState(false);
    const longPressTimer = useRef(null);
    const [searchQuery, setSearchQuery] = useState('');

    const startLongPress = useCallback((id) => {
        longPressTimer.current = setTimeout(() => {
            setSelectionMode(true);
            setSelectedIds(new Set([id]));
        }, 500);
    }, []);

    const toggleSelect = (id) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });
    };

    const toggleSelectAll = () => {
        if (selectedIds.size === customers.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(customers.map(c => c.id)));
        }
    };

    const handleBulkDelete = () => {
        if (selectedIds.size === 0) return;
        if (window.confirm(`Are you sure you want to delete ${selectedIds.size} customer(s)?`)) {
            setCustomers(prev => prev.filter(c => !selectedIds.has(c.id)));
            setSelectedIds(new Set());
            setSelectionMode(false);
        }
    };

    const exitSelectionMode = () => {
        setSelectedIds(new Set());
        setSelectionMode(false);
    };

    const handleDownloadSample = () => {
        const sampleData = `Name, Phone, Email, Address
Rahul Sharma, 9876543210, rahul@example.com, 123 MG Road Mumbai
Priya Patel, 8765432109, priya@example.com, 456 CG Road Ahmedabad
Amit Singh, 7654321098, amit@example.com, 789 Park Street Kolkata
Vikram Malhotra, 9988776655, vikram@example.com, 101 Anna Salai Chennai
Sneha Reddy, 8877665544, sneha@example.com, 202 Banjara Hills Hyderabad`;
        const blob = new Blob([sampleData], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'sample_customers.csv';
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleOpenAddModal = () => {
        setEditingCustomer(null);
        setNewCustomer({ name: '', email: '', phone: '', address: '' });
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (customer) => {
        setEditingCustomer(customer);
        setNewCustomer({ ...customer });
        setIsModalOpen(true);
    };

    const handleDeleteCustomer = (id) => {
        if (window.confirm('Are you sure you want to delete this customer?')) {
            deleteCustomer(id);
        }
    };

    const handleSaveCustomer = (e) => {
        e.preventDefault();
        const id = editingCustomer ? editingCustomer.id : `CUST-${Date.now()}`;
        const customerData = { id, ...newCustomer };

        if (editingCustomer) {
            updateCustomer(customerData);
        } else {
            addCustomer(customerData);
        }
        setIsModalOpen(false);
        setEditingCustomer(null);
    };

    const handleImportCSV = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const fileName = file.name.toLowerCase();
        if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
            alert('❌ Excel files (.xlsx/.xls) are binary and not supported directly.\n\nPlease open your file in Excel, choose "Save As" > "CSV (Comma delimited) (*.csv)", and import that CSV file instead.');
            e.target.value = '';
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target.result;
            // ZIP archive checks (Excel .xlsx are disguised ZIP archives)
            if (text.startsWith('PK') || text.includes('docProps/') || text.includes('xl/')) {
                alert('❌ Invalid CSV file format.\n\nIt appears you renamed a binary Excel file (.xlsx) to .csv. Please save the sheet properly to CSV in Excel first.');
                return;
            }

            const lines = text.split('\n');
            const newCustomers = [];
            const startIndex = lines[0].toLowerCase().includes('name') ? 1 : 0;

            for (let i = startIndex; i < lines.length; i++) {
                const line = lines[i].trim();
                if (!line) continue;
                const [name, phone, email, address] = line.split(',').map(s => s.trim());
                if (name) {
                    newCustomers.push({
                        id: `CUST-IMP-${Date.now()}-${i}`,
                        name,
                        phone: phone || '',
                        email: email || '',
                        address: address || ''
                    });
                }
            }

            if (newCustomers.length > 0) {
                setCustomers([...newCustomers, ...customers]);
                alert(`✅ Imported ${newCustomers.length} customers!`);
            }
        };
        reader.readAsText(file);
        e.target.value = '';
    };

    const filteredCustomers = customers.filter(cust =>
        cust.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cust.phone.includes(searchQuery) ||
        cust.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="max-w-4xl mx-auto py-4">
            {/* Header - Exact Layout Match with CreateInvoice.jsx */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate('/')}
                        className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <h1 className="text-2xl font-bold text-gray-800">Customers</h1>
                </div>
                <div className="flex items-center gap-2">
                    <label className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors cursor-pointer bg-white">
                        <Upload size={16} />
                        <span>Import</span>
                        <input type="file" accept=".csv" onChange={handleImportCSV} className="hidden" />
                    </label>
                    <button onClick={handleDownloadSample} className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors bg-white">
                        <Download size={16} />
                        <span>Sample</span>
                    </button>
                    {customers.length > 0 && (
                        <button
                            onClick={() => {
                                if (window.confirm('⚠️ WARNING: Are you absolutely sure you want to delete ALL customers? This action is irreversible.')) {
                                    setCustomers([]);
                                }
                            }}
                            className="flex items-center gap-2 px-4 py-2 bg-rose-600 text-white rounded-lg text-sm font-medium hover:bg-rose-700 transition-colors shadow-sm"
                            title="Delete All Customers"
                        >
                            <Trash2 size={16} />
                            <span>Delete All</span>
                        </button>
                    )}
                    <button
                        onClick={handleOpenAddModal}
                        className="flex items-center gap-2 px-5 py-2 bg-gray-800 text-white rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors"
                    >
                        <Plus size={16} />
                        <span>Add Customer</span>
                    </button>
                </div>
            </div>

            {/* Top Block: Search & Stats - Matches "Customer/Date" Block */}
            <div className="bg-white border border-gray-200 rounded-lg p-5 mb-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Search Customers</label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                            <input
                                type="text"
                                placeholder="Search by name, phone, or email..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-gray-300 outline-none transition-all text-gray-800"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Total Customers</label>
                        <div className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-between text-sm text-gray-800 font-medium h-[42px]">
                            <span>{customers.length}</span>
                            <Users size={16} className="text-gray-400" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Block: Customer List - Matches "Items" Block */}
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden mb-4">
                <div className="flex items-center justify-between px-5 py-3 bg-gray-50 border-b border-gray-200">
                    <span className="text-sm font-semibold text-gray-700">Customer List</span>
                    {selectedIds.size > 0 && (
                        <div className="flex items-center gap-3">
                            <span className="text-sm font-medium text-gray-600">{selectedIds.size} selected</span>
                            <button onClick={handleBulkDelete} className="text-xs font-medium text-rose-600 hover:text-rose-700 flex items-center gap-1">
                                <Trash2 size={12} /> Delete
                            </button>
                            <button onClick={exitSelectionMode} className="text-xs font-medium text-gray-500 hover:text-gray-700">
                                Cancel
                            </button>
                        </div>
                    )}
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                <th className="px-5 py-3 w-10 text-center">
                                    <input
                                        type="checkbox"
                                        checked={selectedIds.size === customers.length && customers.length > 0}
                                        onChange={toggleSelectAll}
                                        className="rounded border-gray-300 text-gray-800 focus:ring-gray-500 cursor-pointer h-4 w-4"
                                    />
                                </th>
                                <th className="px-3 py-3">Customer Name</th>
                                <th className="px-3 py-3">Phone</th>
                                <th className="px-3 py-3">Email</th>
                                <th className="px-3 py-3">Address</th>
                                <th className="px-3 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 bg-white">
                            {filteredCustomers.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center text-sm text-gray-500">
                                        No customers found.
                                    </td>
                                </tr>
                            ) : (
                                filteredCustomers.map((cust) => (
                                    <tr
                                        key={cust.id}
                                        className={`hover:bg-gray-50/50 transition-colors ${selectedIds.has(cust.id) ? 'bg-gray-50' : ''}`}
                                        onContextMenu={(e) => { e.preventDefault(); startLongPress(cust.id); }}
                                    >
                                        <td className="px-5 py-3 text-center">
                                            <input
                                                type="checkbox"
                                                checked={selectedIds.has(cust.id)}
                                                onChange={() => toggleSelect(cust.id)}
                                                className={`rounded border-gray-300 text-gray-800 focus:ring-gray-500 cursor-pointer h-4 w-4 transition-opacity ${selectedIds.has(cust.id) || selectionMode ? 'opacity-100' : 'opacity-0 hover:opacity-100'}`}
                                            />
                                        </td>
                                        <td className="px-3 py-3">
                                            <span className="text-sm font-medium text-gray-900">{cust.name}</span>
                                        </td>
                                        <td className="px-3 py-3">
                                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                                {cust.phone || '-'}
                                            </div>
                                        </td>
                                        <td className="px-3 py-3">
                                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                                {cust.email || '-'}
                                            </div>
                                        </td>
                                        <td className="px-3 py-3">
                                            <span className="text-sm text-gray-600 truncate block max-w-[200px]" title={cust.address}>
                                                {cust.address || '-'}
                                            </span>
                                        </td>
                                        <td className="px-3 py-3 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button onClick={() => handleOpenEditModal(cust)} className="p-1.5 text-gray-400 hover:text-gray-800 rounded transition-colors" title="Edit">
                                                    <Edit2 size={14} />
                                                </button>
                                                <button onClick={() => handleDeleteCustomer(cust.id)} className="p-1.5 text-gray-400 hover:text-rose-600 rounded transition-colors" title="Delete">
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal - Match Design */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm transition-all">
                    <div className="bg-white w-full max-w-md rounded-lg shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white">
                            <h3 className="text-lg font-bold text-gray-800">
                                {editingCustomer ? 'Edit Customer' : 'Add Customer'}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded-md hover:bg-gray-100 transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSaveCustomer} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Customer Name <span className="text-rose-500">*</span></label>
                                <input
                                    required
                                    type="text"
                                    value={newCustomer.name}
                                    onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-300 outline-none transition-all text-sm text-gray-800"
                                    placeholder="Enter customer name"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Phone</label>
                                    <input
                                        type="text"
                                        value={newCustomer.phone}
                                        onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                                        className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-300 outline-none transition-all text-sm text-gray-800"
                                        placeholder="Mobile"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Email</label>
                                    <input
                                        type="email"
                                        value={newCustomer.email}
                                        onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                                        className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-300 outline-none transition-all text-sm text-gray-800"
                                        placeholder="Email"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Address</label>
                                <textarea
                                    value={newCustomer.address}
                                    onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
                                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-300 outline-none transition-all text-sm text-gray-800 resize-none h-24"
                                    placeholder="Full address (optional)"
                                />
                            </div>

                            <div className="pt-2 flex gap-3">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-2 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors text-sm">
                                    Cancel
                                </button>
                                <button type="submit" className="flex-1 px-4 py-2 bg-gray-800 text-white font-medium rounded-lg hover:bg-gray-700 transition-colors shadow-sm text-sm">
                                    {editingCustomer ? 'Save Changes' : 'Save Customer'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Customers;
