import React, { useState, useEffect } from 'react';
import { X, Check, Search, ChevronDown, Plus, Minus, AlertCircle } from 'lucide-react';
import customerService from '../../services/customerService';
import invoiceService from '../../services/invoiceService';
import discountService from '../../services/discountService';
import { formatCurrency, formatDate } from '../../utils/formatUtils';
import SuccessModal from './SuccessModal';
// Discount account codes and names

const RecordPaymentModal = ({ isOpen, onClose }) => {
    const [showSuccess, setShowSuccess] = useState(false);
    const [customers, setCustomers] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [discounts, setDiscounts] = useState(discountsData);
    const [selectedCustomer, setSelectedCustomer] = useState('');
    const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
    const [invoices, setInvoices] = useState([]);
    const [selectedInvoices, setSelectedInvoices] = useState({});
    const [allocations, setAllocations] = useState({});
    const [setorTo, setSetorTo] = useState('');
    const [selectedDiscount, setSelectedDiscount] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            // Reset to default states on each open
            setSelectedCustomer('');
            setPaymentDate(new Date().toISOString().split('T')[0]);
            setInvoices([]);
            setSelectedInvoices({});
            setAllocations({});
            setSetorTo('');
            setSelectedDiscount('');
            fetchInitialData();
        }
    }, [isOpen]);

    useEffect(() => {
        if (selectedCustomer) {
            fetchCustomerInvoices(selectedCustomer);
        } else {
            setInvoices([]);
        }
    }, [selectedCustomer]);

    const fetchInitialData = async () => {
        try {
            const [custRes, accRes] = await Promise.all([
                fetch('/api/sales/customers'),
                fetch('/api/accounts')
            ]);

            const custData = await custRes.json();
            const accData = await accRes.json();

            setCustomers(custData);
            const filteredAccounts = accData.filter(a => a.parent_id === '111.000' && a.status === 'Active');
            setAccounts(filteredAccounts);

            if (filteredAccounts.length > 0) setSetorTo(filteredAccounts[0].id);
        } catch (err) {
            console.error('Error fetching initial data:', err);
        }
    };

    const fetchCustomerInvoices = async (customerId) => {
        try {
            setLoading(true);
            const res = await fetch(`/api/sales/customers/${customerId}/invoices`);
            const data = await res.json();
            setInvoices(data);

            // Auto-check if items exist
            const initialSelected = {};
            const initialAllocations = {};
            data.forEach(inv => {
                initialSelected[inv.id] = false;
                initialAllocations[inv.id] = '';
            });
            setSelectedInvoices(initialSelected);
            setAllocations(initialAllocations);
        } catch (err) {
            console.error('Error fetching invoices:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleInvoice = (id) => {
        setSelectedInvoices(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const handleAllocationChange = (id, value) => {
        const cleanValue = value.replace(/[^0-9]/g, '');
        setAllocations(prev => ({ ...prev, [id]: cleanValue }));
    };

    const getDiscountedAmount = (amount) => {
        if (!selectedDiscount) return amount;
        const discount = discounts.find(d => d.code === selectedDiscount);
        if (!discount) return amount;
        return Math.round(amount * (1 - parseFloat(discount.percentage) / 100));
    };

    const totalAllocated = Object.keys(selectedInvoices).reduce((sum, id) => {
        if (selectedInvoices[id]) {
            return sum + (parseInt(allocations[id]) || 0);
        }
        return sum;
    }, 0);

    const totalRemaining = Object.keys(selectedInvoices).reduce((sum, id) => {
        if (selectedInvoices[id]) {
            const inv = invoices.find(i => i.id === parseInt(id));
            if (inv) {
                const discountedTotal = getDiscountedAmount(parseFloat(inv.total_amount));
                const sisa = discountedTotal - parseFloat(inv.paid_amount);
                return sum + sisa;
            }
        }
        return sum;
    }, 0);

    const sisaAlokasi = totalAllocated - totalRemaining;

    // Validation: Clickable only if at least one invoice is "Lunas"
    const hasAtLeastOneLunas = Object.keys(selectedInvoices).some(id => {
        if (!selectedInvoices[id]) return false;
        const inv = invoices.find(i => i.id === parseInt(id));
        if (!inv) return false;
        const discountedTotal = getDiscountedAmount(parseFloat(inv.total_amount));
        const sisaTagihan = discountedTotal - parseFloat(inv.paid_amount);
        const allocNum = parseInt(allocations[id]) || 0;
        return allocNum >= sisaTagihan;
    });

    const isSaveDisabled = !selectedCustomer || totalAllocated === 0 || !hasAtLeastOneLunas || sisaAlokasi < 0;

    const handleSave = async () => {
        try {
            const finalAllocations = Object.keys(selectedInvoices)
                .filter(id => selectedInvoices[id])
                .map(id => ({
                    invoiceId: parseInt(id),
                    amount: parseInt(allocations[id]) || 0
                }));

            const response = await fetch('/api/sales/payments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    customerId: selectedCustomer,
                    paymentDate,
                    accountId: setorTo,
                    discountCode: selectedDiscount,
                    allocations: finalAllocations
                })
            });

            if (response.ok) {
                setShowSuccess(true);
            }
        } catch (err) {
            console.error('Error saving payment:', err);
        }
    };

    const handleCloseSuccess = () => {
        setShowSuccess(false);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <>
            <div className="fixed inset-0 flex items-center justify-center z-50" style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)' }}>
                <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-gray-100">
                        <h2 className="text-xl font-bold text-gray-900">Catat Pembayaran Pelanggan</h2>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                            <X size={24} />
                        </button>
                    </div>

                    <div className="p-6 space-y-6">
                        {/* Header Input */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                <span className="text-red-500">*</span> Nama Pelanggan
                            </label>
                            <div className="relative">
                                <select
                                    value={selectedCustomer}
                                    onChange={(e) => setSelectedCustomer(e.target.value)}
                                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none appearance-none bg-white"
                                >
                                    <option value="">Pilih pelanggan</option>
                                    {customers.map(customer => (
                                        <option key={customer.id} value={customer.id}>{customer.name}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    <span className="text-red-500">*</span> Tanggal Pembayaran
                                </label>
                                <div className="relative">
                                    <input
                                        type="date"
                                        value={paymentDate}
                                        onChange={(e) => setPaymentDate(e.target.value)}
                                        onKeyDown={(e) => e.preventDefault()}
                                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    <span className="text-red-500">*</span> Setor ke Akun
                                </label>
                                <div className="relative">
                                    <select
                                        value={setorTo}
                                        onChange={(e) => setSetorTo(e.target.value)}
                                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none appearance-none bg-white"
                                    >
                                        {accounts.map(a => (
                                            <option key={a.id} value={a.id}>{a.code} - {a.name}</option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Diskon
                                </label>
                                <div className="relative">
                                    <select
                                        value={selectedDiscount}
                                        onChange={(e) => setSelectedDiscount(e.target.value)}
                                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none appearance-none bg-white"
                                    >
                                        <option value="">Pilih diskon (jika ada)</option>
                                        {discounts.map(d => (
                                            <option key={d.code} value={d.code}>{d.code} - {d.name}</option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                </div>
                            </div>
                        </div>

                        {/* Allocation Table */}
                        <div>
                            <h3 className="text-sm font-bold text-gray-900 mb-4">Alokasi Pembayaran</h3>
                            <div className="bg-gray-50 rounded-lg p-3 grid grid-cols-12 gap-4 text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                                <div className="col-span-1 text-center"><Minus size={16} className="mx-auto" /></div>
                                <div className="col-span-4">Faktur</div>
                                <div className="col-span-3 text-right">Sisa Tagihan</div>
                                <div className="col-span-4 text-right">Alokasi Pembayaran</div>
                            </div>

                            {loading ? (
                                <div className="py-10 text-center text-gray-500 text-sm">Memuat daftar invoice...</div>
                            ) : invoices.length === 0 ? (
                                <div className="py-10 text-center text-gray-500 text-sm">
                                    {selectedCustomer ? 'Tidak ada invoice yang perlu dibayar.' : 'Pilih pelanggan untuk melihat invoice.'}
                                </div>
                            ) : (
                                invoices.map(inv => {
                                    const discountedTotal = getDiscountedAmount(parseFloat(inv.total_amount));
                                    const sisaTagihan = discountedTotal - parseFloat(inv.paid_amount);
                                    const allocation = allocations[inv.id] || '';
                                    const isSelected = selectedInvoices[inv.id];
                                    const allocNum = parseInt(allocation) || 0;

                                    return (
                                        <div key={inv.id} className={`grid grid-cols-12 gap-4 items-center py-3 border-b border-gray-50 ${isSelected ? 'bg-gray-50/50' : 'bg-white'}`}>
                                            <div className="col-span-1 flex justify-center">
                                                <button
                                                    onClick={() => handleToggleInvoice(inv.id)}
                                                    className={`w-6 h-6 rounded-md flex items-center justify-center transition-all ${isSelected ? 'bg-gray-600 shadow-sm' : 'border-2 border-gray-300 hover:border-gray-400'}`}
                                                >
                                                    {isSelected && <Check size={16} className="text-white" strokeWidth={3} />}
                                                </button>
                                            </div>
                                            <div className="col-span-4 text-sm font-bold text-gray-900">
                                                {inv.invoice_no} ({formatDate(inv.date)})
                                            </div>
                                            <div className="col-span-3 text-right text-sm font-bold text-gray-900">
                                                {formatCurrency(sisaTagihan)}
                                            </div>
                                            <div className="col-span-4 px-2">
                                                <div className="relative">
                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xs">Rp</span>
                                                    <input
                                                        type="text"
                                                        value={isSelected ? (allocation === '' ? '' : formatNumber(allocation)) : '0'}
                                                        onChange={(e) => handleAllocationChange(inv.id, e.target.value)}
                                                        placeholder="0"
                                                        className={`w-full pl-8 pr-3 py-2.5 text-right rounded-xl border-2 font-bold focus:ring-0 outline-none transition-all ${isSelected ? 'border-gray-300 text-gray-900 bg-white' : 'border-gray-100 text-gray-300 bg-gray-50 opacity-50 cursor-not-allowed'}`}
                                                        readOnly={!isSelected}
                                                    />
                                                </div>
                                                {isSelected && allocation !== '' && (
                                                    <div className="text-right text-[10px] font-bold mt-1 uppercase flex justify-end items-center gap-1 tracking-tight">
                                                        {allocNum >= sisaTagihan ? (
                                                            <span className="text-green-600 flex items-center gap-1">LUNAS <Check size={10} strokeWidth={3} /></span>
                                                        ) : (
                                                            <span className="text-gray-500">BELUM LUNAS</span>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        {/* Summary */}
                        <div className="flex justify-end gap-12 pt-4">
                            <div className="text-center">
                                <div className="text-[10px] text-gray-500 mb-1 uppercase tracking-wider font-bold">Diskon</div>
                                <div className="text-lg font-bold text-gray-900">{selectedDiscount ? (discounts.find(d => d.code === selectedDiscount)?.percentage + '%') : '0%'}</div>
                            </div>
                            <div className="text-right">
                                <div className="text-[10px] text-gray-500 mb-1 uppercase tracking-wider font-bold">Total Dialokasikan</div>
                                <div className="text-lg font-bold text-gray-900">{formatCurrency(totalAllocated)}</div>
                            </div>
                            <div className="text-right">
                                <div className="text-[10px] text-gray-500 mb-1 uppercase tracking-wider font-bold">Sisa Alokasi</div>
                                <div className={`text-lg font-bold ${sisaAlokasi < 0 ? 'text-red-500' : 'text-green-600'}`}>
                                    {sisaAlokasi < 0 ? '-' : '+'} {formatCurrency(Math.abs(sisaAlokasi))}
                                </div>
                            </div>
                        </div>

                    </div>

                    <div className="p-6 border-t border-gray-100 flex justify-between bg-white rounded-b-lg gap-4">
                        <button onClick={onClose} className="px-8 py-4 rounded-xl border-2 border-gray-200 text-gray-700 font-bold hover:bg-gray-50 transition-all w-full">
                            Batal
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={isSaveDisabled}
                            className={`px-8 py-4 rounded-xl font-bold shadow-lg transition-all w-full ${isSaveDisabled ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-green-600 text-white hover:bg-green-700 shadow-green-100'}`}
                        >
                            Simpan Pembayaran
                        </button>
                    </div>
                </div>
            </div>

            <SuccessModal
                isOpen={showSuccess}
                onClose={handleCloseSuccess}
                title="Berhasil Simpan Pembayaran"
                message="Data pembayaran pelanggan telah berhasil dicatat dalam sistem!"
            />
        </>
    );
};

export default RecordPaymentModal;
