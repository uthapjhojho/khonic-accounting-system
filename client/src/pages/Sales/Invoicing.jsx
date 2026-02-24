import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout/Layout';
import RecordPaymentModal from '../../components/Modals/RecordPaymentModal';
import { Search, Plus, FileText, AlertCircle, BarChart2 } from 'lucide-react';
import invoiceService from '../../services/invoiceService';
import { formatCurrency, formatDate, getAgingStatus } from '../../utils/formatUtils';

const Invoicing = () => {
    const [isPaymentModalOpen, setPaymentModalOpen] = useState(false);
    const [invoices, setInvoices] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchInvoices();
    }, []);

    const fetchInvoices = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/sales/invoices');
            const data = await response.json();

            // Sort by due date ASC
            const sortedData = data.sort((a, b) => new Date(a.due_date) - new Date(b.due_date));
            setInvoices(sortedData);
        } catch (err) {
            console.error('Error fetching invoices:', err);
        } finally {
            setLoading(false);
        }
    };

    const totalPiutang = Math.round(invoices.reduce((sum, inv) => sum + (parseFloat(inv.total_amount) - parseFloat(inv.paid_amount)), 0));
    const totalJatuhTempo = Math.round(invoices.reduce((sum, inv) => {
        const agingInfo = getAgingStatus(inv.due_date);
        if (agingInfo.isOverdue) {
            return sum + (parseFloat(inv.total_amount) - parseFloat(inv.paid_amount));
        }
        return sum;
    }, 0));

    const filteredInvoices = invoices.filter(inv =>
        inv.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.invoice_no.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <Layout title="Penagihan">
            <div className="space-y-6">

                {/* Statistics Cards */}
                <div className="grid grid-cols-2 gap-6">
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
                        <div>
                            <div className="flex items-center gap-2 text-gray-600 mb-2">
                                <BarChart2 size={18} className="text-blue-500" />
                                <span className="font-semibold text-sm">Total Piutang</span>
                            </div>
                            <div className="text-3xl font-bold text-gray-900">{formatCurrency(totalPiutang)}</div>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
                        <div>
                            <div className="flex items-center gap-2 text-gray-600 mb-2">
                                <FileText size={18} className="text-orange-500" />
                                <span className="font-semibold text-sm">Total Jatuh Tempo</span>
                            </div>
                            <div className="text-3xl font-bold text-gray-900">{formatCurrency(totalJatuhTempo)}</div>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 min-h-[calc(100vh-20rem)]">
                    {/* Toolbar */}
                    <div className="p-6 flex items-center justify-between border-b border-gray-100 gap-4">
                        <div className="relative flex-1 max-w-xl">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                type="text"
                                placeholder="Cari pelanggan atau invoice..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-200 bg-gray-50"
                            />
                        </div>
                        <button
                            onClick={() => setPaymentModalOpen(true)}
                            className="flex items-center gap-2 bg-gray-700 hover:bg-gray-800 text-white px-5 py-2.5 rounded-lg font-medium transition-colors"
                        >
                            <Plus size={18} />
                            Catat Pembayaran
                        </button>
                    </div>

                    {/* Table Header */}
                    <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-wider">
                        <div className="col-span-3">Pelanggan</div>
                        <div className="col-span-2">Nomor Faktur</div>
                        <div className="col-span-2">Tanggal Jatuh Tempo</div>
                        <div className="col-span-3">Umur</div>
                        <div className="col-span-2 text-right">Sisa Tagihan</div>
                    </div>

                    {/* Table Body */}
                    <div className="divide-y divide-gray-100">
                        {loading ? (
                            <div className="px-6 py-10 text-center text-gray-500">Memuat data...</div>
                        ) : filteredInvoices.length === 0 ? (
                            <div className="px-6 py-10 text-center text-gray-500">Tidak ada data faktur.</div>
                        ) : (
                            filteredInvoices.map((inv, idx) => {
                                const aging = getAgingStatus(inv.due_date);
                                const remaining = parseFloat(inv.total_amount) - parseFloat(inv.paid_amount);
                                return (
                                    <div key={idx} className="grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-gray-50 transition-colors">
                                        <div className="col-span-3 text-sm text-gray-900 font-medium">{inv.customer_name}</div>
                                        <div className="col-span-2 text-sm text-gray-400">{inv.invoice_no}</div>
                                        <div className="col-span-2 text-sm text-gray-900">{formatDate(inv.due_date)}</div>
                                        <div className={`col-span-3 text-sm ${aging.isOverdue ? 'text-red-500 font-bold' : 'text-gray-500'}`}>
                                            {aging.text}
                                        </div>
                                        <div className="col-span-2 text-right text-sm font-bold text-gray-900">{formatCurrency(remaining)}</div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>

            <RecordPaymentModal
                isOpen={isPaymentModalOpen}
                onClose={() => {
                    setPaymentModalOpen(false);
                    fetchInvoices();
                }}
            />
        </Layout>
    );
};

export default Invoicing;
