import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout/Layout';
import PageHeader from '../../components/Layout/PageHeader';
import { Search, Plus, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import taxInvoiceService from '../../services/taxInvoiceService';
import nav from '../../constants/navigation.json';
import statuses from '../../constants/statuses.json';

const PurchaseTaxInvoice = () => {
    const navigate = useNavigate();
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchInvoices = async () => {
            try {
                const data = await taxInvoiceService.getAllPurchaseTaxInvoices();
                setInvoices(data);
            } catch (err) {
                console.error('Error fetching purchase tax invoices:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchInvoices();
    }, []);

    const getStatusStyle = (status) => {
        return statuses.purchase[status] || 'bg-gray-100 text-gray-600';
    };

    return (
        <Layout>
            <PageHeader
                title={nav.purchase_tax.label}
                backPath={nav.dashboard.path}
            />

            <div className="space-y-6">
                {/* Toolbar */}
                <div className="flex items-center justify-between gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Cari faktur pajak..."
                            className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-100 bg-gray-50/50 text-sm transition-all"
                        />
                    </div>

                    <button
                        onClick={() => navigate('/faktur-pajak-pembelian/baru')}
                        className="flex items-center gap-2 bg-[#4A4A4A] hover:bg-[#3A3A3A] text-white px-6 py-3 rounded-xl transition-all shadow-sm whitespace-nowrap"
                    >
                        <Plus size={20} />
                        Buat Faktur Pajak Pembelian
                    </button>
                </div>

                {/* Table */}
                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                    {/* Table Header */}
                    <div className="grid grid-cols-12 gap-4 px-8 py-5 bg-white border-b border-gray-100 text-[11px] font-bold text-gray-500 tracking-wider">
                        <div className="col-span-3">Nomor Faktur Pajak</div>
                        <div className="col-span-2">Tanggal Faktur</div>
                        <div className="col-span-2">Nama Supplier</div>
                        <div className="col-span-2">Nomor PO</div>
                        <div className="col-span-1 text-right">Nilai Faktur</div>
                        <div className="col-span-1 text-center">Status</div>
                        <div className="col-span-1 text-center uppercase">Action</div>
                    </div>

                    {/* Table Body */}
                    <div className="divide-y divide-gray-50">
                        {loading ? (
                            <div className="px-8 py-12 text-center text-gray-500">Memuat data...</div>
                        ) : invoices.length === 0 ? (
                            <div className="px-8 py-12 text-center text-gray-500 italic">Belum ada faktur pajak pembelian.</div>
                        ) : (
                            invoices.map((invoice) => (
                                <div
                                    key={invoice.id}
                                    className="grid grid-cols-12 gap-4 px-8 py-6 items-center hover:bg-gray-50/50 transition-colors cursor-pointer group"
                                    onClick={() => navigate(`/faktur-pajak-pembelian/detail/${invoice.id}`)}
                                >
                                    <div className="col-span-3 text-sm text-gray-400 font-medium tracking-tight font-mono uppercase">{invoice.tax_invoice_no}</div>
                                    <div className="col-span-2 text-sm text-gray-900">{new Date(invoice.date).toLocaleDateString('id-ID')}</div>
                                    <div className="col-span-2 text-sm text-gray-700 font-medium">{invoice.supplier_name}</div>
                                    <div className="col-span-2 text-sm text-gray-500 font-medium">{invoice.po_no}</div>
                                    <div className="col-span-1 text-sm text-right font-black text-gray-900">Rp {parseFloat(invoice.total).toLocaleString('id-ID')}</div>
                                    <div className="col-span-1 flex justify-center">
                                        <span className={`px-3 py-1 rounded-lg text-[11px] font-bold ${getStatusStyle(invoice.status)}`}>
                                            {invoice.status}
                                        </span>
                                    </div>
                                    <div className="col-span-1 flex justify-center">
                                        <div className="p-2 bg-white border border-gray-100 rounded-xl shadow-sm text-gray-400 group-hover:text-gray-900 transition-colors">
                                            <Eye size={18} />
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default PurchaseTaxInvoice;
