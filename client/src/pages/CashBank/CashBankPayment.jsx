import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout/Layout';
import { Trash2, Plus, Calendar, ChevronDown, Check, X } from 'lucide-react';
import nav from '../../constants/navigation.json';
import accountService from '../../services/accountService';
import journalService from '../../services/journalService';
import cashBankService from '../../services/cashBankService';
import PageHeader from '../../components/Layout/PageHeader';

const CashBankPayment = () => {
    const [lines, setLines] = useState([]);
    const [voucherNumber, setVoucherNumber] = useState('');
    const [dibayarDari, setDibayarDari] = useState('');
    const [namaPenerima, setNamaPenerima] = useState('');
    const [noCek, setNoCek] = useState('');
    const [isCekKosong, setIsCekKosong] = useState(false);
    const [tanggal, setTanggal] = useState('');
    const [memo, setMemo] = useState('');
    const [headerAccounts, setHeaderAccounts] = useState([]); // 111.000 (Kas & Bank) branch (hierarchical)
    const [detailAccounts, setDetailAccounts] = useState([]); // Leaf nodes of Liability (2xx) and Expense (6xx)
    const [loading, setLoading] = useState(true);
    const [isSuccess, setIsSuccess] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        resetPage();
        fetchInitialData();
    }, []);

    const resetPage = () => {
        setLines([{ id: 1, account: '', amount: '', memo: '', department: '', project: '' }]);
        setMemo('');
        setDibayarDari('');
        setNamaPenerima('');
        setNoCek('');
        setIsCekKosong(false);
        setTanggal(new Date().toISOString().split('T')[0]);
    };

    const fetchInitialData = async () => {
        setLoading(true);
        try {
            const [voucherData, rawAccounts] = await Promise.all([
                journalService.getVoucherNumber('KK'),
                accountService.getAllAccounts()
            ]);

            setVoucherNumber(voucherData.voucherNumber);
            if (rawAccounts && Array.isArray(rawAccounts)) {
                // Header Dropdown: ONLY leaf nodes under 111.000 (Kas & Bank)
                const kasBankBranch = rawAccounts.filter(a => {
                    const isUnderKasBank = a.code.startsWith('111.');
                    const isNotRoot = a.code !== '111.000';
                    const hasNoChildren = !a.has_children || a.has_children === 'false' || a.has_children === 0;
                    return isUnderKasBank && isNotRoot && hasNoChildren && a.status === 'Active';
                });
                setHeaderAccounts(kasBankBranch);

                // Detail Dropdown: ONLY leaf nodes for Expense (5/6) and Liability (2)
                const detailLeafs = rawAccounts.filter(a => {
                    const isLiabilityOrExpense = a.code.startsWith('2') || a.code.startsWith('5') || a.code.startsWith('6');
                    const hasNoChildren = !a.has_children || a.has_children === 'false' || a.has_children === 0;
                    return hasNoChildren && isLiabilityOrExpense && a.status === 'Active' && a.level > 0;
                });
                setDetailAccounts(detailLeafs);
            }
        } catch (err) {
            console.error('Error fetching data:', err);
        } finally {
            setLoading(false);
        }
    };

    const addLine = () => {
        setLines([...lines, { id: Date.now(), account: '', amount: '', memo: '', department: '', project: '' }]);
    };

    const removeLine = (id) => {
        setLines(lines.filter(line => line.id !== id));
    };

    const formatRupiah = (value) => {
        if (value === null || value === undefined || value === '') return '';
        const numberString = value.toString().replace(/[^0-9]/g, '');
        if (!numberString) return '';
        return numberString.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    };

    const parseRupiah = (value) => {
        if (!value) return 0;
        const clean = value.toString().replace(/\./g, '');
        return parseFloat(clean) || 0;
    };

    const handleAmountChange = (id, value) => {
        const formatted = formatRupiah(value);
        setLines(lines.map(line => line.id === id ? { ...line, amount: formatted } : line));
    };

    const updateLine = (id, field, value) => {
        setLines(lines.map(line => line.id === id ? { ...line, [field]: value } : line));
    };

    const totalAmount = lines.reduce((sum, line) => sum + parseRupiah(line.amount), 0);

    const isHeaderValid = () => {
        if (!dibayarDari) {
            alert('Akun "Dibayar Dari" harus dipilih.');
            return false;
        }
        if (!tanggal) {
            alert('Tanggal harus diisi.');
            return false;
        }
        if (!memo) {
            alert('Memo harus diisi.');
            return false;
        }
        if (!isCekKosong && !namaPenerima) {
            alert('Nama Penerima harus diisi jika bukan cek kosong.');
            return false;
        }
        return true;
    };

    const isLinesValid = () => {
        if (lines.length === 0) {
            alert('Setidaknya ada satu baris transaksi.');
            return false;
        }
        for (const line of lines) {
            if (!line.account) {
                alert('Semua baris transaksi harus memiliki akun.');
                return false;
            }
            if (parseRupiah(line.amount) <= 0) {
                alert('Jumlah pada semua baris transaksi harus lebih dari 0.');
                return false;
            }
        }
        if (totalAmount <= 0) {
            alert('Total jumlah transaksi harus lebih dari 0.');
            return false;
        }
        return true;
    };

    const isSaveDisabled = isSaving || !dibayarDari || !tanggal || !memo || totalAmount === 0 || lines.some(l => !l.account || !l.amount);

    const handleSave = async () => {
        if (!isHeaderValid() || !isLinesValid() || isSaving) return;

        setIsSaving(true);
        try {
            await cashBankService.savePayment({
                voucher_no: voucherNumber,
                paid_from_account_id: dibayarDari,
                payee_name: namaPenerima,
                check_no: noCek,
                is_blank_check: isCekKosong,
                date: tanggal,
                total_amount: totalAmount,
                memo: memo,
                lines: lines.map(line => ({
                    account: line.account,
                    amount: parseRupiah(line.amount),
                    memo: line.memo,
                    department: line.department,
                    project: line.project
                }))
            });

            setIsSuccess(true);
            setTimeout(() => {
                setIsSuccess(false);
                resetPage();
                fetchInitialData();
            }, 3000);
        } catch (err) {
            console.error('Error saving payment:', err);
            alert(err.response?.data?.error || 'Gagal menyimpan transaksi');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Layout>
            <div className="max-w-5xl mx-auto pb-20">
                <PageHeader
                    title={nav.payment.label}
                    breadcrumbs={[
                        { label: nav.payment.label, path: nav.payment.path },
                        { label: 'Tambah Baru' }
                    ]}
                />

                {/* Header Inputs */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-8 relative min-h-[400px]">
                    <div className="grid grid-cols-2 gap-8">
                        <div>
                            <label className="block text-sm font-semibold text-gray-900 mb-2">
                                No. Voucher
                            </label>
                            <input
                                type="text"
                                value={voucherNumber}
                                className="w-full px-4 py-2.5 rounded-lg border border-gray-100 bg-gray-50/50 text-gray-400 focus:outline-none text-sm"
                                readOnly
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-900 mb-2">
                                <span className="text-red-500">*</span> Dibayar Dari
                            </label>
                            <div className="relative">
                                <select
                                    value={dibayarDari}
                                    onChange={(e) => setDibayarDari(e.target.value)}
                                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none appearance-none bg-white text-sm"
                                >
                                    <option value="">Pilih Akun</option>
                                    {headerAccounts.map(acc => {
                                        const isSelectable = (!acc.has_children || acc.has_children === 'false' || acc.has_children === 0) && acc.status === 'Active';
                                        return (
                                            <option
                                                key={acc.id}
                                                value={acc.id}
                                                disabled={!isSelectable}
                                                className={!isSelectable ? 'text-gray-400 italic' : 'text-gray-900 font-medium'}
                                            >
                                                {'\u00A0'.repeat(Math.max(0, (acc.level - 3) * 4))}{acc.code} - {acc.name} {!isSelectable && acc.status !== 'Active' ? '(Inactive)' : ''}
                                            </option>
                                        );
                                    })}
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
                            </div>
                        </div>

                        <div>
                            <label className={`block text-sm font-semibold mb-2 ${isCekKosong ? 'text-gray-300' : 'text-gray-900'}`}>
                                {!isCekKosong && <span className="text-red-500">*</span>} Nama Penerima
                            </label>
                            <input
                                type="text"
                                value={namaPenerima}
                                onChange={(e) => setNamaPenerima(e.target.value)}
                                disabled={isCekKosong}
                                placeholder="Nama penerima pembayaran"
                                className={`w-full px-4 py-2.5 rounded-lg border outline-none transition-all text-sm ${isCekKosong ? 'bg-gray-50 border-gray-100 text-gray-300 cursor-not-allowed' : 'border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500'}`}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-900 mb-2">
                                <span className="text-red-500">*</span> Tanggal
                            </label>
                            <div className="relative">
                                <input
                                    type="date"
                                    value={tanggal}
                                    onChange={(e) => setTanggal(e.target.value)}
                                    onKeyDown={(e) => e.preventDefault()}
                                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none text-sm cursor-pointer"
                                />
                            </div>
                        </div>

                        <div>
                            <label className={`block text-sm font-semibold mb-2 ${isCekKosong ? 'text-gray-300' : 'text-gray-900'}`}>
                                No. Cek
                            </label>
                            <input
                                type="text"
                                value={noCek}
                                onChange={(e) => setNoCek(e.target.value)}
                                disabled={isCekKosong}
                                placeholder="Masukkan nomor cek"
                                className={`w-full px-4 py-2.5 rounded-lg border outline-none transition-all text-sm ${isCekKosong ? 'bg-gray-50 border-gray-100 text-gray-300 cursor-not-allowed' : 'border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500'}`}
                            />
                            <div className="flex items-center gap-2 mt-3">
                                <input
                                    type="checkbox"
                                    id="cekKosong"
                                    checked={isCekKosong}
                                    onChange={(e) => setIsCekKosong(e.target.checked)}
                                    className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500 transition-all cursor-pointer"
                                />
                                <label htmlFor="cekKosong" className="text-sm font-medium text-gray-600 cursor-pointer select-none">Cek Kosong</label>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-900 mb-2">
                                <span className="text-red-500">*</span> Jumlah
                            </label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">Rp</span>
                                <input
                                    type="text"
                                    value={formatRupiah(totalAmount)}
                                    className="w-full pl-11 pr-4 py-2.5 rounded-lg border border-gray-100 bg-gray-50/50 text-gray-400 focus:outline-none text-sm font-medium"
                                    readOnly
                                />
                            </div>
                        </div>

                        <div className="col-span-2">
                            <label className="block text-sm font-semibold text-gray-900 mb-2">
                                <span className="text-red-500">*</span> Memo
                            </label>
                            <textarea
                                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all min-h-[80px] text-sm"
                                placeholder="Contoh : biaya ATK bulan Oktober"
                                value={memo}
                                onChange={(e) => setMemo(e.target.value)}
                            ></textarea>
                        </div>
                    </div>

                    {/* Transaction Details */}
                    <div>
                        <h3 className="text-sm font-bold text-gray-800 mb-4 uppercase tracking-wider">Detail Transaksi</h3>
                        <div className="bg-red-50 rounded-t-lg p-4 grid grid-cols-12 gap-4 text-[11px] font-bold text-black uppercase tracking-widest border-b border-red-100">
                            <div className="col-span-3">No. Akun</div>
                            <div className="col-span-2">Jumlah</div>
                            <div className="col-span-3">Memo</div>
                            <div className="col-span-2">Departemen</div>
                            <div className="col-span-2">Proyek</div>
                        </div>

                        <div className="divide-y divide-gray-50">
                            {lines.map((line) => (
                                <div key={line.id} className="grid grid-cols-12 gap-4 items-center py-4 px-2 hover:bg-gray-50/30 transition-colors group">
                                    <div className="col-span-3 relative">
                                        <select
                                            className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none appearance-none bg-white text-sm"
                                            value={line.account}
                                            onChange={(e) => updateLine(line.id, 'account', e.target.value)}
                                        >
                                            <option value="">Pilih Akun</option>
                                            {detailAccounts.map(acc => (
                                                <option key={acc.id} value={acc.id} className="text-gray-900">
                                                    {acc.code} - {acc.name}
                                                </option>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" size={14} />
                                    </div>
                                    <div className="col-span-2 relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xs">Rp</span>
                                        <input
                                            type="text"
                                            value={line.amount}
                                            onChange={(e) => handleAmountChange(line.id, e.target.value)}
                                            placeholder="0"
                                            className="w-full pl-10 pr-2 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all text-sm text-right text-gray-600 font-medium"
                                        />
                                    </div>
                                    <div className="col-span-3">
                                        <input
                                            type="text"
                                            placeholder="Masukkan memo"
                                            value={line.memo}
                                            onChange={(e) => updateLine(line.id, 'memo', e.target.value)}
                                            className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all text-sm text-gray-500"
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <input
                                            type="text"
                                            placeholder="Departemen"
                                            value={line.department}
                                            onChange={(e) => updateLine(line.id, 'department', e.target.value)}
                                            className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all text-sm text-gray-500"
                                        />
                                    </div>
                                    <div className="col-span-2 flex items-center gap-2">
                                        <input
                                            type="text"
                                            placeholder="Proyek"
                                            value={line.project}
                                            onChange={(e) => updateLine(line.id, 'project', e.target.value)}
                                            className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all text-sm text-gray-500 flex-1"
                                        />
                                        <button
                                            onClick={() => removeLine(line.id)}
                                            className="text-gray-300 hover:text-red-500 transition-colors p-1"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="flex justify-end mt-4">
                            <button onClick={addLine} className="text-green-600 font-bold hover:text-green-700 flex items-center gap-1 text-xs py-1 px-3 rounded-lg hover:bg-green-50 transition-all">
                                <Plus size={14} strokeWidth={2.5} /> Tambah Baris
                            </button>
                        </div>

                        <div className="mt-8 pt-6 border-t border-gray-50 flex justify-end items-center gap-4">
                            <span className="text-gray-400 font-bold text-[10px] uppercase tracking-widest">Total Dibayar :</span>
                            <span className="font-medium text-gray-900 text-2xl tracking-tight">Rp {formatRupiah(totalAmount)}</span>
                        </div>
                    </div>

                    {/* Footer Buttons */}
                    <div className="flex justify-end gap-3 mt-10">
                        <button
                            onClick={resetPage}
                            className="px-8 py-3 rounded-xl border border-gray-100 text-gray-500 font-bold hover:bg-gray-50 transition-all text-sm"
                        >
                            Batal
                        </button>
                        <button
                            disabled={isSaveDisabled}
                            onClick={handleSave}
                            className={`px-10 py-3 rounded-xl font-bold shadow-lg transition-all text-sm ${isSaveDisabled ? 'bg-gray-100 text-gray-300 cursor-not-allowed shadow-none' : 'bg-green-600 text-white hover:bg-green-700 shadow-green-100'}`}
                        >
                            {isSaving ? 'Menyimpan...' : 'Simpan Pengeluaran'}
                        </button>
                    </div>

                    {/* Success Modal */}
                    {isSuccess && (
                        <div className="fixed inset-0 flex items-center justify-center z-[100] px-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.4)' }}>
                            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden relative animate-in zoom-in duration-300">
                                <div className="p-8 flex flex-col items-center text-center">
                                    <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mb-8 shadow-lg shadow-green-100">
                                        <Check size={40} className="text-white" strokeWidth={3} />
                                    </div>
                                    <h2 className="text-xl font-bold text-gray-900 mb-2">Berhasil Tambah Pengeluaran Baru</h2>
                                    <p className="text-gray-500 mb-8 text-sm">Pengeluaran baru berhasil ditambahkan!</p>
                                    <button
                                        onClick={() => {
                                            setIsSuccess(false);
                                            resetPage();
                                            fetchInitialData();
                                        }}
                                        className="w-full py-3.5 rounded-xl bg-green-600 text-white font-bold hover:bg-green-700 transition-all shadow-lg shadow-green-100 text-sm"
                                    >
                                        Kembali
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
};

export default CashBankPayment;
