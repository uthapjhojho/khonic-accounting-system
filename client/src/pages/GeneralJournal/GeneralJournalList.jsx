import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import journalService from '../../services/journalService';
import Layout from '../../components/Layout/Layout';
import { Search, Plus, Filter, Download, MoreVertical, Eye, Edit, Trash2, CheckCircle, Clock, Edit2, RefreshCw, AlertTriangle } from 'lucide-react';
import nav from '../../constants/navigation.json';
import PageHeader from '../../components/Layout/PageHeader';
import { formatDate, formatCurrency } from '../../utils/formatUtils';

const GeneralJournalList = () => {
    // Initial Mock Data
    const initialMockJournals = [
        {
            id: 1, date: '09/10/2025', number: 'JU-2025-004', description: 'Biaya servis mobil kantor bulan Oktober', status: 'Posted',
            lines: [
                { id: 101, account: '510.000', debit: 500000, credit: 0 },
                { id: 102, account: '111.001', debit: 0, credit: 500000 }
            ]
        },
        {
            id: 2, date: '28/10/2025', number: 'JU-2025-003', description: 'Biaya ATK bulan Oktober', status: 'Posted',
            lines: [
                { id: 201, account: '530.000', debit: 200000, credit: 0 },
                { id: 202, account: '111.001', debit: 0, credit: 200000 }
            ]
        },
        {
            id: 3, date: '27/10/2025', number: 'JU-2025-002', description: 'Biaya Makan bulan Oktober', status: 'Draft',
            lines: [
                { id: 301, account: '530.000', debit: 150000, credit: 0 },
                { id: 302, account: '111.001', debit: 0, credit: 150000 }
            ]
        },
        {
            id: 4, date: '26/10/2025', number: 'JU-2025-001', description: 'Biaya kesehatan bulan Oktober', status: 'Canceled',
            lines: [
                { id: 401, account: '510.000', debit: 300000, credit: 0 },
                { id: 402, account: '111.001', debit: 0, credit: 300000 }
            ]
        },
    ];

    const location = useLocation();
    const [rawJournals, setRawJournals] = React.useState([]);
    const [searchTerm, setSearchTerm] = React.useState('');
    const [loading, setLoading] = React.useState(true);

    // Fetch Journals from API
    React.useEffect(() => {
        const fetchJournals = async () => {
            try {
                const data = await journalService.getAllJournals();
                setRawJournals(data);
            } catch (err) {
                console.error('Error fetching journals:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchJournals();
    }, []);

    // Notification State from navigation
    const [notification, setNotification] = React.useState(location.state?.notification || null);

    // Cancellation Modal state
    const [isCancelModalOpen, setIsCancelModalOpen] = React.useState(false);
    const [selectedJournal, setSelectedJournal] = React.useState(null);
    const [cancelReason, setCancelReason] = React.useState('');

    // Clear notification after 3 seconds and clean from history
    React.useEffect(() => {
        if (location.state?.notification) {
            // Once we've shown it, clear the history state so it doesn't reappear on back/refresh
            window.history.replaceState({}, document.title);
        }

        if (notification) {
            const timer = setTimeout(() => setNotification(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [notification, location.state]);

    // Helper to parse date consistently
    const parseDate = (dateVal) => {
        if (!dateVal) return new Date(0);
        const date = new Date(dateVal);
        return isNaN(date.getTime()) ? new Date(0) : date;
    };

    // Sort and filter journals
    const journals = [...rawJournals]
        .filter(j => {
            const search = searchTerm.toLowerCase();
            return (
                (j.date && j.date.toLowerCase().includes(search)) ||
                (j.number && j.number.toLowerCase().includes(search)) ||
                (j.description && j.description.toLowerCase().includes(search)) ||
                (j.status && j.status.toLowerCase().includes(search))
            );
        })
        .sort((a, b) => parseDate(b.date) - parseDate(a.date));

    const getStatusColor = (status) => {
        switch (status) {
            case 'Posted': return 'bg-green-100 text-green-600';
            case 'Draft': return 'bg-gray-100 text-gray-600';
            case 'Canceled': return 'bg-red-100 text-red-600';
            case 'Reversed': return 'bg-orange-100 text-orange-600';
            default: return 'bg-gray-100 text-gray-600';
        }
    };

    const handleCancelJournal = async () => {
        if (!selectedJournal || !cancelReason.trim()) return;

        try {
            await journalService.reverseJournal(selectedJournal.id, cancelReason);

            // Refresh list
            const data = await journalService.getAllJournals();
            setRawJournals(data);

            setIsCancelModalOpen(false);
            setCancelReason('');
            setNotification({ message: 'Jurnal Berhasil Direversed', type: 'success' });
        } catch (err) {
            console.error('Error reversing journal:', err);
            setNotification({ message: 'Gagal mereversed jurnal', type: 'error' });
        }
    };

    return (
        <Layout>
            <PageHeader
                title={nav.general_journal.label}
                breadcrumbs={[
                    { label: nav.general_journal.label, path: nav.general_journal.path }
                ]}
            />
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 min-h-[calc(100vh-8rem)] relative">
                {loading && (
                    <div className="absolute inset-0 bg-white/50 z-50 flex items-center justify-center rounded-xl">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                    </div>
                )}
                {/* Floating Notification */}
                {notification && (
                    <div className="fixed top-20 right-8 z-50 flex items-center gap-2 px-6 py-4 rounded-xl border border-transparent bg-green-600 text-white shadow-2xl animate-in slide-in-from-top-4 duration-300">
                        <CheckCircle size={20} className="text-white" />
                        <span className="font-bold tracking-tight">{notification.message}</span>
                    </div>
                )}

                {/* Toolbar */}
                <div className="p-6 flex items-center justify-between border-b border-gray-100 gap-4">
                    <div className="relative flex-1 max-w-xl">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Cari tanggal, nomor, deskripsi..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-200 bg-gray-50"
                        />
                    </div>
                    <Link to="/jurnal-umum/baru" className="flex items-center gap-2 bg-gray-700 hover:bg-gray-800 text-white px-5 py-2.5 rounded-lg font-medium transition-colors">
                        <Plus size={18} />
                        Tambah Jurnal Baru
                    </Link>
                </div>

                {/* Table Header */}
                <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-wider">
                    <div className="col-span-2">Tanggal</div>
                    <div className="col-span-2">Nomor</div>
                    <div className="col-span-5">Deskripsi</div>
                    <div className="col-span-2">Status</div>
                    <div className="col-span-1 text-center">Action</div>
                </div>

                {/* Table Body */}
                <div className="divide-y divide-gray-100">
                    {journals.map((journal) => (
                        <div key={journal.id} className="grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-gray-50 transition-colors">
                            <div className="col-span-2 text-sm text-gray-900 font-medium">{formatDate(journal.date)}</div>
                            <div className="col-span-2 text-sm text-gray-500">{journal.number}</div>
                            <div className="col-span-5 text-sm font-medium text-gray-900">{journal.description}</div>
                            <div className="col-span-2">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(journal.status)}`}>
                                    {journal.status}
                                </span>
                            </div>
                            <div className="col-span-1 flex justify-center gap-1">
                                {journal.status === 'Draft' ? (
                                    <Link
                                        to={`/jurnal-umum/edit/${journal.id}`}
                                        className="p-1.5 rounded-full hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-colors"
                                    >
                                        <Edit2 size={16} />
                                    </Link>
                                ) : (
                                    <button
                                        onClick={() => {
                                            setSelectedJournal(journal);
                                            setIsCancelModalOpen(true);
                                        }}
                                        disabled={journal.status !== 'Posted'}
                                        className={`p-1.5 rounded-full transition-colors ${journal.status !== 'Posted'
                                            ? 'bg-transparent text-gray-200 cursor-not-allowed'
                                            : 'hover:bg-gray-200 text-gray-400 hover:text-gray-600'
                                            }`}
                                    >
                                        <RefreshCw size={16} />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Cancellation Modal */}
            {isCancelModalOpen && (
                <div className="fixed inset-0 flex items-center justify-center z-50 px-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.4)' }}>
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden p-8 flex flex-col items-center">
                        <div className="mb-6">
                            <AlertTriangle size={120} className="text-gray-500" strokeWidth={1} />
                        </div>

                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Batalkan Jurnal</h2>

                        <p className="text-gray-500 text-center mb-6 leading-relaxed px-4">
                            Masukkan alasan kenapa mau menghapus jurnal ini
                        </p>

                        <div className="w-full mb-8">
                            <textarea
                                value={cancelReason}
                                onChange={(e) => setCancelReason(e.target.value)}
                                placeholder="Alasan pembatalan..."
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-red-400 resize-none min-h-[100px] text-sm"
                            ></textarea>
                        </div>

                        <div className="w-full space-y-3">
                            <button
                                onClick={handleCancelJournal}
                                disabled={!cancelReason.trim()}
                                className={`w-full py-4 rounded-2xl font-bold transition-all shadow-sm ${!cancelReason.trim()
                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                    : 'bg-[#D9534F] text-white hover:bg-[#C9302C]'
                                    }`}
                            >
                                Ya, Batalkan
                            </button>

                            <button
                                onClick={() => {
                                    setIsCancelModalOpen(false);
                                    setCancelReason('');
                                }}
                                className="w-full py-4 text-gray-900 font-bold hover:bg-gray-50 rounded-2xl transition-all"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    );
};

export default GeneralJournalList;
