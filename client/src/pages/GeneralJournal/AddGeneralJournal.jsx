import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import accountService from '../../services/accountService';
import journalService from '../../services/journalService';
import Layout from '../../components/Layout/Layout';
import PageHeader from '../../components/Layout/PageHeader';
import { Trash2, Plus, ChevronDown, CheckCircle } from 'lucide-react';
import nav from '../../constants/navigation.json';

const dummyInvoices = Array.from({ length: 20 }, (_, i) => ({
    id: `INV-2026-02-${String(i + 1).padStart(3, '0')}`,
    label: `INV-2026-02-${String(i + 1).padStart(3, '0')}`
}));

const AddGeneralJournal = () => {
    const navigate = useNavigate();
    // Use dynamic current date for initial state
    const today = new Date().toISOString().split('T')[0];
    const [dueDate, setDueDate] = useState(today);
    const [description, setDescription] = useState('');
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);

    // Fetch accounts from API
    React.useEffect(() => {
        const fetchAccounts = async () => {
            try {
                const data = await accountService.getAllAccounts();
                setAccounts(data);
            } catch (err) {
                console.error('Error fetching accounts:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchAccounts();
    }, []);

    // Start with 2 lines
    const [lines, setLines] = useState([
        { id: Date.now(), account: '', debit: 0, credit: 0 },
        { id: Date.now() + 1, account: '', debit: 0, credit: 0 }
    ]);

    const addLine = () => {
        setLines([...lines, { id: Date.now(), account: '', debit: 0, credit: 0 }]);
    };

    const removeLine = (id) => {
        if (lines.length > 2) {
            setLines(lines.filter(line => line.id !== id));
        } else {
            // Keep at least 2 lines, just reset the content
            setLines(lines.map(line =>
                line.id === id ? { ...line, account: '', debit: 0, credit: 0 } : line
            ));
        }
    };

    // Helper to format number with dots (id-ID)
    const formatInputNumber = (val) => {
        if (!val && val !== 0) return '';
        return val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    };

    const handleLineChange = (id, field, value) => {
        const updatedLines = lines.map(line => {
            if (line.id === id) {
                if (field === 'debit' || field === 'credit') {
                    // Remove all dots before parsing
                    const cleanValue = value.replace(/\./g, '');
                    const numValue = cleanValue === '' ? 0 : parseFloat(cleanValue) || 0;
                    return { ...line, [field]: numValue };
                }
                return { ...line, [field]: value };
            }
            return line;
        });
        setLines(updatedLines);
    };

    const totalDebit = lines.reduce((sum, line) => sum + line.debit, 0);
    const totalCredit = lines.reduce((sum, line) => sum + line.credit, 0);

    // Validation Logic
    const isHeaderValid = dueDate !== '' && description.trim() !== '';
    const areLinesValid = lines.every(line =>
        line.account !== '' && (line.debit > 0 || line.credit > 0)
    );
    const isTotalBalanced = totalDebit > 0 && totalDebit === totalCredit;
    const isFormValid = isHeaderValid && areLinesValid && isTotalBalanced;

    const handleSubmit = async (status) => {
        if (status === 'Posted' && !isFormValid) return;

        try {
            const [year, month, day] = dueDate.split('-');
            const formattedDate = `${day}/${month}/${year}`;

            await journalService.createJournal({
                date: formattedDate,
                description,
                status,
                lines: lines
                    .filter(l => l.account !== '') // Only send lines with an account
                    .map(line => ({
                        account: line.account,
                        debit: line.debit || 0,
                        credit: line.credit || 0
                    }))
            });

            navigate(nav.general_journal.path, {
                state: { notification: { message: `Jurnal Berhasil Disimpan sebagai ${status}!`, type: 'success' } }
            });
        } catch (err) {
            console.error('Error saving journal:', err);
            alert(err.response?.data?.error || 'Gagal menyimpan jurnal');
        }
    };

    const renderAccountOptions = () => {
        // Identify accounts that have children (act as parents)
        const parentIds = new Set(accounts.map(acc => acc.parent_id).filter(id => id !== null));

        return accounts.map(acc => {
            const isHeader = acc.is_system || parentIds.has(acc.id);
            return (
                <option
                    key={acc.id}
                    value={acc.id}
                    disabled={isHeader}
                    className={isHeader ? 'text-gray-400 font-bold bg-gray-50' : 'text-gray-900'}
                >
                    {'\u00A0'.repeat(acc.level * 4)}{acc.code} - {acc.name}
                </option>
            );
        });
    };

    const findAccountLabel = (id) => {
        const found = accounts.find(a => a.id === id);
        return found ? `${found.code} - ${found.name}` : null;
    };

    return (
        <Layout>
            <PageHeader
                title={nav.general_journal.label}
                breadcrumbs={[
                    { label: nav.general_journal.label, path: nav.general_journal.path },
                    { label: 'Tambah Baru' }
                ]}
            />
            <div className="max-w-5xl space-y-6 relative">
                {/* Header Inputs */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            <span className="text-red-500">*</span> Tanggal Jatuh Tempo
                        </label>
                        <div className="relative">
                            <input
                                type="date"
                                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all"
                                value={dueDate}
                                onKeyDown={(e) => e.preventDefault()}
                                onChange={(e) => setDueDate(e.target.value)}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Pilih Invoice
                        </label>
                        <div className="relative">
                            <select className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none appearance-none bg-white">
                                <option value="">Pilih invoice</option>
                                {dummyInvoices.map(inv => (
                                    <option key={inv.id} value={inv.id}>{inv.label}</option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={20} />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            <span className="text-red-500">*</span> Deskripsi
                        </label>
                        <textarea
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all min-h-[100px]"
                            placeholder="Deskripsi jurnal"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        ></textarea>
                    </div>
                </div>

                {/* Journal Entries */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="grid grid-cols-12 gap-4 mb-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                        <div className="col-span-6">Akun</div>
                        <div className="col-span-3">Debit</div>
                        <div className="col-span-3">Kredit</div>
                    </div>

                    <div className="space-y-3">
                        {lines.map((line) => (
                            <div key={line.id} className="grid grid-cols-12 gap-4 items-start">
                                <div className="col-span-6 relative group">
                                    <div className={`absolute inset-0 px-4 py-2.5 rounded-lg border pointer-events-none flex items-center bg-white font-medium truncate pr-10 transition-all ${line.account ? 'text-gray-900 border-gray-300' : 'text-gray-400 border-gray-300'
                                        } group-focus-within:ring-2 group-focus-within:ring-green-500 group-focus-within:border-green-500`}>
                                        {findAccountLabel(line.account) || "Pilih Akun"}
                                    </div>
                                    <select
                                        className="w-full px-4 py-2.5 rounded-lg opacity-0 relative z-10 cursor-pointer"
                                        value={line.account}
                                        onChange={(e) => handleLineChange(line.id, 'account', e.target.value)}
                                    >
                                        <option value="">Pilih Akun</option>
                                        {renderAccountOptions()}
                                    </select>
                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none z-20" size={18} />
                                </div>
                                <div className="col-span-3 relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium">Rp</span>
                                    <input
                                        type="text"
                                        value={line.debit === 0 ? '' : formatInputNumber(line.debit)}
                                        placeholder="0"
                                        disabled={line.credit > 0}
                                        onChange={(e) => handleLineChange(line.id, 'debit', e.target.value)}
                                        className={`w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 outline-none transition-all text-gray-700 font-medium ${line.credit > 0 ? 'bg-gray-50 text-gray-400 cursor-not-allowed border-transparent' : 'focus:ring-2 focus:ring-green-500 focus:border-green-500'
                                            }`}
                                    />
                                </div>
                                <div className="col-span-3 relative flex items-center gap-2">
                                    <div className="relative w-full">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium">Rp</span>
                                        <input
                                            type="text"
                                            value={line.credit === 0 ? '' : formatInputNumber(line.credit)}
                                            placeholder="0"
                                            disabled={line.debit > 0}
                                            onChange={(e) => handleLineChange(line.id, 'credit', e.target.value)}
                                            className={`w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 outline-none transition-all text-gray-700 font-medium ${line.debit > 0 ? 'bg-gray-50 text-gray-400 cursor-not-allowed border-transparent' : 'focus:ring-2 focus:ring-green-500 focus:border-green-500'
                                                }`}
                                        />
                                    </div>
                                    <button onClick={() => removeLine(line.id)} className="text-red-400 hover:text-red-600 p-1 shrink-0">
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <button onClick={addLine} className="mt-4 flex items-center gap-2 text-green-600 font-medium hover:text-green-700">
                        <Plus size={18} />
                        Tambah Baris
                    </button>

                    <div className="mt-8 border-t border-gray-100 pt-6 flex flex-col items-end gap-3">
                        <div className="flex items-center gap-12 text-sm">
                            <span className="text-gray-400 font-medium">Total Debit :</span>
                            <span className="font-bold text-gray-900 text-lg">Rp{totalDebit.toLocaleString('id-ID')}</span>
                        </div>
                        <div className="flex items-center gap-12 text-sm">
                            <span className="text-gray-400 font-medium">Total Kredit :</span>
                            <span className="font-bold text-gray-900 text-lg">Rp{totalCredit.toLocaleString('id-ID')}</span>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-4 pb-8">
                    <button
                        onClick={() => handleSubmit('Draft')}
                        className="px-8 py-3 rounded-xl border font-bold transition-all shadow-sm border-gray-200 text-gray-700 hover:bg-gray-50 bg-white"
                    >
                        Simpan Draft
                    </button>
                    <button
                        onClick={() => handleSubmit('Posted')}
                        disabled={!isFormValid}
                        className={`px-8 py-3 rounded-xl font-bold shadow-md transition-all ${!isFormValid
                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
                            : 'bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700'
                            }`}
                    >
                        Tambah Jurnal
                    </button>
                </div>
            </div>
        </Layout>
    );
};

export default AddGeneralJournal;
