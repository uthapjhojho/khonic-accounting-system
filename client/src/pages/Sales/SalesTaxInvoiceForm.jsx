import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout/Layout';
import PageHeader from '../../components/Layout/PageHeader';
import { Plus, Trash2, ChevronDown } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import taxInvoiceService from '../../services/taxInvoiceService';
import customerService from '../../services/customerService';
import SuccessModal from '../../components/Modals/SuccessModal';
import nav from '../../constants/navigation.json';
import config from '../../constants/config.json';
import taxMocks from '../../constants/tax_invoice_mocks.json';
import tradeItems from '../../constants/trade_invoice_items.json';
import linkPenjualan from '../../constants/link_penjualan.json';

const SalesTaxInvoiceForm = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEdit = !!id;
    const [showSuccess, setShowSuccess] = useState(false);
    const [duplicateError, setDuplicateError] = useState('');
    const [linkedTaxNo, setLinkedTaxNo] = useState(''); // Link Faktur Penjualan

    // Form States
    const [taxInvoiceNo, setTaxInvoiceNo] = useState('');
    const [taxNoValid, setTaxNoValid] = useState(true);
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [masaPajak, setMasaPajak] = useState('01/26');
    const [selectedCustomer, setSelectedCustomer] = useState('');
    const [selectedInvoiceId, setSelectedInvoiceId] = useState('');
    const [items, setItems] = useState([]);
    const isLinked = !!linkedTaxNo; // true when a linked invoice is selected

    // Data States
    const [customers, setCustomers] = useState([]);
    const [availableInvoices, setAvailableInvoices] = useState([]);

    // Masa Pajak Options for 2026
    const masaPajakOptions = ['01/26', '02/26', '03/26', '04/26', '05/26', '06/26', '07/26', '08/26', '09/26', '10/26', '11/26', '12/26'];

    // Unique customers for dropdown deduplication
    const uniqueCustomers = Array.from(new Map(customers.map(c => [c.name, c])).values());

    const formatTaxNo = (value) => {
        const nums = value.replace(/\D/g, '').slice(0, 16);
        let formatted = '';
        if (nums.length > 0) formatted += nums.slice(0, 3);
        if (nums.length > 3) formatted += '.' + nums.slice(3, 6);
        if (nums.length > 6) formatted += '-' + nums.slice(6, 8);
        if (nums.length > 8) formatted += '.' + nums.slice(8, 16);
        return formatted;
    };

    const handleTaxNoChange = (e) => {
        const formatted = formatTaxNo(e.target.value);
        setTaxInvoiceNo(formatted);

        // Validation
        if (formatted.length >= 7) {
            const xxx = formatted.slice(0, 3);
            const bbb = formatted.slice(4, 7);
            const yy = formatted.slice(8, 10);
            const allowedXXX = ['010', '020', '030', '040', '060', '070', '080', '090'];
            const allowedBBB = ['000', '001', '002', '003'];
            const currentYY = '26'; // Based on system time 2026

            const isXXXValid = allowedXXX.includes(xxx);
            const isBBBValid = allowedBBB.includes(bbb);
            const isYYValid = yy.length === 2 ? yy === currentYY : true;

            setTaxNoValid(isXXXValid && isBBBValid && isYYValid);
        } else {
            setTaxNoValid(true);
        }
    };


    // Fetch Customers
    useEffect(() => {
        const fetchCustomers = async () => {
            try {
                const data = await customerService.getAllCustomers();
                setCustomers(data);
            } catch (err) {
                console.error('Error fetching customers:', err);
            }
        };
        fetchCustomers();
    }, []);

    // Fetch Available Invoices when Customer changes
    useEffect(() => {
        if (!selectedCustomer) {
            setAvailableInvoices([]);
            return;
        }
        const fetchInvoices = async () => {
            try {
                const data = await taxInvoiceService.getAvailableTradeInvoices(selectedCustomer);
                setAvailableInvoices(data);
            } catch (err) {
                console.error('Error fetching available invoices:', err);
            }
        };
        fetchInvoices();
    }, [selectedCustomer]);

    // Handler for "Link Faktur Penjualan" dropdown
    const handleLinkChange = (e) => {
        const code = e.target.value;
        setLinkedTaxNo(code);
        if (!code) {
            // Clear all auto-filled fields (but leave taxInvoiceNo as-is)
            setDate(new Date().toISOString().split('T')[0]);
            setMasaPajak('01/26');
            setSelectedCustomer('');
            setSelectedInvoiceId('');
            setItems([]);
            return;
        }
        // Find the LP entry and look up mock data via tax_invoice_no
        const lpEntry = linkPenjualan.find(lp => lp.code === code);
        if (!lpEntry) return;
        const mock = taxMocks[lpEntry.tax_invoice_no];
        if (mock) {
            // Do NOT auto-fill taxInvoiceNo — user types it manually
            if (mock.date) setDate(mock.date);
            if (mock.masa_pajak) setMasaPajak(mock.masa_pajak);
            setItems(mock.items ? mock.items.map((item, idx) => ({ ...item, id: idx + 1 })) : []);
            // Find and set customer
            const customer = uniqueCustomers.find(c =>
                c.name.trim().toLowerCase() === mock.customer_name.trim().toLowerCase()
            );
            if (customer) setSelectedCustomer(customer.id.toString());
        }
    };

    // Auto-select trade invoice after linked customer's invoices are loaded
    useEffect(() => {
        if (!linkedTaxNo || availableInvoices.length === 0) return;
        const lpEntry = linkPenjualan.find(lp => lp.code === linkedTaxNo);
        if (!lpEntry) return;
        const mock = taxMocks[lpEntry.tax_invoice_no];
        if (mock) {
            const invoice = availableInvoices.find(inv =>
                (inv.invoice_no === mock.trade_invoice_no) || (inv.number === mock.trade_invoice_no)
            );
            if (invoice) setSelectedInvoiceId(invoice.id.toString());
        }
    }, [availableInvoices, linkedTaxNo]);

    // Handle Edit Mode: Fetch Tax Invoice Details
    useEffect(() => {
        if (!isEdit) return;
        const fetchDetails = async () => {
            try {
                const data = await taxInvoiceService.getTaxInvoiceById(id);
                setTaxInvoiceNo(data.tax_invoice_no);
                setDate(data.date.split('T')[0]);
                setMasaPajak(data.masa_pajak);
                setSelectedCustomer(data.customer_id);
                setSelectedInvoiceId(data.trade_invoice_id);
                setLinkedTaxNo(data.trade_invoice_no);
                setItems((data.items || []).map(item => ({
                    ...item,
                    qty: parseFloat(item.qty || 0),
                    price: parseFloat(item.price || 0),
                    total: parseFloat(item.total || 0)
                })));
            } catch (err) {
                console.error('Error fetching tax invoice details:', err);
            }
        };
        fetchDetails();
    }, [id, isEdit]);

    const addItem = () => {
        setItems([...items, { id: Date.now(), name: '', qty: 0, price: 0, total: 0 }]);
    };

    const removeItem = (id) => {
        setItems(items.filter(item => item.id !== id));
    };

    const updateItem = (id, field, value) => {
        setItems(items.map(item => {
            if (item.id === id) {
                const updatedItem = { ...item, [field]: value };
                const qty = parseFloat(updatedItem.qty || 0);
                const price = parseFloat(updatedItem.price || 0);
                if (field === 'qty' || field === 'price') {
                    updatedItem.qty = qty;
                    updatedItem.price = price;
                    updatedItem.total = qty * price;
                }
                return updatedItem;
            }
            return item;
        }));
    };

    const handleInvoiceChange = (invoiceId) => {
        setSelectedInvoiceId(invoiceId);
        const invoice = availableInvoices.find(inv => inv.id.toString() === invoiceId);
        if (invoice) {
            // Check if we have fixed items in JSON
            const invNo = invoice.invoice_no || invoice.number;
            if (tradeItems[invNo]) {
                setItems(tradeItems[invNo].map((item, idx) => ({ ...item, id: idx + 1 })));
            } else {
                // Keep manual or empty if not in JSON
                setItems([{ id: 1, name: `Penjualan atas Invoice ${invNo}`, qty: 1, price: parseFloat(invoice.total_amount), total: parseFloat(invoice.total_amount) }]);
            }
        }
    };

    const calculateTotals = () => {
        const grandTotal = items.reduce((sum, item) => sum + (parseFloat(item.total) || 0), 0);
        // DPP = Total / 1.11
        const dppValue = Math.floor(grandTotal / 1.11);
        // PPN = Total - DPP
        const ppnValue = grandTotal - dppValue;

        return { dpp: dppValue, ppn: ppnValue, total: grandTotal };
    };

    const { dpp, ppn, total } = calculateTotals();

    const handleSave = async (issuedStatus = 'Issued') => {
        setDuplicateError('');
        if (!taxNoValid) return;

        const payload = {
            tax_invoice_no: taxInvoiceNo,
            date: date,
            masa_pajak: masaPajak,
            customer_id: selectedCustomer,
            trade_invoice_id: selectedInvoiceId,
            trade_invoice_no: linkedTaxNo,
            dpp: dpp,
            ppn: ppn,
            total: total,
            items: items,
            taxX: taxInvoiceNo.slice(0, 3),
            taxB: taxInvoiceNo.slice(4, 7),
            taxY: taxInvoiceNo.slice(8, 10),
            status: issuedStatus === 'Draft' ? 'Draft' : 'Issued'
        };

        try {
            if (isEdit) {
                await taxInvoiceService.updateTaxInvoice(id, payload);
            } else {
                await taxInvoiceService.createTaxInvoice(payload);
            }
            setShowSuccess(true);
        } catch (err) {
            console.error('Error saving tax invoice:', err);
            if (err.response?.data?.error?.includes('duplicate key value violates unique constraint')) {
                setDuplicateError('Nomor Faktur Pajak sudah terdaftar');
            } else {
                alert(err.response?.data?.error || 'Gagal menyimpan faktur pajak');
            }
        }
    };

    const isFormValid = () => {
        if (!taxNoValid || taxInvoiceNo.length < 19) return false;
        if (!selectedCustomer || !selectedInvoiceId || items.length === 0) return false;

        // Ensure total matches selected invoice total if possible
        const invoice = availableInvoices.find(inv => inv.id === parseInt(selectedInvoiceId));
        if (invoice) {
            const invTotal = parseFloat(invoice.total_amount);
            if (Math.abs(total - invTotal) > 1) return false; // Use tolerance for float comparison
        }

        return true;
    };

    return (
        <Layout>
            <PageHeader
                title={nav.sales_tax.label}
                breadcrumbs={[
                    { label: nav.sales_tax.label, path: nav.sales_tax.path },
                    ...(isEdit ? [{ label: 'Detail', path: `/faktur-pajak-penjualan/detail/${id}` }] : []),
                    { label: isEdit ? 'Edit' : 'Tambah Baru' }
                ]}
            />

            <div className="max-w-6xl space-y-6 pb-20">
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 space-y-10">
                    {/* Link Faktur Penjualan — only shown when creating */}
                    {!isEdit && (
                        <div className="pb-6 border-b border-gray-100">
                            <label className="block text-sm font-semibold text-gray-900 mb-3">Link Faktur Penjualan</label>
                            <div className="relative max-w-sm">
                                <select
                                    value={linkedTaxNo}
                                    onChange={handleLinkChange}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-100 appearance-none bg-white text-sm font-medium"
                                >
                                    <option value="">-- Tidak Dilink --</option>
                                    {linkPenjualan.map(lp => (
                                        <option key={lp.code} value={lp.code}>{lp.label}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
                            </div>
                        </div>
                    )}

                    {/* Invoice Info */}
                    <div className="grid grid-cols-3 gap-8">
                        <div>
                            <label className="block text-sm font-semibold text-gray-900 mb-3"><span className="text-red-500 mr-1">*</span>Nomor Seri Faktur Pajak</label>
                            <input
                                type="text"
                                value={taxInvoiceNo}
                                onChange={handleTaxNoChange}
                                placeholder="010.000-25.12345678"
                                className={`w-full px-4 py-3 rounded-xl border ${(!isLinked && !taxNoValid) ? 'border-red-500 focus:ring-red-50' : 'border-gray-200 focus:ring-gray-100'} focus:outline-none focus:ring-2 text-sm font-medium`}
                            />
                            {(!isLinked && !taxNoValid) && <p className="text-[10px] text-red-500 mt-1 font-medium">Kode transaksi tidak valid.</p>}
                            {duplicateError && <p className="text-[10px] text-red-500 mt-1 font-medium">{duplicateError}</p>}
                            <button className="text-[10px] text-blue-500 mt-2 font-medium hover:underline">Minta Dari Faktur Pajak</button>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-900 mb-3"><span className="text-red-500 mr-1">*</span>Tanggal Faktur</label>
                            <div className="relative">
                                <input
                                    type="date"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    onKeyDown={(e) => e.preventDefault()}
                                    disabled={isEdit || isLinked}
                                    className={`w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-100 text-sm font-medium ${(isEdit || isLinked) ? 'bg-gray-50 text-gray-400 cursor-not-allowed' : ''}`}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-900 mb-3">Masa Pajak</label>
                            <div className="relative">
                                <select
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-100 appearance-none bg-white text-sm font-medium"
                                    value={masaPajak}
                                    onChange={(e) => setMasaPajak(e.target.value)}
                                >
                                    {masaPajakOptions.map(option => (
                                        <option key={option} value={option}>{option}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
                            </div>
                        </div>
                    </div>

                    {/* Penjual */}
                    <div className="space-y-4">
                        <h3 className="font-bold text-gray-900">Penjual</h3>
                        <div className="p-4 bg-white border-l-4 border-green-500 rounded-lg space-y-1 text-sm shadow-sm">
                            <p className="text-gray-900 font-bold">PT. Khonic Sejahtera</p>
                            <p className="text-gray-500 text-xs">Jl. Jenderal Sudirman No. 1, Jakarta</p>
                            <p className="text-gray-500 text-xs">NPWP: 01.123.456.7-890.123</p>
                        </div>
                    </div>

                    {/* Pembeli */}
                    <div className="space-y-4">
                        <h3 className="font-bold text-gray-900">Pembeli</h3>
                        <div className="grid grid-cols-2 gap-8">
                            <div>
                                <label className="block text-sm font-semibold text-gray-900 mb-3"><span className="text-red-500 mr-1">*</span>Pilih Pembeli</label>
                                <div className="relative">
                                    <select
                                        className={`w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-100 appearance-none bg-white text-sm font-medium ${(isEdit || isLinked) ? 'bg-gray-50 text-gray-400 cursor-not-allowed' : ''}`}
                                        value={selectedCustomer}
                                        disabled={isEdit || isLinked}
                                        onChange={(e) => {
                                            setSelectedCustomer(e.target.value);
                                            setSelectedInvoiceId('');
                                            setItems([]);
                                        }}
                                    >
                                        <option value="">Pilih Pembeli</option>
                                        {uniqueCustomers.map(customer => (
                                            <option key={customer.id} value={customer.id.toString()}>{customer.name}</option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-900 mb-3"><span className="text-red-500 mr-1">*</span>Pilih Invoice</label>
                                <div className="relative">
                                    <select
                                        className={`w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-100 appearance-none bg-white text-sm font-medium ${(!selectedCustomer || isEdit || isLinked) ? 'bg-gray-50 text-gray-400 cursor-not-allowed' : ''}`}
                                        value={selectedInvoiceId}
                                        disabled={!selectedCustomer || isEdit || isLinked}
                                        onChange={(e) => handleInvoiceChange(e.target.value)}
                                    >
                                        <option value="">Pilih Invoice</option>
                                        {availableInvoices.map(inv => (
                                            <option key={inv.id} value={inv.id.toString()}>{inv.invoice_no || inv.number}</option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Items */}
                    <div className="space-y-6">
                        <h3 className="font-bold text-gray-900">Detail Barang / Jasa</h3>
                        <div className="space-y-4">
                            <div className="grid grid-cols-12 gap-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider px-2">
                                <div className="col-span-5">Nama Barang / Jasa</div>
                                <div className="col-span-2 text-center">Kuantitas</div>
                                <div className="col-span-2 text-center">Harga Satuan</div>
                                <div className="col-span-3 text-right pr-12">Total</div>
                            </div>

                            {items.map((item) => (
                                <div key={item.id} className="grid grid-cols-12 gap-4 items-center animate-in fade-in slide-in-from-top-1 duration-200">
                                    <div className="col-span-5">
                                        <input
                                            type="text"
                                            value={item.name}
                                            onChange={(e) => updateItem(item.id, 'name', e.target.value)}
                                            placeholder="Nama Barang / Jasa"
                                            disabled={isEdit || isLinked}
                                            className={`w-full px-4 py-3 rounded-xl border border-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-100 text-sm font-medium bg-gray-50/50 ${(isEdit || isLinked) ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <input
                                            type="number"
                                            value={item.qty}
                                            onChange={(e) => updateItem(item.id, 'qty', parseInt(e.target.value) || 0)}
                                            disabled={isEdit || isLinked}
                                            className={`w-full px-4 py-3 rounded-xl border border-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-100 text-sm text-center font-bold bg-gray-50/50 ${(isEdit || isLinked) ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <div className="relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">Rp</span>
                                            <input
                                                type="text"
                                                value={new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(item.price)}
                                                onChange={(e) => {
                                                    const rawValue = e.target.value.replace(/\D/g, '');
                                                    updateItem(item.id, 'price', parseInt(rawValue) || 0);
                                                }}
                                                disabled={isEdit || isLinked}
                                                className={`w-full pl-10 pr-2 py-3 rounded-xl border border-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-100 text-sm text-right font-black bg-gray-50/50 overflow-hidden ${(isEdit || isLinked) ? 'opacity-50 cursor-not-allowed' : ''}`}
                                            />
                                        </div>
                                    </div>
                                    <div className="col-span-3 flex items-center justify-between">
                                        <div className="w-full px-3 py-3 rounded-xl bg-gray-50/50 flex items-center justify-end gap-1 opacity-80 pointer-events-none overflow-hidden">
                                            <span className="text-xs font-bold text-gray-400 shrink-0">Rp</span>
                                            <span className="text-sm font-black text-gray-900 truncate">
                                                {new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(item.total)}
                                            </span>
                                        </div>
                                        {(!isEdit && !isLinked) && (
                                            <button
                                                onClick={() => removeItem(item.id)}
                                                className="ml-4 p-2 text-red-300 hover:text-red-500 transition-colors"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}

                            {(!isEdit && !isLinked) && (
                                <button
                                    onClick={addItem}
                                    className="flex items-center gap-2 text-green-500 font-bold text-sm hover:text-green-600 transition-colors mt-2 ml-auto"
                                >
                                    <Plus size={18} />
                                    Tambah Baris
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Summary */}
                    <div className="border-t border-gray-100 pt-8 space-y-3">
                        <div className="flex justify-end items-center gap-12">
                            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">DPP</span>
                            <span className="font-bold text-gray-900 w-48 text-right text-base">
                                Rp {dpp.toLocaleString('id-ID')}
                            </span>
                        </div>
                        <div className="flex justify-end items-center gap-12">
                            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">PPN (11%)</span>
                            <span className="font-bold text-gray-900 w-48 text-right text-base">
                                Rp {ppn.toLocaleString('id-ID')}
                            </span>
                        </div>
                        <div className="flex justify-end items-center gap-12 pt-2">
                            <span className="text-[11px] font-black text-gray-900 uppercase tracking-widest">Total</span>
                            <span className="font-black text-gray-900 w-48 text-right text-2xl tracking-tight">
                                Rp {total.toLocaleString('id-ID')}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-4 mt-8">
                    <button
                        onClick={() => navigate(-1)}
                        className="px-8 py-3 rounded-xl border border-gray-200 text-gray-700 font-bold hover:bg-gray-50 transition-all text-sm"
                    >
                        Batal
                    </button>
                    <button
                        onClick={() => handleSave('Draft')}
                        disabled={!isFormValid()}
                        className={`px-8 py-3 rounded-xl border border-gray-200 font-bold transition-all text-sm ${isFormValid() ? 'text-gray-700 hover:bg-gray-50' : 'text-gray-300 cursor-not-allowed opacity-50'}`}
                    >
                        Simpan Draft
                    </button>
                    <button
                        onClick={() => handleSave('Issued')}
                        disabled={!isFormValid()}
                        className={`px-12 py-3 rounded-xl font-bold transition-all shadow-sm text-sm ${isFormValid() ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
                    >
                        {isEdit ? 'Simpan Perubahan' : 'Simpan Faktur'}
                    </button>
                </div>
            </div>

            <SuccessModal
                isOpen={showSuccess}
                onClose={() => {
                    window.location.href = '/faktur-pajak-penjualan';
                }}
                title="Berhasil Simpan Faktur Pajak Penjualan"
                message="Faktur Pajak Penjualan berhasil disimpan!"
            />
        </Layout>
    );
};

export default SalesTaxInvoiceForm;
