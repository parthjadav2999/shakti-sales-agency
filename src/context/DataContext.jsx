import React, { createContext, useContext, useState, useEffect } from 'react';

const DataContext = createContext();

export const useData = () => {
    const context = useContext(DataContext);
    if (!context) {
        throw new Error('useData must be used within a DataProvider');
    }
    return context;
};

export const DataProvider = ({ children }) => {
    // Initial data with some defaults if localStorage is empty
    const [products, setProducts] = useState(() => {
        try {
            const saved = localStorage.getItem('products');
            if (saved && JSON.parse(saved).length > 0) {
                const parsed = JSON.parse(saved);
                // Check if old placeholder data is loaded, if so force fallback to snack defaults
                const isOldPlaceholderDb = parsed.some(p => p.name === 'Standard Widget' || p.name === 'Premium Service');
                if (!isOldPlaceholderDb) {
                    // Data normalization: ensure price is always a number and handle bilingual names
                    return parsed.map(p => ({
                        ...p,
                        price: typeof p.price === 'string' ? parseFloat(p.price.replace(/[₹$]/g, '')) || 0 : p.price,
                        salePrice: p.salePrice || (typeof p.price === 'string' ? parseFloat(p.price.replace(/[₹$]/g, '')) || 0 : p.price),
                        nameGujarati: p.nameGujarati || ''
                    }));
                }
            }
            return [
                { id: 'PROD-001', name: 'Khichdi', nameGujarati: 'ખીચડી', price: 45.00, salePrice: 45.00, stock: 150, unit: 'Packet', image: null },
                { id: 'PROD-002', name: 'Pasta', nameGujarati: 'પાસ્તા', price: 45.00, salePrice: 45.00, stock: 150, unit: 'Packet', image: null },
                { id: 'PROD-003', name: 'Garlic kaju', nameGujarati: 'ગાર્લિક કાજુ', price: 45.00, salePrice: 45.00, stock: 150, unit: 'Packet', image: null },
                { id: 'PROD-004', name: 'Lasan Kaju', nameGujarati: 'લસણ કાજુ', price: 45.00, salePrice: 45.00, stock: 150, unit: 'Packet', image: null },
                { id: 'PROD-005', name: 'Chaumin Noodles', nameGujarati: 'ચૌમીન નૂડલ્સ', price: 45.00, salePrice: 45.00, stock: 150, unit: 'Packet', image: null },
                { id: 'PROD-006', name: 'Hot Chilli', nameGujarati: 'હોટ ચિલી', price: 45.00, salePrice: 45.00, stock: 150, unit: 'Packet', image: null },
                { id: 'PROD-007', name: '3 Patti', nameGujarati: '૩ પત્તી', price: 45.00, salePrice: 45.00, stock: 150, unit: 'Packet', image: null },
                { id: 'PROD-008', name: 'Gadi', nameGujarati: 'ગાડી', price: 44.00, salePrice: 44.00, stock: 150, unit: 'Packet', image: null },
                { id: 'PROD-009', name: 'finger chips', nameGujarati: 'ફિંગર ચિપ્સ', price: 45.00, salePrice: 45.00, stock: 150, unit: 'Packet', image: null },
                { id: 'PROD-010', name: 'soya chips', nameGujarati: 'સોયા ચિપ્સ', price: 46.00, salePrice: 46.00, stock: 150, unit: 'Packet', image: null },
                { id: 'PROD-011', name: 'Soya stick', nameGujarati: 'સોયા સ્ટિક', price: 46.00, salePrice: 46.00, stock: 150, unit: 'Packet', image: null },
                { id: 'PROD-012', name: 'Petpooja noodles', nameGujarati: 'પેટપૂજા નૂડલ્સ', price: 45.00, salePrice: 45.00, stock: 150, unit: 'Packet', image: null },
                { id: 'PROD-013', name: 'Target noodles', nameGujarati: 'ટાર્ગેટ નૂડલ્સ', price: 45.00, salePrice: 45.00, stock: 150, unit: 'Packet', image: null },
                { id: 'PROD-014', name: 'Target ring', nameGujarati: 'ટાર્ગેટ રીંગ', price: 45.00, salePrice: 45.00, stock: 150, unit: 'Packet', image: null },
                { id: 'PROD-015', name: 'Target', nameGujarati: 'ટાર્ગેટ', price: 45.00, salePrice: 45.00, stock: 150, unit: 'Packet', image: null },
                { id: 'PROD-016', name: 'Seema', nameGujarati: 'સીમા', price: 45.00, salePrice: 45.00, stock: 150, unit: 'Packet', image: null }
            ];
        } catch (e) {
            console.error('Failed to load products', e);
            return [];
        }
    });

    const [customers, setCustomers] = useState(() => {
        try {
            const saved = localStorage.getItem('customers');
            if (saved) {
                const parsed = JSON.parse(saved);
                // Auto-purge old seeded customer database (Shashwat) to ensure clean starting slate
                const hasLegacySeeded = parsed.some(c => c.name.toLowerCase().includes('shashwat') && c.phone === '9662086299');
                if (hasLegacySeeded) {
                    localStorage.setItem('customers', '[]');
                    return [];
                }
                return parsed;
            }
            return [];
        } catch (e) {
            console.error('Failed to load customers', e);
            return [];
        }
    });

    const [invoices, setInvoices] = useState(() => {
        try {
            const saved = localStorage.getItem('invoices');
            if (saved && saved !== 'undefined') {
                const parsed = JSON.parse(saved);
                // Normalize invoice data to prevent crashes from missing fields
                return parsed.filter(Boolean).map(inv => {
                    const total = typeof inv.total === 'number' ? inv.total : (parseFloat(inv.total) || 0);
                    const paidAmount = typeof inv.paidAmount === 'number' ? inv.paidAmount : 0;
                    const payments = Array.isArray(inv.payments) ? inv.payments : [];
                    // Auto-compute status from payments
                    let status = inv.status || 'Pending';
                    if (paidAmount >= total && total > 0) status = 'Paid';
                    else if (paidAmount > 0) status = 'Partial';
                    else status = 'Pending';
                    return {
                        ...inv,
                        id: inv.id || String(Date.now()),
                        customer: inv.customer || 'Cash Customer',
                        date: inv.date || new Date().toISOString().split('T')[0],
                        items: Array.isArray(inv.items) ? inv.items.map(item => ({
                            ...item,
                            description: item.description || '',
                            quantity: typeof item.quantity === 'number' ? item.quantity : (parseFloat(item.quantity) || 0),
                            price: typeof item.price === 'number' ? item.price : (parseFloat(item.price) || 0),
                            unit: item.unit || 'Nos.'
                        })) : [],
                        total,
                        subtotal: typeof inv.subtotal === 'number' ? inv.subtotal : (parseFloat(inv.subtotal) || 0),
                        paidAmount,
                        payments,
                        status
                    };
                });
            }
            return [];
        } catch (e) {
            console.error('Failed to load invoices', e);
            return [];
        }
    });

    // Sync with localStorage across tabs
    useEffect(() => {
        const handleStorageChange = (e) => {
            if (e.key === 'products' && e.newValue) setProducts(JSON.parse(e.newValue));
            if (e.key === 'customers' && e.newValue) setCustomers(JSON.parse(e.newValue));
            if (e.key === 'invoices' && e.newValue) setInvoices(JSON.parse(e.newValue));
        };
        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    // Persistence effects
    useEffect(() => {
        localStorage.setItem('products', JSON.stringify(products));
    }, [products]);

    useEffect(() => {
        localStorage.setItem('customers', JSON.stringify(customers));
    }, [customers]);

    useEffect(() => {
        localStorage.setItem('invoices', JSON.stringify(invoices));
    }, [invoices]);

    // Debounced automatic disk synchronization to the standalone HTML file
    useEffect(() => {
        const syncWithHtmlDisk = async () => {
            try {
                await fetch('/api/sync-html', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        products,
                        customers,
                        invoices
                    })
                });
            } catch (e) {
                console.warn('[Sync Client] Offline/production mode active, skipping background disk sync:', e);
            }
        };

        const timer = setTimeout(() => {
            syncWithHtmlDisk();
        }, 500); // 500ms debounce prevents rapid disk writes
        
        return () => clearTimeout(timer);
    }, [products, customers, invoices]);

    // Product Actions
    const addProduct = (product) => {
        setProducts(prev => [...prev, product]);
    };

    const updateProduct = (updatedProduct) => {
        setProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p));
    };

    const deleteProduct = (id) => {
        setProducts(prev => prev.filter(p => p.id !== id));
    };

    // Customer Actions
    const addCustomer = (customer) => {
        setCustomers(prev => [customer, ...prev]);
    };

    const updateCustomer = (updatedCustomer) => {
        setCustomers(prev => prev.map(c => c.id === updatedCustomer.id ? updatedCustomer : c));
    };

    const deleteCustomer = (id) => {
        setCustomers(prev => prev.filter(c => c.id !== id));
    };

    // Invoice Actions
    const getNextInvoiceId = () => {
        if (invoices.length === 0) return '1';
        const numericIds = invoices.map(inv => parseInt(inv.id, 10)).filter(n => !isNaN(n));
        if (numericIds.length === 0) return String(invoices.length + 1);
        return String(Math.max(...numericIds) + 1);
    };

    const addInvoice = (invoice) => {
        setInvoices(prev => [invoice, ...prev]);
    };

    const deleteInvoice = (id) => {
        setInvoices(prev => prev.filter(inv => inv.id !== id));
    };

    const updateInvoice = (id, updates) => {
        setInvoices(prev => prev.map(inv => inv.id === id ? { ...inv, ...updates } : inv));
    };

    const addPayment = (invoiceId, payment) => {
        setInvoices(prev => prev.map(inv => {
            if (inv.id !== invoiceId) return inv;
            const newPayments = [...(inv.payments || []), payment];
            const newPaidAmount = newPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
            let newStatus = 'Pending';
            if (newPaidAmount >= inv.total) newStatus = 'Paid';
            else if (newPaidAmount > 0) newStatus = 'Partial';
            return { ...inv, payments: newPayments, paidAmount: newPaidAmount, status: newStatus };
        }));
    };

    const deletePayment = (invoiceId, paymentId) => {
        setInvoices(prev => prev.map(inv => {
            if (inv.id !== invoiceId) return inv;
            const newPayments = (inv.payments || []).filter(p => p.id !== paymentId);
            const newPaidAmount = newPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
            let newStatus = 'Pending';
            if (newPaidAmount >= inv.total) newStatus = 'Paid';
            else if (newPaidAmount > 0) newStatus = 'Partial';
            return { ...inv, payments: newPayments, paidAmount: newPaidAmount, status: newStatus };
        }));
    };

    const updatePayment = (invoiceId, paymentId, updates) => {
        setInvoices(prev => prev.map(inv => {
            if (inv.id !== invoiceId) return inv;
            const newPayments = (inv.payments || []).map(p => p.id === paymentId ? { ...p, ...updates } : p);
            const newPaidAmount = newPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
            let newStatus = 'Pending';
            if (newPaidAmount >= inv.total) newStatus = 'Paid';
            else if (newPaidAmount > 0) newStatus = 'Partial';
            return { ...inv, payments: newPayments, paidAmount: newPaidAmount, status: newStatus };
        }));
    };

    const [cart, setCart] = useState(() => {
        try {
            const saved = localStorage.getItem('cart');
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            console.error('Failed to load cart', e);
            return [];
        }
    });

    useEffect(() => {
        localStorage.setItem('cart', JSON.stringify(cart));
    }, [cart]);

    const updateCartQty = (productId, delta) => {
        setCart(prev => {
            const existing = prev.find(item => item.productId === productId);
            if (existing) {
                const newQty = existing.qty + delta;
                if (newQty <= 0) {
                    return prev.filter(item => item.productId !== productId);
                }
                return prev.map(item => item.productId === productId ? { ...item, qty: newQty } : item);
            }
            if (delta > 0) {
                return [...prev, { productId, qty: delta }];
            }
            return prev;
        });
    };

    const clearCart = () => setCart([]);

    return (
        <DataContext.Provider value={{
            products, addProduct, updateProduct, deleteProduct, setProducts,
            customers, addCustomer, updateCustomer, deleteCustomer, setCustomers,
            invoices, addInvoice, deleteInvoice, updateInvoice, getNextInvoiceId, addPayment,
            updatePayment, deletePayment,
            cart, updateCartQty, clearCart
        }}>
            {children}
        </DataContext.Provider>
    );
};
