import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout/Layout';
import PageHeader from '../../components/Layout/PageHeader';
import { useParams, useNavigate } from 'react-router-dom';
import taxInvoiceService from '../../services/taxInvoiceService';
import { formatDate, formatCurrency } from '../../utils/formatUtils';
import SuccessModal from '../../components/Modals/SuccessModal';
import nav from '../../constants/navigation.json';
import statuses from '../../constants/statuses.json';
import mockData from '../../data/mockData.json';

const PurchaseTaxInvoiceDetail = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const [invoice, setInvoice] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isVoidModalOpen, setVoidModalOpen] = useState(false);

    useEffect(() => {
        const fetchInvoice = async () => {
            try {
                const data = await taxInvoiceService.getPurchaseTaxInvoiceById(id);
                setInvoice(data);
            } catch (err) {
                console.error('Error fetching purchase tax invoice details:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchInvoice();
    }, [id]);

    const handleVoid = async () => {
        try {
            await taxInvoiceService.voidPurchaseTaxInvoice(id);
            setVoidModalOpen(false);
            // Navigate back to the list view instead of refreshing
            navigate(nav.purchase_tax.path);
        } catch (err) {
            console.error('Error voiding invoice:', err);
            alert(err.response?.data?.error || 'Gagal melakukan void faktur');
        }
    };

    if (loading) return <Layout><div className="p-8">Memuat data...</div></Layout>;
    if (!invoice) return <Layout><div className="p-8 text-red-500">Faktur pajak pembelian tidak ditemukan.</div></Layout>;

    const items = invoice.items || [];

    return (
        <Layout>

            <div className="max-w-6xl space-y-6 pb-20">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                    <PageHeader
                        title={nav.purchase_tax.label}
                        breadcrumbs={[
                            { label: nav.purchase_tax.label, path: nav.purchase_tax.path },
                            { label: 'Detail' }
                        ]}
                        noMargin
                    >
                        <div className="flex gap-3">
                            <button className="flex items-center gap-2 px-6 py-2.5 border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50 transition-all shadow-sm">
                                <Download size={18} />
                                Download PDF
                            </button>
                            {invoice.status === 'Draft' ? (
                                <button
                                    onClick={() => navigate(`/faktur-pajak-pembelian/edit/${id}`)}
                                    className="flex items-center gap-2 px-6 py-2.5 bg-[#5CB35C] hover:bg-[#4CA34C] rounded-xl text-sm font-bold text-white transition-all shadow-sm"
                                >
                                    <Pencil size={18} />
                                    Edit Faktur Pembelian
                                </button>
                            ) : invoice.status === 'Posted' ? (
                                <>
                                    <button className="flex items-center gap-2 px-6 py-2.5 bg-[#5CB35C] hover:bg-[#4CA34C] rounded-xl text-sm font-bold text-white transition-all shadow-sm">
                                        <Eye size={18} />
                                        Lihat Jurnal
                                    </button>
                                    <button
                                        onClick={() => setVoidModalOpen(true)}
                                        className="flex items-center gap-2 px-6 py-2.5 bg-red-600 hover:bg-red-700 rounded-xl text-sm font-bold text-white transition-all shadow-sm"
                                    >
                                        <FileX size={18} />
                                        Void Faktur
                                    </button>
                                </>
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
                                <div className="text-[13px] font-bold text-gray-900 mb-2">Nama Supplier</div>
                                <div className="text-sm text-gray-700">{invoice.supplier_name}</div>
                            </div>
                            <div>
                                <div className="text-[13px] font-bold text-gray-900 mb-2">Status</div>
                                <span className={`inline-block px-4 py-1 font-bold rounded-lg text-xs ${statuses.purchase[invoice.status] || 'bg-gray-100 text-gray-600'}`}>
                                    {invoice.status}
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
                            <div>
                                <div className="text-[13px] font-bold text-gray-900 mb-2">Tanggal Terima</div>
                                <div className="text-sm text-gray-700">{formatDate(invoice.received_date)}</div>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-x-12">
                            <div>
                                <div className="text-[13px] font-bold text-gray-900 mb-2">Nomor Purchase Order (PO)</div>
                                <div className="text-sm text-gray-700">{invoice.po_no}</div>
                            </div>
                            <div>
                                <div className="text-[13px] font-bold text-gray-900 mb-2">Nomor Goods Received Note (GRN)</div>
                                <div className="text-sm text-gray-700">{invoice.grn_no || 'N/A'}</div>
                            </div>
                            <div></div>
                        </div>
                    </div>

                    {/* Items Table */}
                    <div className="mb-4">
                        <h3 className="font-bold text-gray-900 mb-4">Detail Barang / Jasa</h3>
                        <div className="bg-gray-50 rounded-lg p-3 grid grid-cols-12 gap-4 text-xs text-gray-500 tracking-wider mb-2">
                            <div className="col-span-6">Nama Barang / Jasa</div>
                            <div className="col-span-2 text-center">Kuantitas</div>
                            <div className="col-span-2 text-right">Harga Satuan</div>
                            <div className="col-span-2 text-right">Total</div>
                        </div>

                        <div className="space-y-4">
                            {items.map((item, idx) => (
                                <div key={idx} className="grid grid-cols-12 gap-4 items-center border-b border-gray-50 pb-4 last:border-0 last:pb-0">
                                    <div className="col-span-6 text-sm font-medium text-gray-900">{item.name}</div>
                                    <div className="col-span-2 text-sm text-center text-gray-900">{item.qty}</div>
                                    <div className="col-span-2 text-sm text-right text-gray-900">Rp {item.price.toLocaleString('id-ID')}</div>
                                    <div className="col-span-2 text-sm text-right text-gray-900 font-medium">Rp {item.total.toLocaleString('id-ID')}</div>
                                </div>
                            ))}
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

                <VoidInvoiceModal
                    isOpen={isVoidModalOpen}
                    onClose={() => setVoidModalOpen(false)}
                    onConfirm={handleVoid}
                    invoiceNumber={invoice.tax_invoice_no}
                />
            </div>
        </Layout>
    );
};

export default PurchaseTaxInvoiceDetail;
