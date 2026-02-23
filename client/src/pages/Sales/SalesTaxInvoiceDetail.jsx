import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout/Layout';
import PageHeader from '../../components/Layout/PageHeader';
import { Download, XCircle, Pencil } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import CancelInvoiceModal from '../../components/Modals/CancelInvoiceModal';
import nav from '../../constants/navigation.json';

const SalesTaxInvoiceDetail = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const [isCancelModalOpen, setCancelModalOpen] = useState(false);
    const [invoice, setInvoice] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchInvoice = async () => {
            try {
                const response = await axios.get(`http://localhost:5000/api/sales/tax-invoices/${id}`);
                setInvoice(response.data);
            } catch (err) {
                console.error('Error fetching tax invoice details:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchInvoice();
    }, [id]);

    const handleCancel = async () => {
        // Normally an API call to update status to 'Cancelled'
        setCancelModalOpen(false);
        if (invoice) {
            setInvoice({ ...invoice, status: 'Cancelled' });
        }
    };

    if (loading) return <Layout><div className="p-8">Memuat data...</div></Layout>;
    if (!invoice) return <Layout><div className="p-8 text-red-500">Faktur pajak tidak ditemukan.</div></Layout>;

    const status = invoice.status;

    return (
        <Layout>
            <PageHeader
                title={nav.sales_tax.label}
                breadcrumbs={[
                    { label: nav.sales_tax.label, path: nav.sales_tax.path },
                    { label: 'Detail' }
                ]}
            />

            <div className="max-w-6xl space-y-6 pb-20">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
                    {/* Actions Header */}
                    <div className="flex justify-between items-start mb-10">
                        <div className="flex items-center gap-3">
                            {/* Title removed as it's now in PageHeader */}
                        </div>
                        <div className="flex gap-3">
                            <button className="flex items-center gap-2 px-6 py-2.5 border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50 transition-all">
                                <Download size={18} />
                                Download PDF
                            </button>
                            {status === 'Draft' ? (
                                <button
                                    onClick={() => navigate('/faktur-pajak-penjualan/edit/1')}
                                    className="flex items-center gap-2 px-6 py-2.5 bg-[#5CB35C] hover:bg-[#4CA34C] rounded-xl text-sm font-bold text-white transition-all shadow-sm"
                                >
                                    <Pencil size={18} />
                                    Edit Faktur Pembelian
                                </button>
                            ) : status === 'Issued' ? (
                                <button
                                    onClick={() => setCancelModalOpen(true)}
                                    className="flex items-center gap-2 px-6 py-2.5 bg-[#4A4A4A] hover:bg-[#3A3A3A] rounded-xl text-sm font-bold text-white transition-all shadow-sm"
                                >
                                    <XCircle size={18} />
                                    Cancel
                                </button>
                            ) : null}
                        </div>
                    </div>

                    {/* Metadata Grid */}
                    <div className="grid grid-cols-3 gap-y-8 gap-x-12 mb-12">
                        <div>
                            <div className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Nomor Faktur Pajak</div>
                            <div className="text-sm font-bold text-blue-600 font-mono">{invoice.tax_invoice_no}</div>
                        </div>
                        <div>
                            <div className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Customer</div>
                            <div className="text-sm font-bold text-gray-700">{invoice.customer_name}</div>
                        </div>
                        <div>
                            <div className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Status</div>
                            <span className={`inline-block px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider ${status === 'Issued' ? 'bg-green-100 text-green-700' : (status === 'Cancelled' ? 'bg-red-100 text-red-700' : 'bg-[#FFF5E6] text-[#F3A434]')}`}>
                                {status}
                            </span>
                        </div>

                        <div>
                            <div className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Tanggal Faktur</div>
                            <div className="text-sm font-bold text-gray-700">{new Date(invoice.date).toLocaleDateString('id-ID')}</div>
                        </div>
                        <div>
                            <div className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Masa Pajak</div>
                            <div className="text-sm font-bold text-gray-700">{invoice.masa_pajak}</div>
                        </div>
                        <div>
                            <div className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Nomor Trade Invoice</div>
                            <div className="text-sm font-bold text-gray-700">{invoice.trade_invoice_no}</div>
                        </div>
                    </div>

                    {/* Items Table */}
                    <div className="mb-8">
                        <h3 className="font-bold text-gray-900 mb-6 underline decoration-gray-100 decoration-4 underline-offset-8">Detail Barang / Jasa</h3>
                        <div className="bg-gray-50 rounded-xl p-4 grid grid-cols-12 gap-4 text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">
                            <div className="col-span-8">Nama Barang / Jasa</div>
                            <div className="col-span-1 text-center">Kuantitas</div>
                            <div className="col-span-2 text-right">Harga Satuan</div>
                            <div className="col-span-1 text-right">Total</div>
                        </div>

                        <div className="divide-y divide-gray-50">
                            <div className="grid grid-cols-12 gap-4 items-center py-5">
                                <div className="col-span-8 text-xs font-bold text-gray-700">Penjualan atas Invoice {invoice.trade_invoice_no}</div>
                                <div className="col-span-1 text-xs text-center text-gray-500 font-bold">1</div>
                                <div className="col-span-2 text-xs text-right text-gray-500 font-bold">Rp {parseFloat(invoice.total).toLocaleString('id-ID')}</div>
                                <div className="col-span-1 text-xs text-right text-gray-900 font-black">Rp {parseFloat(invoice.total).toLocaleString('id-ID')}</div>
                            </div>
                        </div>
                    </div>

                    {/* Summary */}
                    <div className="border-t border-gray-50 pt-8 space-y-3">
                        <div className="flex justify-end gap-12 items-center">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">DPP</span>
                            <span className="font-bold text-gray-900 w-40 text-right">Rp {parseFloat(invoice.dpp).toLocaleString('id-ID')}</span>
                        </div>
                        <div className="flex justify-end gap-12 items-center">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">PPN (11%)</span>
                            <span className="font-bold text-gray-900 w-40 text-right">Rp {parseFloat(invoice.ppn).toLocaleString('id-ID')}</span>
                        </div>
                        <div className="flex justify-end gap-12 items-center">
                            <span className="text-[10px] font-black text-gray-900 uppercase tracking-widest">Total</span>
                            <span className="font-black text-gray-900 w-40 text-right text-lg tracking-tight">Rp {parseFloat(invoice.total).toLocaleString('id-ID')}</span>
                        </div>
                    </div>

                </div>
            </div>

            <CancelInvoiceModal
                isOpen={isCancelModalOpen}
                onClose={() => setCancelModalOpen(false)}
                onConfirm={handleCancel}
                invoiceNumber={invoice.tax_invoice_no}
            />
        </Layout>
    );
};

export default SalesTaxInvoiceDetail;
