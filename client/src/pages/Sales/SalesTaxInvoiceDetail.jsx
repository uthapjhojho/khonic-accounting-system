import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout/Layout';
import PageHeader from '../../components/Layout/PageHeader';
import { useParams, useNavigate } from 'react-router-dom';
import taxInvoiceService from '../../services/taxInvoiceService';
import { formatDate, formatCurrency } from '../../utils/formatUtils';
import SuccessModal from '../../components/Modals/SuccessModal';
import nav from '../../constants/navigation.json';
import statuses from '../../constants/statuses.json';

const SalesTaxInvoiceDetail = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const [isCancelModalOpen, setCancelModalOpen] = useState(false);
    const [invoice, setInvoice] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchInvoice = async () => {
            try {
                const data = await taxInvoiceService.getTaxInvoiceById(id);
                setInvoice(data);
            } catch (err) {
                console.error('Error fetching tax invoice details:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchInvoice();
    }, [id]);

    const handleCancel = async () => {
        try {
            await taxInvoiceService.updateTaxInvoiceStatus(id, 'Cancelled');
            setCancelModalOpen(false);
            navigate(nav.sales_tax.path);
        } catch (err) {
            console.error('Error cancelling tax invoice:', err);
            alert('Gagal membatalkan faktur pajak');
        }
    };

    if (loading) return <Layout><div className="p-8">Memuat data...</div></Layout>;
    if (!invoice) return <Layout><div className="p-8 text-red-500">Faktur pajak tidak ditemukan.</div></Layout>;

    const status = invoice.status;

    return (
        <Layout>
            <div className="max-w-6xl space-y-6 pb-20">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
                    {/* Consolidated Header and Actions - NOW Standardized */}
                    <PageHeader
                        title={nav.sales_tax.label}
                        breadcrumbs={[
                            { label: nav.sales_tax.label, path: nav.sales_tax.path },
                            { label: 'Detail' }
                        ]}
                        noMargin
                    >
                        <div className="flex items-center gap-3">
                            <button className="flex items-center gap-2 px-6 py-2.5 border border-gray-200 font-bold rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-all shadow-sm">
                                <Download size={18} />
                                Download PDF
                            </button>
                            {status === 'Draft' ? (
                                <button
                                    onClick={() => navigate(`/faktur-pajak-penjualan/edit/${id}`)}
                                    className="flex items-center gap-2 px-6 py-2.5 bg-[#5CB35C] hover:bg-[#4CA34C] font-bold rounded-xl text-sm text-white transition-all shadow-sm"
                                >
                                    <Pencil size={18} />
                                    Edit Faktur Penjualan
                                </button>
                            ) : status === 'Issued' ? (
                                <button
                                    onClick={() => setCancelModalOpen(true)}
                                    className="flex items-center gap-2 px-6 py-2.5 bg-red-600 hover:bg-red-700 font-bold rounded-xl text-sm text-white transition-all shadow-sm"
                                >
                                    <XCircle size={18} />
                                    Cancel
                                </button>
                            ) : null}
                        </div>
                    </PageHeader>

                    <div className="h-10"></div>

                    {/* Metadata Grid */}
                    <div className="space-y-6 mb-12">
                        <div className="grid grid-cols-3 gap-x-12 pb-6 border-b border-gray-100">
                            <div>
                                <div className="text-[13px] font-bold text-gray-900 mb-2">Nomor Faktur Pajak</div>
                                <div className="text-sm text-blue-600 font-mono tracking-tight uppercase">{invoice.tax_invoice_no}</div>
                            </div>
                            <div>
                                <div className="text-[13px] font-bold text-gray-900 mb-2">Nama Customer</div>
                                <div className="text-sm text-gray-700">{invoice.customer_name}</div>
                            </div>
                            <div>
                                <div className="text-[13px] font-bold text-gray-900 mb-2">Status</div>
                                <span className={`inline-block px-4 py-1 font-bold rounded-lg text-xs ${statuses.sales[status] || 'bg-gray-100 text-gray-600'}`}>
                                    {status}
                                </span>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-x-12 pb-6 border-b border-gray-100">
                            <div>
                                <div className="text-[13px] font-bold text-gray-900 mb-2">Tanggal Faktur</div>
                                <p className="text-sm font-medium text-gray-900">{formatDate(invoice.date)}</p>
                            </div>
                            <div>
                                <div className="text-[13px] font-bold text-gray-900 mb-2">Masa Pajak</div>
                                <div className="text-sm text-gray-700">{invoice.masa_pajak}</div>
                            </div>
                            <div></div>
                        </div>

                        <div className="grid grid-cols-3 gap-x-12">
                            <div>
                                <div className="text-[13px] font-bold text-gray-900 mb-2">Nomor Penjualan</div>
                                <div className="text-sm text-gray-700">{invoice.trade_invoice_no}</div>
                            </div>
                            <div>
                                <div className="text-[13px] font-bold text-gray-900 mb-2">ID Pelanggan</div>
                                <div className="text-sm text-gray-700">{invoice.customer_id}</div>
                            </div>
                            <div></div>
                        </div>
                    </div>

                    {/* Items Table */}
                    <div className="mb-8">
                        <h3 className="font-bold text-gray-900 mb-6 decoration-gray-100 decoration-4 underline-offset-8">Detail Barang / Jasa</h3>
                        <div className="bg-gray-50 p-4 grid grid-cols-12 gap-4 text-[13px] text-gray-900 mb-4">
                            <div className="col-span-7">Nama Barang / Jasa</div>
                            <div className="col-span-1 text-center">Kuantitas</div>
                            <div className="col-span-2 text-right">Harga Satuan</div>
                            <div className="col-span-2 text-right">Total</div>
                        </div>

                        <div className="divide-y divide-gray-100">
                            {invoice.items && invoice.items.length > 0 ? (
                                invoice.items.map((item, idx) => (
                                    <div key={idx} className="grid grid-cols-12 gap-4 items-center py-5">
                                        <div className="col-span-7 text-sm text-gray-900">{item.name}</div>
                                        <div className="col-span-1 text-sm text-center text-gray-900">{item.qty}</div>
                                        <div className="col-span-2 text-sm text-right text-gray-500">Rp {parseFloat(item.price).toLocaleString('id-ID')}</div>
                                        <div className="col-span-2 text-sm text-right text-gray-900">Rp {parseFloat(item.total).toLocaleString('id-ID')}</div>
                                    </div>
                                ))
                            ) : (
                                <div className="grid grid-cols-12 gap-4 items-center py-5">
                                    <div className="col-span-7 text-sm font-bold text-gray-900 text-italic">Tidak ada item data</div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Summary */}
                    <div className="border-t border-gray-100 pt-8 space-y-4">
                        <div className="grid grid-cols-12 gap-4">
                            <div className="col-span-10 text-right text-sm font-bold text-gray-400 self-center">DPP</div>
                            <div className="col-span-2 text-right text-gray-900 text-lg">Rp {parseFloat(invoice.dpp).toLocaleString('id-ID')}</div>
                        </div>
                        <div className="grid grid-cols-12 gap-4">
                            <div className="col-span-10 text-right text-sm font-bold text-gray-400 self-center">PPN (11%)</div>
                            <div className="col-span-2 text-right text-gray-900 text-lg">Rp {parseFloat(invoice.ppn).toLocaleString('id-ID')}</div>
                        </div>
                        <div className="grid grid-cols-12 gap-4">
                            <div className="col-span-10 text-right text-sm font-black text-gray-500 self-center">Total</div>
                            <div className="col-span-2 text-right font-black text-gray-900 text-xl tracking-tight">Rp {parseFloat(invoice.total).toLocaleString('id-ID')}</div>
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
        </Layout >
    );
};

export default SalesTaxInvoiceDetail;
