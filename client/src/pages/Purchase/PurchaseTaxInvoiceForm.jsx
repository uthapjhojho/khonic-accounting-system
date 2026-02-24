import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout/Layout';
import PageHeader from '../../components/Layout/PageHeader';
import { ChevronDown, Upload } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import taxInvoiceService from '../../services/taxInvoiceService';
import SuccessModal from '../../components/Modals/SuccessModal';
import mockData from '../../data/mockData.json';
import config from '../../constants/config.json';
import nav from '../../constants/navigation.json';
import taxMocks from '../../constants/tax_invoice_mocks.json';

const PurchaseTaxInvoiceForm = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEdit = !!id;
    const [taxInvoiceNo, setTaxInvoiceNo] = useState('');
    const [taxNoValid, setTaxNoValid] = useState(true);
    const [taxDate, setTaxDate] = useState(new Date().toISOString().split('T')[0]);
    const [receivedDate, setReceivedDate] = useState(new Date().toISOString().split('T')[0]);
    const [masaPajak, setMasaPajak] = useState('01/26');
    const [status, setStatus] = useState('Draft');
    const [showSuccess, setShowSuccess] = useState(false);
    const [duplicateError, setDuplicateError] = useState('');
    const [file, setFile] = useState(null);
    const [items, setItems] = useState([]);
    const [poNumber, setPoNumber] = useState('');
    const [supplierName, setSupplierName] = useState('');
    const [loading, setLoading] = useState(isEdit);

    useEffect(() => {
        const fetchData = async () => {
            try {
                if (isEdit) {
                    const data = await taxInvoiceService.getPurchaseTaxInvoiceById(id);
                    setTaxInvoiceNo(data.tax_invoice_no);
                    setTaxDate(data.date.split('T')[0]);
                    setReceivedDate(data.received_date.split('T')[0]);
                    setMasaPajak(data.masa_pajak);
                    setPoNumber(data.po_no);
                    setSupplierName(data.supplier_name);
                    setStatus(data.status);
                    setItems((data.items || []).map(item => ({
                        ...item,
                        qty: parseFloat(item.qty || 0),
                        price: parseFloat(item.price || 0),
                        total: parseFloat(item.total || 0)
                    })));
                    setLoading(false);
                }
            } catch (err) {
                console.error('Error fetching data:', err);
                setLoading(false);
            }
        };
        fetchData();
    }, [id, isEdit]);

    // Mock PO Data from JSON
    const poData = mockData.purchase_orders;

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
            const xxxPart = formatted.slice(0, 3);
            const bbbPart = formatted.slice(4, 7);
            const yy = formatted.slice(8, 10);
            const allowedXXX = ['010', '020', '030', '040', '060', '070', '080', '090'];
            const allowedBBB = ['000', '001', '002', '003'];
            const currentYY = '26';

            const isXXXValid = allowedXXX.includes(xxxPart);
            const isBBBValid = allowedBBB.includes(bbbPart);
            const isYYValid = yy.length === 2 ? yy === currentYY : true;

            setTaxNoValid(isXXXValid && isBBBValid && isYYValid);
        } else {
            setTaxNoValid(true);
        }
    };

    const handlePoChange = (e) => {
        const poNum = e.target.value;
        setPoNumber(poNum);
        const po = poData[poNum];
        if (po) {
            setItems(po.items.map((item, idx) => ({ ...item, id: idx })));
            setSupplierName(po.supplier);
        } else {
            setItems([]);
            setSupplierName('');
        }
    };

    const currentPo = poData[poNumber] || { supplier: supplierName, items: [] };

    const updateItem = (id, field, value) => {
        setItems(items.map(item => {
            if (item.id === id) {
                const updated = { ...item, [field]: value };
                if (field === 'qty' || field === 'price') {
                    updated.total = updated.qty * updated.price;
                }
                return updated;
            }
            return item;
        }));
    };

    const calculateTotals = () => {
        const dppValue = items.reduce((sum, item) => sum + (parseFloat(item.total) || 0), 0);
        const ppnValue = Math.floor(dppValue * config.tax_rate);
        const totalValue = dppValue + ppnValue;
        return { dpp: dppValue, ppn: ppnValue, total: totalValue };
    };

    const { dpp, ppn, total } = calculateTotals();

    const handleFileChange = (e) => {
        if (e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleSave = async (newStatus = null) => {
        setDuplicateError('');
        if (!taxNoValid) return;

        const payload = {
            tax_invoice_no: taxInvoiceNo,
            date: taxDate,
            received_date: receivedDate,
            masa_pajak: masaPajak,
            po_no: poNumber,
            supplier_name: supplierName,
            dpp: dpp,
            ppn: ppn,
            total: total,
            items,
            taxX: taxInvoiceNo.slice(0, 3),
            taxB: taxInvoiceNo.slice(4, 7),
            taxY: taxInvoiceNo.slice(8, 10),
            status: newStatus || status || 'Draft'
        };

        try {
            if (isEdit) {
                await taxInvoiceService.updatePurchaseTaxInvoice(id, payload);
            } else {
                await taxInvoiceService.createPurchaseTaxInvoice(payload);
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
        if (!poNumber || items.length === 0) return false;
        if (new Date(receivedDate) < new Date(taxDate)) return false;
        return true;
    };

    const handleCloseSuccess = () => {
        window.location.href = '/faktur-pajak-pembelian';
    };

    return (
        <Layout>
            <div className="max-w-6xl space-y-6 pb-20">
                <PageHeader
                    title={nav.purchase_tax.label}
                    breadcrumbs={[
                        { label: nav.purchase_tax.label, path: nav.purchase_tax.path },
                        { label: isEdit ? 'Edit Faktur' : 'Tambah Baru' }
                    ]}
                />

                {loading ? (
                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
                        <div className="flex items-center justify-center py-12">
                            <div className="text-sm font-medium text-gray-500 italic">Memuat data faktur...</div>
                        </div>
                    </div>
                ) : (
                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 space-y-10">
                        {/* Data PO Section */}
                        <div className="space-y-6">
                            <h3 className="font-bold text-gray-900 text-lg">Data PO</h3>
                            <div className="grid grid-cols-3 gap-8">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-900 mb-3">
                                        <span className="text-red-500">* </span>Purchase Order (PO)
                                    </label>
                                    <div className="relative">
                                        <select
                                            className={`w-full px-4 py-3 rounded-xl border ${isEdit ? 'border-transparent bg-gray-50 text-gray-400 cursor-not-allowed' : 'border-gray-200 bg-white text-gray-900'} focus:outline-none focus:ring-2 focus:ring-gray-100 appearance-none text-sm font-medium`}
                                            value={poNumber}
                                            onChange={handlePoChange}
                                            disabled={isEdit}
                                        >
                                            <option value="">Pilih PO</option>
                                            {Object.keys(poData).map(po => (
                                                <option key={po} value={po}>
                                                    {po} {poData[po].supplier}
                                                </option>
                                            ))}
                                        </select>
                                        {!isEdit && <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={20} />}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-900 mb-3">Nama Supplier</label>
                                    <input
                                        type="text"
                                        value={supplierName}
                                        readOnly
                                        className="w-full px-4 py-3 rounded-xl border border-transparent bg-gray-50 text-gray-400 focus:outline-none text-sm font-medium"
                                        placeholder="Nama Supplier"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-900 mb-3">Nomor PO</label>
                                    <input
                                        type="text"
                                        value={poNumber}
                                        disabled
                                        className="w-full px-4 py-3 rounded-xl border border-transparent bg-gray-50 text-gray-400 focus:outline-none text-sm font-medium cursor-not-allowed"
                                        placeholder="PO - 000"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Data Faktur Pajak Section */}
                        <div className="space-y-6">
                            <h3 className="font-bold text-gray-900 text-lg">Data Faktur Pajak</h3>
                            <div className="grid grid-cols-3 gap-8">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-900 mb-3"><span className="text-red-500 mr-1">*</span>Nomor Seri Faktur Pajak</label>
                                    <input
                                        type="text"
                                        value={taxInvoiceNo}
                                        onChange={handleTaxNoChange}
                                        placeholder="010.000-25.12345678"
                                        className={`w-full px-4 py-3 rounded-xl border ${taxNoValid ? 'border-gray-200 focus:ring-gray-100' : 'border-red-500 focus:ring-red-50'} focus:outline-none focus:ring-2 text-sm font-medium`}
                                    />
                                    {!taxNoValid && <p className="text-[10px] text-red-500 mt-1 font-medium">Kode transaksi tidak valid.</p>}
                                    {duplicateError && <p className="text-[10px] text-red-500 mt-1 font-medium">{duplicateError}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-900 mb-3">
                                        <span className="text-red-500">* </span>Tanggal Faktur
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="date"
                                            value={taxDate}
                                            onChange={(e) => setTaxDate(e.target.value)}
                                            onKeyDown={(e) => e.preventDefault()}
                                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-100 text-sm"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-900 mb-3">Tanggal Diterima</label>
                                    <div className="relative">
                                        <input
                                            type="date"
                                            value={receivedDate}
                                            onChange={(e) => setReceivedDate(e.target.value)}
                                            onKeyDown={(e) => e.preventDefault()}
                                            className={`w-full px-4 py-3 rounded-xl border ${new Date(receivedDate) < new Date(taxDate) ? 'border-red-500 focus:ring-red-50' : 'border-gray-200 focus:ring-gray-100'} focus:outline-none focus:ring-2 text-sm`}
                                        />
                                        {new Date(receivedDate) < new Date(taxDate) && (
                                            <p className="text-[10px] text-red-500 mt-1 font-medium">Tanggal Diterima tidak boleh lebih awal dari Tanggal Faktur.</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Document Upload Section */}
                        <div className="space-y-6">
                            <h3 className="font-bold text-gray-900 text-lg">Lampirkan Dokumen (Optional)</h3>
                            <div className="border border-dashed border-gray-200 rounded-2xl p-12 flex flex-col items-center justify-center text-center hover:bg-gray-50 transition-colors cursor-pointer relative group">
                                {!isEdit && (
                                    <input
                                        type="file"
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-not-allowed"
                                        onChange={handleFileChange}
                                        disabled={isEdit}
                                    />
                                )}
                                {file ? (
                                    <div className="flex flex-col items-center gap-2 text-green-600 font-bold">
                                        <Upload size={48} strokeWidth={1.5} className="mb-2" />
                                        <span>{file.name}</span>
                                    </div>
                                ) : (
                                    <>
                                        <Upload size={48} strokeWidth={1.5} className="text-gray-300 mb-4 group-hover:text-gray-400 transition-colors" />
                                        <p className="font-bold text-gray-900">
                                            <span className="text-green-500">Upload atau tarik file</span> dokumen
                                        </p>
                                        <p className="text-[11px] text-gray-400 mt-1 uppercase font-bold tracking-wider">PDF, XLSX ukuran maks 5MB dan maks 10 file</p>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Items Table */}
                        <div className="space-y-6">
                            <h3 className="font-bold text-gray-900 text-lg">Detail Barang / Jasa</h3>
                            <div className="overflow-hidden">
                                <div className="bg-gray-50/50 rounded-xl px-4 py-4 grid grid-cols-12 gap-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-4 border border-gray-50">
                                    <div className="col-span-6">Nama Barang / Jasa</div>
                                    <div className="col-span-2 text-center">Kuantitas</div>
                                    <div className="col-span-2 text-center">Harga Satuan</div>
                                    <div className="col-span-2 text-right">Total</div>
                                </div>

                                {items.length > 0 ? (
                                    <div className="space-y-4 px-2">
                                        {items.map((item, idx) => (
                                            <div key={idx} className="grid grid-cols-12 gap-4 items-center">
                                                <div className="col-span-6">
                                                    <input
                                                        type="text"
                                                        value={item.name}
                                                        onChange={(e) => updateItem(item.id, 'name', e.target.value)}
                                                        disabled
                                                        className="w-full px-4 py-3 rounded-xl border border-transparent focus:outline-none text-sm font-medium bg-gray-50 text-gray-400 cursor-not-allowed"
                                                    />
                                                </div>
                                                <div className="col-span-2">
                                                    <input
                                                        type="number"
                                                        value={item.qty}
                                                        onChange={(e) => updateItem(item.id, 'qty', parseInt(e.target.value) || 0)}
                                                        disabled
                                                        className="w-full px-4 py-3 rounded-xl border border-transparent focus:outline-none text-sm text-center font-bold bg-gray-50 text-gray-400 cursor-not-allowed"
                                                    />
                                                </div>
                                                <div className="col-span-2">
                                                    <div className="relative">
                                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">Rp</span>
                                                        <input
                                                            type="text"
                                                            value={new Intl.NumberFormat('id-ID').format(item.price)}
                                                            onChange={(e) => {
                                                                const rawValue = e.target.value.replace(/\D/g, '');
                                                                updateItem(item.id, 'price', parseInt(rawValue) || 0);
                                                            }}
                                                            disabled
                                                            className="w-full pl-10 pr-4 py-3 rounded-xl border border-transparent focus:outline-none text-sm text-right font-black bg-gray-50 text-gray-400 cursor-not-allowed"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="col-span-2 flex items-center justify-between">
                                                    <div className="w-full px-4 py-3 rounded-xl bg-gray-50/50 text-right opacity-80 pointer-events-none">
                                                        <span className="text-xs font-bold text-gray-400 mr-2">Rp</span>
                                                        <span className="text-sm font-black text-gray-900">
                                                            {new Intl.NumberFormat('id-ID').format(item.total)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="py-12 text-center text-gray-300 text-sm font-medium italic">
                                        Pilih Purchase Order untuk memuat item.
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Summary */}
                        <div className="border-t border-gray-50 pt-8 space-y-2">
                            <div className="flex justify-end items-center gap-6">
                                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">DPP</span>
                                <span className="font-bold text-gray-900 w-40 text-right text-lg">Rp{dpp.toLocaleString('id-ID')}</span>
                            </div>
                            <div className="flex justify-end items-center gap-6">
                                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">PPN (11%)</span>
                                <span className="font-bold text-gray-900 w-40 text-right text-lg">Rp{ppn.toLocaleString('id-ID')}</span>
                            </div>
                            <div className="flex justify-end items-center gap-6 pt-2">
                                <span className="text-[11px] font-black text-gray-900 uppercase tracking-widest">Total</span>
                                <span className="font-black text-gray-900 w-40 text-right text-2xl tracking-tighter">Rp{total.toLocaleString('id-ID')}</span>
                            </div>
                        </div>

                        {/* Footer Actions */}
                        <div className="flex justify-end gap-4 mt-8">
                            <button
                                onClick={() => navigate(-1)}
                                className="px-10 py-3.5 rounded-2xl border border-gray-200 text-gray-900 font-bold hover:bg-gray-50 transition-all shadow-sm"
                            >
                                Batal
                            </button>
                            <button
                                onClick={() => handleSave('Draft')}
                                disabled={!isFormValid()}
                                className={`px-10 py-3.5 rounded-2xl font-bold transition-all shadow-sm ${!isFormValid()
                                    ? 'bg-gray-100 text-gray-300 cursor-not-allowed opacity-50'
                                    : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                                    }`}
                            >
                                Simpan Draft
                            </button>
                            <button
                                onClick={() => handleSave('Posted')}
                                className={`px-10 py-3.5 rounded-2xl font-bold transition-all shadow-sm ${!isFormValid()
                                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                    : 'bg-green-500 text-white hover:bg-green-600'
                                    }`}
                                disabled={!isFormValid()}
                            >
                                Simpan Faktur
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <SuccessModal
                isOpen={showSuccess}
                onClose={handleCloseSuccess}
                title={isEdit ? "Berhasil Update Faktur Pajak Pembelian" : "Berhasil Simpan Faktur Pajak Pembelian Baru"}
                message={isEdit ? "Faktur Pajak Pembelian berhasil diperbarui!" : "Faktur Pajak Pembelian Baru berhasil disimpan!"}
            />
        </Layout>
    );
};

export default PurchaseTaxInvoiceForm;
