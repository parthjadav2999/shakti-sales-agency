import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import html2pdf from 'html2pdf.js';
import { useData } from '../context/DataContext';
import { Search, Plus, Package, Edit2, Trash2, Tag, Archive, X, Upload, Image as ImageIcon, LayoutGrid, List, ChevronRight, CircleDollarSign, AlertCircle, Minus, Printer, FileDown, CheckSquare } from 'lucide-react';

const Products = () => {
    const { products, setProducts, addProduct, updateProduct, deleteProduct, cart, updateCartQty, clearCart, customers, addInvoice, getNextInvoiceId } = useData();
    const location = useLocation();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [newProduct, setNewProduct] = useState({ name: '', nameGujarati: '', price: 0, salePrice: 0, stock: 0, unit: 'Nos.', image: null });

    useEffect(() => {
        if (location.state?.openAddModal) {
            setIsModalOpen(true);
            setEditingProduct(null);
            // Clear history state to prevent reopening on refresh
            window.history.replaceState({}, document.title);
        }
    }, [location]);

    const [searchQuery, setSearchQuery] = useState('');
    const [isTransliterating, setIsTransliterating] = useState(false);
    const [isManualGujarati, setIsManualGujarati] = useState(false);
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [selectionMode, setSelectionMode] = useState(false);
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
        if (selectedIds.size === filteredProducts.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(filteredProducts.map(p => p.id)));
        }
    };

    const handleBulkDelete = () => {
        if (selectedIds.size === 0) return;
        if (window.confirm(`Are you sure you want to delete ${selectedIds.size} product(s)?`)) {
            setProducts(prev => prev.filter(p => !selectedIds.has(p.id)));
            setSelectedIds(new Set());
            setSelectionMode(false);
        }
    };

    const exitSelectionMode = () => {
        setSelectedIds(new Set());
        setSelectionMode(false);
    };

    const [isCartModalOpen, setIsCartModalOpen] = useState(false);
    const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState(location.state?.selectedCustomer || '');
    const [isProcessingCheckout, setIsProcessingCheckout] = useState(false);
    const [createdInvoice, setCreatedInvoice] = useState(null);
    const [isInvoicePreviewOpen, setIsInvoicePreviewOpen] = useState(false);
    const [isInvoiceConfirmed, setIsInvoiceConfirmed] = useState(false);

    // Automatic Gujarati Transliteration
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (newProduct.nameGujarati && /[a-zA-Z]/.test(newProduct.nameGujarati)) {
                handleTransliterate(newProduct.nameGujarati);
            }
        }, 800);
        return () => clearTimeout(timeoutId);
    }, [newProduct.nameGujarati]);

    const handleTransliterate = async (text) => {
        if (!text) return;
        setIsTransliterating(true);
        try {
            const response = await fetch(`https://inputtools.google.com/request?text=${text}&ime=transliteration_en_gu&num=1`);
            const data = await response.json();
            if (data[0] === 'SUCCESS' && data[1][0][1].length > 0) {
                const translatedText = data[1][0][1][0];
                setNewProduct(prev => ({ ...prev, nameGujarati: translatedText }));
            }
        } catch (error) {
            console.error('Transliteration failed:', error);
        } finally {
            setIsTransliterating(false);
        }
    };

    const handleOpenAddModal = () => {
        setEditingProduct(null);
        setNewProduct({ name: '', nameGujarati: '', price: 0, salePrice: 0, stock: 0, unit: 'Nos.', image: null });
        setIsManualGujarati(false);
        setIsTransliterating(false);
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (product) => {
        setEditingProduct(product);
        setNewProduct({
            name: product.name,
            nameGujarati: product.nameGujarati || '',
            price: typeof product.price === 'string' ? parseFloat(product.price.replace(/[₹$]/g, '')) : product.price,
            salePrice: typeof product.salePrice === 'string' ? parseFloat(product.salePrice.replace(/[₹$]/g, '')) : (product.salePrice || product.price),
            stock: product.stock === '-' ? 0 : product.stock,
            unit: product.unit,
            image: product.image || null
        });
        setIsManualGujarati(!!product.nameGujarati);
        setIsTransliterating(false);
        setIsModalOpen(true);
    };

    const handleDeleteProduct = (id) => {
        if (window.confirm('Are you sure you want to delete this product?')) {
            deleteProduct(id);
        }
    };

    const handleSaveProduct = (e) => {
        e.preventDefault();

        const priceValue = parseFloat(newProduct.price) || 0;
        const salePriceValue = parseFloat(newProduct.salePrice) || 0;
        const stockValue = parseInt(newProduct.stock) || 0;

        if (editingProduct) {
            updateProduct({
                ...editingProduct,
                ...newProduct,
                price: priceValue,
                salePrice: salePriceValue,
                stock: stockValue
            });
        } else {
            const id = `PROD-${Date.now()}`;
            addProduct({
                id,
                ...newProduct,
                price: priceValue,
                salePrice: salePriceValue,
                stock: stockValue,
            });
        }

        setIsModalOpen(false);
        setNewProduct({ name: '', nameGujarati: '', price: 0, salePrice: 0, stock: 0, unit: 'Nos.', image: null });
        setEditingProduct(null);
        setIsManualGujarati(false);
        setIsTransliterating(false);
    };

    const cartTotal = cart.reduce((acc, item) => {
        const product = products.find(p => p.id === item.productId);
        const price = product ? (product.salePrice || product.price) : 0;
        return acc + (price * item.qty);
    }, 0);

    const handleQuickCheckout = () => {
        if (!selectedCustomer) {
            alert('Please select a customer');
            return;
        }

        setIsProcessingCheckout(true);
        try {
            const invoiceId = getNextInvoiceId();
            const invoiceItems = cart.map(item => {
                const product = products.find(p => p.id === item.productId);
                return {
                    id: item.productId,
                    description: product.name,
                    quantity: item.qty,
                    price: product.salePrice || product.price,
                    unit: product.unit,
                    image: product.image,
                    gujaratiName: product.nameGujarati
                };
            });

            const newInvoice = {
                id: invoiceId,
                customer: selectedCustomer,
                date: new Date().toISOString().split('T')[0],
                dueDate: '',
                items: invoiceItems,
                subtotal: cartTotal,
                total: cartTotal,
                status: 'Pending',
                paidAmount: 0,
                payments: []
            };

            // Don't save yet — just show preview for confirmation
            setCreatedInvoice(newInvoice);
            setIsInvoiceConfirmed(false);
            setIsCheckoutModalOpen(false);
            setIsInvoicePreviewOpen(true);
        } catch (error) {
            console.error('Checkout failed:', error);
            alert('Something went wrong during checkout');
        } finally {
            setIsProcessingCheckout(false);
        }
    };

    const handleConfirmInvoice = () => {
        if (!createdInvoice) return;
        addInvoice(createdInvoice);
        clearCart();
        setSelectedCustomer('');
        setIsInvoiceConfirmed(true);
    };

    const filteredProducts = products.filter(p => {
        return (p.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (p.nameGujarati || '').toLowerCase().includes(searchQuery.toLowerCase());
    });

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setNewProduct({ ...newProduct, image: reader.result });
            };
            reader.readAsDataURL(file);
        }
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
            const newImportedProducts = [];

            // Skip header if it exists
            const startIndex = lines[0].toLowerCase().includes('name') ? 1 : 0;

            for (let i = startIndex; i < lines.length; i++) {
                const line = lines[i].trim();
                if (!line) continue;

                // Expected format: Name, Gujarati Name, Price, Sale Price, Stock, Unit
                // Handle potential commas in quoted strings (basic regex split or just simple split for now)
                const parts = line.split(',').map(s => s.trim());

                // Flexible parsing: try to detect format based on columns length
                let name, nameGujarati, price, salePrice, stock, unit;

                if (parts.length >= 5) {
                    [name, nameGujarati, price, salePrice, stock, unit] = parts;
                } else if (parts.length === 3) {
                    // Legacy/Simple format: Name, Stock, Unit
                    [name, stock, unit] = parts;
                    price = '0';
                    salePrice = '0';
                } else {
                    [name, stock] = parts;
                }

                if (name) {
                    newImportedProducts.push({
                        id: `PROD-IMP-${Date.now()}-${i}`,
                        name: name,
                        nameGujarati: nameGujarati || '',
                        price: parseFloat(price) || 0,
                        salePrice: parseFloat(salePrice) || parseFloat(price) || 0,
                        stock: parseInt(stock) || 0,
                        unit: unit || 'Nos.',
                        image: null
                    });
                }
            }

            if (newImportedProducts.length > 0) {
                setProducts([...newImportedProducts, ...products]);
                alert(`Successfully imported ${newImportedProducts.length} products!`);
            }
        };
        reader.readAsText(file);
        e.target.value = ''; // Reset input
    };

    const downloadSampleCSV = () => {
        const headers = ['Name,Gujarati Name,Price,Sale Price,Stock,Unit'];
        const rows = [
            'Example Item,ઉદાહરણ વસ્તુ,100,120,50,Nos.',
            'Bulk Widget,,500,550,10,Box'
        ];
        const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "sample_products.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };


    const lowStock = products.filter(p => p.stock !== '-' && parseInt(p.stock) < 20).length;

    // Product Card Component (Internal)
    const ProductCard = ({ product }) => {
        const cartItem = cart.find(item => item.productId === product.id);
        const qty = cartItem ? cartItem.qty : 0;
        const [showQtyInput, setShowQtyInput] = useState(false);
        const [manualQty, setManualQty] = useState('');

        const handleDoubleClick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            setManualQty('');
            setShowQtyInput(true);
        };

        const handleAddManualQty = () => {
            const parsedQty = parseFloat(manualQty);
            if (!parsedQty || parsedQty <= 0) return;
            // Set exact qty: first remove existing, then add new amount
            if (qty > 0) updateCartQty(product.id, -qty);
            updateCartQty(product.id, parsedQty);
            setShowQtyInput(false);
            setManualQty('');
        };

        return (
            <div
                className={`zepto-card group relative p-1.5 flex flex-col h-full ${selectedIds.has(product.id) ? 'ring-2 ring-indigo-500 bg-indigo-50/30' : ''}`}
                onDoubleClick={handleDoubleClick}
                onMouseDown={() => startLongPress(product.id)}
                onMouseUp={cancelLongPress}
                onMouseLeave={cancelLongPress}
                onTouchStart={() => startLongPress(product.id)}
                onTouchEnd={cancelLongPress}
            >
                {/* Selection Checkbox */}
                {selectionMode && (
                    <div className="absolute top-2 left-2 z-10" onClick={e => e.stopPropagation()}>
                        <input
                            type="checkbox"
                            checked={selectedIds.has(product.id)}
                            onChange={() => toggleSelect(product.id)}
                            className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer shadow-sm"
                        />
                    </div>
                )}
                {/* Manual Qty Input Popup */}
                {showQtyInput && (
                    <div className="absolute inset-0 z-20 bg-white/95 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center p-4 border-2 border-indigo-500 shadow-xl" onClick={(e) => e.stopPropagation()}>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Enter Quantity</p>
                        <p className="text-sm font-bold text-slate-900 mb-3 text-center truncate w-full">{product.name}</p>
                        <input
                            type="number"
                            autoFocus
                            value={manualQty}
                            onChange={(e) => setManualQty(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') handleAddManualQty(); if (e.key === 'Escape') setShowQtyInput(false); }}
                            placeholder="Qty..."
                            className="w-24 text-center text-lg font-bold border-2 border-slate-200 rounded-xl py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                            min="0"
                            step="any"
                        />
                        <div className="flex gap-2 mt-3">
                            <button
                                onClick={handleAddManualQty}
                                className="px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 transition-all"
                            >
                                Add
                            </button>
                            <button
                                onClick={() => setShowQtyInput(false)}
                                className="px-4 py-2 bg-slate-100 text-slate-600 text-xs font-bold rounded-lg hover:bg-slate-200 transition-all"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                )}

                {/* Image Section */}
                <div className="relative aspect-square rounded-xl bg-slate-50 mb-1.5 overflow-hidden flex items-center justify-center p-1.5">
                    {product.image ? (
                        <img src={product.image} alt={product.name} className="w-full h-full object-contain mix-blend-multiply group-hover:scale-110 transition-transform duration-500" />
                    ) : (
                        <Package className="text-slate-200" size={24} />
                    )}
                </div>

                {/* Info Section */}
                <div className="flex-1">
                    <div className="text-[8px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">{product.unit}</div>
                    <h3 className="text-[10px] font-bold text-slate-900 leading-tight mb-0.5 line-clamp-2">{product.name}</h3>
                    {product.nameGujarati && (
                        <div className="text-[9px] font-medium text-slate-500 mb-0.5 truncate">{product.nameGujarati}</div>
                    )}
                </div>

                {/* Bottom Section: Price & Add Button */}
                <div className="mt-1.5 flex items-center justify-between gap-1">
                    <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-900">₹{product.salePrice || product.price}</span>
                    </div>

                    <div className="w-14">
                        {qty === 0 ? (
                            <button
                                onClick={() => updateCartQty(product.id, 1)}
                                className="zepto-btn-add w-full py-1 text-[10px]"
                            >
                                <Plus size={10} />
                                Add
                            </button>
                        ) : (
                            <div className="zepto-qty-selector w-full py-0.5 px-1 text-xs">
                                <button onClick={() => updateCartQty(product.id, -1)} className="hover:scale-110 transition-transform">
                                    <Minus size={10} />
                                </button>
                                <span
                                    onClick={(e) => { e.stopPropagation(); setManualQty(String(qty)); setShowQtyInput(true); }}
                                    className="cursor-pointer hover:bg-indigo-100 px-0.5 rounded transition-colors text-[10px]"
                                    title="Click to edit qty"
                                >{qty}</span>
                                <button onClick={() => updateCartQty(product.id, 1)} className="hover:scale-110 transition-transform">
                                    <Plus size={10} />
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Admin Actions Overlay (Hidden by default, shown on hover/touch) */}
                <div className="absolute top-2 right-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleOpenEditModal(product)} className="p-1.5 bg-white shadow-md border border-slate-100 rounded-lg text-indigo-600 hover:bg-slate-50">
                        <Edit2 size={12} />
                    </button>
                    <button onClick={() => handleDeleteProduct(product.id)} className="p-1.5 bg-white shadow-md border border-slate-100 rounded-lg text-rose-600 hover:bg-slate-50">
                        <Trash2 size={12} />
                    </button>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Products</h1>
                    <p className="text-slate-500 mt-1">Manage your inventory, prices, and stock levels.</p>
                </div>

                <div className="flex items-center gap-3">
                    {products.length > 0 && (
                        <button
                            onClick={() => {
                                if (window.confirm('Are you sure you want to delete ALL products? This cannot be undone.')) {
                                    setProducts([]);
                                }
                            }}
                            className="btn btn-secondary text-rose-600 border-rose-200 hover:bg-rose-50"
                        >
                            <Trash2 size={18} />
                            <span>Delete All</span>
                        </button>
                    )}
                    <label className="btn btn-secondary cursor-pointer">
                        <Upload size={18} />
                        <span>Import</span>
                        <input type="file" accept=".csv" onChange={handleImportCSV} className="hidden" />
                    </label>
                    <button onClick={downloadSampleCSV} className="btn btn-secondary" title="Download Sample CSV">
                        <FileDown size={18} />
                        <span>Sample</span>
                    </button>
                    <button onClick={handleOpenAddModal} className="btn btn-primary">
                        <Plus size={18} />
                        <span>Add Product</span>
                    </button>
                </div>
            </div>

            {/* Search & Filter Section */}
            <div className="glass overflow-hidden rounded-3xl">
                <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/50">
                    <div className="relative max-w-sm w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search products..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-100/50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all outline-none text-slate-700 text-sm"
                        />
                    </div>
                </div>
            </div>

            {/* Main Content Area: Simplified Grid */}
            <div className="">
                {/* Bulk Action Bar */}
                {selectedIds.size > 0 && (
                    <div className="sticky top-0 z-40 bg-rose-600 text-white px-6 py-3 rounded-2xl mb-6 flex items-center justify-between shadow-lg shadow-rose-200 animate-in slide-in-from-top duration-300">
                        <div className="flex items-center gap-3">
                            <CheckSquare size={20} />
                            <span className="font-bold text-sm">{selectedIds.size} selected</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <button onClick={toggleSelectAll} className="px-4 py-1.5 bg-white/20 rounded-lg text-sm font-bold hover:bg-white/30 transition-all">
                                {selectedIds.size === filteredProducts.length ? 'Deselect All' : 'Select All'}
                            </button>
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

                {/* Product Grid */}
                <div className="space-y-4">
                    {filteredProducts.length > 0 ? (
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3">
                            {filteredProducts.map(product => (
                                <ProductCard key={product.id} product={product} />
                            ))}
                        </div>
                    ) : (
                        <div className="bg-white rounded-3xl p-12 text-center shadow-sm">
                            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Package className="text-slate-200" size={40} />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900">No products found</h3>
                            <p className="text-slate-500 mt-1">Try adjusting your search query.</p>
                            <button
                                onClick={() => setSearchQuery('')}
                                className="mt-4 text-purple-600 font-bold text-sm hover:underline"
                            >
                                Clear search
                            </button>
                        </div>
                    )}
                </div>
                {/* Cart View / Edit Modal */}
                {isCartModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
                        <div className="bg-white w-full max-w-lg rounded-[32px] shadow-2xl p-8 animate-in zoom-in-95 duration-300 flex flex-col max-h-[85vh]">

                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600">
                                        <Package size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-slate-900">Your Cart</h3>
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{cart.length} Items</p>
                                    </div>
                                </div>
                                <button onClick={() => setIsCartModalOpen(false)} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-50 text-slate-400 transition-colors">
                                    <X size={24} />
                                </button>
                            </div>

                            {/* Cart Items List */}
                            <div className="flex-1 overflow-y-auto space-y-4 pr-2 mb-6">
                                {cart.length === 0 ? (
                                    <div className="text-center py-12 text-slate-400">
                                        <Package size={48} className="mx-auto mb-3 opacity-20" />
                                        <p className="font-bold">Your cart is empty</p>
                                    </div>
                                ) : (
                                    cart.map(item => {
                                        const product = products.find(p => p.id === item.productId);
                                        if (!product) return null;
                                        return (
                                            <div key={item.productId} className="flex items-center gap-4 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                                                <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center p-2 shrink-0">
                                                    {product.image ? (
                                                        <img src={product.image} alt="" className="w-full h-full object-contain mix-blend-multiply" />
                                                    ) : (
                                                        <Package className="text-slate-200" size={24} />
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="text-sm font-bold text-slate-900 truncate">{product.name}</h4>
                                                    <p className="text-xs font-bold text-indigo-600">₹{product.salePrice || product.price}</p>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <div className="flex items-center bg-white rounded-lg border border-slate-200 shadow-sm h-8">
                                                        <button
                                                            onClick={() => updateCartQty(item.productId, -1)}
                                                            className="w-8 h-full flex items-center justify-center hover:bg-slate-50 text-slate-600 rounded-l-lg transition-colors"
                                                        >
                                                            <Minus size={14} />
                                                        </button>
                                                        <span className="w-8 text-center text-xs font-bold text-slate-900">{item.qty}</span>
                                                        <button
                                                            onClick={() => updateCartQty(item.productId, 1)}
                                                            className="w-8 h-full flex items-center justify-center hover:bg-slate-50 text-slate-600 rounded-r-lg transition-colors"
                                                        >
                                                            <Plus size={14} />
                                                        </button>
                                                    </div>
                                                    <button
                                                        onClick={() => updateCartQty(item.productId, -item.qty)}
                                                        className="w-8 h-8 flex items-center justify-center bg-rose-50 text-rose-500 rounded-lg hover:bg-rose-100 transition-colors"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>

                            {/* Footer Actions */}
                            <div className="space-y-3 pt-4 border-t border-slate-100">
                                <div className="flex justify-between items-center px-2">
                                    <span className="text-sm font-bold text-slate-500 uppercase tracking-wide">Total Amount</span>
                                    <span className="text-2xl font-black text-slate-900">₹{cartTotal.toFixed(2)}</span>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={() => {
                                            if (confirm('Are you sure you want to clear your cart?')) {
                                                clearCart();
                                                setIsCartModalOpen(false);
                                            }
                                        }}
                                        className="py-3 bg-red-50 text-red-600 font-bold rounded-2xl hover:bg-red-100 transition-all text-sm uppercase tracking-wide flex items-center justify-center gap-2"
                                    >
                                        <Trash2 size={18} />
                                        Clear Cart
                                    </button>
                                    <button
                                        onClick={() => {
                                            setIsCartModalOpen(false);
                                            setIsCheckoutModalOpen(true);
                                        }}
                                        disabled={cart.length === 0}
                                        className="py-3 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition-all text-sm uppercase tracking-wide disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        Checkout
                                        <ChevronRight size={18} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

            </div>

            {/* Reuse Original Modals (CRUD and Transliteration Logic) */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-md rounded-[32px] shadow-2xl p-8 animate-in zoom-in-95 duration-300">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600">
                                    <Plus size={24} />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900">
                                    {editingProduct ? 'Edit Item' : 'Add New Item'}
                                </h3>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-50 text-slate-400 transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSaveProduct} className="space-y-6">
                            <div className="flex flex-col items-center gap-4">
                                <div className="relative group cursor-pointer" onClick={() => document.getElementById('productImage').click()}>
                                    <div className="w-28 h-28 rounded-3xl bg-slate-50 border-2 border-dashed border-slate-200 overflow-hidden flex items-center justify-center transition-all group-hover:border-purple-400 group-hover:bg-purple-50">
                                        {newProduct.image ? (
                                            <img src={newProduct.image} alt="Preview" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="text-center">
                                                <ImageIcon className="mx-auto text-slate-300" size={32} />
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mt-1 block">Item Photo</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-purple-600 rounded-2xl flex items-center justify-center text-white shadow-lg border-4 border-white">
                                        <Plus size={20} />
                                    </div>
                                </div>
                                <input id="productImage" type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Product Name</label>
                                    <input
                                        required
                                        type="text"
                                        value={newProduct.name}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            setNewProduct(prev => ({
                                                ...prev,
                                                name: val,
                                                nameGujarati: isManualGujarati ? prev.nameGujarati : val
                                            }));
                                        }}
                                        placeholder="e.g. Screws"
                                        className="w-full px-5 py-4 bg-slate-50 border border-transparent rounded-2xl focus:ring-4 focus:ring-purple-100 focus:bg-white focus:border-purple-600 outline-none transition-all font-medium"
                                    />
                                </div>

                                <div>
                                    <div className="flex items-center justify-between mb-2 ml-1">
                                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">Gujarati Name</label>
                                        {isTransliterating && (
                                            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-purple-50 text-purple-600 rounded-full animate-pulse">
                                                <span className="text-[10px] font-bold uppercase tracking-tight">Translating...</span>
                                            </div>
                                        )}
                                    </div>
                                    <input
                                        type="text"
                                        value={newProduct.nameGujarati}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            setNewProduct(prev => ({ ...prev, nameGujarati: val }));
                                            setIsManualGujarati(true);
                                        }}
                                        placeholder="નામ અહીં લખો"
                                        className="w-full px-5 py-4 bg-slate-50 border border-transparent rounded-2xl focus:ring-4 focus:ring-purple-100 focus:bg-white focus:border-purple-600 outline-none transition-all font-medium"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="col-span-2">
                                        <label className="block text-xs font-black text-pink-500 uppercase tracking-widest mb-2 ml-1">Fixed Sale Price</label>
                                        <div className="relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-pink-400 font-bold">₹</span>
                                            <input
                                                required
                                                type="number"
                                                value={newProduct.salePrice}
                                                onChange={(e) => setNewProduct({ ...newProduct, salePrice: e.target.value })}
                                                className="w-full pl-8 pr-5 py-4 bg-pink-50/50 border border-transparent rounded-2xl focus:ring-4 focus:ring-pink-100 focus:bg-white focus:border-pink-600 outline-none transition-all font-bold text-slate-900"
                                                placeholder="0.00"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="col-span-2">
                                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Unit</label>
                                        <select
                                            value={newProduct.unit}
                                            onChange={(e) => setNewProduct({ ...newProduct, unit: e.target.value })}
                                            className="w-full px-5 py-4 bg-slate-50 border border-transparent rounded-2xl focus:ring-4 focus:ring-purple-100 focus:bg-white focus:border-purple-600 outline-none transition-all font-medium appearance-none"
                                        >
                                            <option value="Nos.">Nos.</option>
                                            <option value="Packet">Packet</option>
                                            <option value="Box">Box</option>
                                            <option value="Kg">Kg</option>
                                            <option value="Mtr">Mtr</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <button type="submit" className="w-full py-5 bg-zepto-purple text-white rounded-[24px] shadow-xl shadow-purple-200 hover:shadow-2xl hover:scale-[1.02] active:scale-95 transition-all font-black uppercase tracking-widest mt-4">
                                {editingProduct ? 'Update Product' : 'Add to Inventory'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Sticky Checkout Bar */}
            {cart.length > 0 && (
                <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[90] w-full max-w-md px-4 animate-in slide-in-from-bottom-8 duration-500">
                    <div className="bg-zepto-purple text-white p-4 rounded-3xl shadow-2xl flex items-center justify-between border-2 border-white/20">
                        <div className="flex items-center gap-4">
                            <div className="bg-white/20 p-2 rounded-xl">
                                <Package size={24} />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-white/70 uppercase">Items in Cart</p>
                                <p className="text-sm font-black">{cart.length} Products • ₹{cartTotal.toFixed(2)}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setIsCartModalOpen(true)}
                                className="bg-white/20 text-white px-4 py-3 rounded-2xl font-bold uppercase text-xs hover:bg-white/30 transition-all backdrop-blur-sm"
                            >
                                View Cart
                            </button>
                            <button
                                onClick={() => setIsCheckoutModalOpen(true)}
                                className="bg-white text-zepto-purple px-6 py-3 rounded-2xl font-black uppercase text-sm hover:bg-slate-50 transition-all flex items-center gap-2"
                            >
                                Checkout
                                <ChevronRight size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Quick Checkout Modal */}
            {isCheckoutModalOpen && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-md rounded-[32px] shadow-2xl p-8 animate-in zoom-in-95 duration-300">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h3 className="text-xl font-bold text-slate-900">Finish Checkout</h3>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Total: ₹{cartTotal.toFixed(2)}</p>
                            </div>
                            <button onClick={() => setIsCheckoutModalOpen(false)} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-50 text-slate-400">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Customer Selection</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="Search or Select Client..."
                                        list="checkoutCustomerList"
                                        value={selectedCustomer}
                                        onChange={(e) => setSelectedCustomer(e.target.value)}
                                        className="w-full px-5 py-4 bg-slate-50 border border-transparent rounded-2xl focus:ring-4 focus:ring-purple-100 focus:bg-white focus:border-purple-600 outline-none transition-all font-bold text-slate-900"
                                    />
                                    <datalist id="checkoutCustomerList">
                                        {customers.map(c => <option key={c.id} value={c.name} />)}
                                    </datalist>
                                </div>
                            </div>

                            <button
                                onClick={handleQuickCheckout}
                                disabled={isProcessingCheckout || !selectedCustomer}
                                className="w-full py-5 bg-zepto-purple text-white rounded-[24px] shadow-xl hover:shadow-2xl transition-all font-black uppercase tracking-widest disabled:opacity-50"
                            >
                                {isProcessingCheckout ? 'Creating Invoice...' : 'Create Invoice Now'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Invoice Preview Modal (after checkout) */}
            {isInvoicePreviewOpen && createdInvoice && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-2xl max-h-[90vh] rounded-[32px] shadow-2xl flex flex-col animate-in zoom-in-95 duration-300 overflow-hidden">
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-slate-100">
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => {
                                        setIsInvoicePreviewOpen(false);
                                        setIsCheckoutModalOpen(true);
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
                                                onClick={() => {
                                                    const originalTitle = document.title;
                                                    document.title = `Standard_Bill_${createdInvoice.customer}`;
                                                    document.body.classList.add('print-mode-standard');
                                                    window.print();
                                                    document.body.classList.remove('print-mode-standard');
                                                    document.title = originalTitle;
                                                }}
                                                className="flex items-center gap-2 px-3 py-1.5 bg-white text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-50 transition-all shadow-sm"
                                            >
                                                <Printer size={14} />
                                                <span>Standard</span>
                                            </button>
                                            <button
                                                onClick={() => {
                                                    const el = document.getElementById('printable-invoice');
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
                                                }}
                                                className="flex items-center gap-2 px-3 py-1.5 hover:bg-white text-slate-500 hover:text-emerald-600 rounded-lg text-xs font-bold transition-all"
                                                title="Download Standard PDF"
                                            >
                                                <FileDown size={14} />
                                            </button>
                                        </div>

                                        <div className="flex bg-zepto-purple/10 rounded-xl p-1 gap-1">
                                            <button
                                                onClick={() => {
                                                    const originalTitle = document.title;
                                                    document.title = `Thermal_Bill_${createdInvoice.customer}`;
                                                    document.body.classList.add('print-mode-thermal');
                                                    setTimeout(() => {
                                                        window.print();
                                                        document.body.classList.remove('print-mode-thermal');
                                                        document.title = originalTitle;
                                                    }, 50);
                                                }}
                                                className="flex items-center gap-2 px-3 py-1.5 bg-zepto-purple text-white rounded-lg text-xs font-bold hover:bg-opacity-90 transition-all shadow-sm"
                                            >
                                                <Printer size={14} />
                                                <span>Thermal</span>
                                            </button>
                                            <button
                                                onClick={() => {
                                                    const el = document.getElementById('thermal-receipt');
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
                                                }}
                                                className="flex items-center gap-2 px-3 py-1.5 hover:bg-zepto-purple hover:text-white text-purple-600 rounded-lg text-xs font-bold transition-all"
                                                title="Download Thermal PDF"
                                            >
                                                <FileDown size={14} />
                                            </button>
                                        </div>
                                    </>
                                )}
                                <button onClick={() => { setIsInvoicePreviewOpen(false); setCreatedInvoice(null); setIsInvoiceConfirmed(false); }} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-50 text-slate-400">
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

                            {/* Items Table with Editable Prices */}
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
                                                    <span>{item.quantity} {item.unit || 'Nos.'} x </span>
                                                    {!isInvoiceConfirmed ? (
                                                        <div className="relative">
                                                            <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-slate-400">₹</span>
                                                            <input
                                                                type="number"
                                                                value={item.price}
                                                                onChange={(e) => {
                                                                    const newPrice = parseFloat(e.target.value) || 0;
                                                                    const updatedItems = createdInvoice.items.map((it, i) =>
                                                                        i === idx ? { ...it, price: newPrice } : it
                                                                    );
                                                                    const newTotal = updatedItems.reduce((sum, it) => sum + (it.price * it.quantity), 0);
                                                                    setCreatedInvoice(prev => ({ ...prev, items: updatedItems, total: newTotal, subtotal: newTotal }));
                                                                }}
                                                                className="w-20 pl-4 py-1 bg-white border border-slate-200 rounded-md focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all font-bold text-slate-700"
                                                            />
                                                        </div>
                                                    ) : (
                                                        <span>₹{item.price.toFixed(2)}</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <p className="text-sm font-black text-slate-900">₹{(item.quantity * item.price).toFixed(2)}</p>
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
                        <div className="bg-white w-[210mm] min-h-[297mm] p-[20mm] flex flex-col hidden print:block" id="printable-invoice">
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
                                                <td className="py-3 text-right font-bold">₹{(item.quantity * item.price).toFixed(2)}</td>
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
                        <div className="thermal-receipt hidden print:block" id="thermal-receipt">
                            <div className="text-center font-bold text-lg mb-1">SHAKTI SALES AGENCY</div>
                            <div className="text-center text-[10px] mb-2">
                                123 Industrial Hub, GIDC Zone<br />
                                Thangadh, Dist. Surendranagar Pincode - 363530<br />
                                GSTIN: 24ABCDE1234F1Z5
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
            )
            }
        </div >
    );
};

export default Products;
