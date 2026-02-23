import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout/Layout';
import PageHeader from '../../components/Layout/PageHeader';
import { Download, Eye, FileX } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import nav from '../../constants/navigation.json';
import mockData from '../../data/mockData.json';

const PurchaseTaxInvoiceDetail = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const [invoice, setInvoice] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchInvoice = async () => {
            try {
                const response = await axios.get(`http://localhost:5000/api/sales/purchase-tax-invoices/${id}`);
                setInvoice(response.data);
            } catch (err) {
                console.error('Error fetching purchase tax invoice details:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchInvoice();
    }, [id]);

    if (loading) return <Layout><div className="p-8">Memuat data...</div></Layout>;
    if (!invoice) return <Layout><div className="p-8 text-red-500">Faktur pajak pembelian tidak ditemukan.</div></Layout>;

    const items = mockData.purchase_orders[invoice.po_no]?.items || [];

    return (
        <Layout>
            <PageHeader
                title={nav.purchase_tax.label}
                breadcrumbs={[
                    { label: nav.purchase_tax.label, path: nav.purchase_tax.path },
                    { label: 'Detail' }
                ]}
            />

            <div className="max-w-6xl space-y-6 pb-20">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    {/* Actions Header */}
                    <div className="flex justify-between items-start mb-8">
                        <div>
                            {/* Title removed: now in PageHeader */}
                        </div>
                        <div className="flex gap-3">
                            <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
                                <Download size={16} />
                                Download PDF
                            </button>
                            <button className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 rounded-lg text-sm font-medium text-white">
                                <Eye size={16} />
                                Lihat Jurnal
                            </button>
                            <button className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 rounded-lg text-sm font-medium text-white">
                                <FileX size={16} />
                                Void Faktur
                            </button>
                        </div>
                    </div>

                    {/* Metadata Grid */}
                    <div className="grid grid-cols-3 gap-y-6 gap-x-12 mb-8">
                        <div>
                            <div className="text-xs font-semibold text-gray-500 mb-1">Nomor Faktur Pajak</div>
                            <div className="text-sm font-bold text-blue-600 uppercase font-mono">{invoice.tax_invoice_no}</div>
                        </div>
                        <div>
                            <div className="text-xs font-semibold text-gray-500 mb-1">Nama Supplier</div>
                            <div className="text-sm font-medium text-gray-900">{invoice.supplier_name}</div>
                        </div>
                        <div>
                            <div className="text-xs font-semibold text-gray-500 mb-1">Status</div>
                            <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold uppercase ${invoice.status === 'Posted' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                                {invoice.status}
                            </span>
                        </div>

                        <div>
                            <div className="text-xs font-semibold text-gray-500 mb-1">Tanggal Faktur</div>
                            <div className="text-sm font-medium text-gray-900">{new Date(invoice.date).toLocaleDateString('id-ID')}</div>
                        </div>
                        <div>
                            <div className="text-xs font-semibold text-gray-500 mb-1">Tanggal Diterima</div>
                            <div className="text-sm font-medium text-gray-900">{new Date(invoice.received_date).toLocaleDateString('id-ID')}</div>
                        </div>
                        <div>
                            <div className="text-xs font-semibold text-gray-500 mb-1">Masa Pajak</div>
                            <div className="text-sm font-medium text-gray-900">{invoice.masa_pajak}</div>
                        </div>

                        <div>
                            <div className="text-xs font-semibold text-gray-500 mb-1">Nomor Purchase Order (PO)</div>
                            <div className="text-sm font-medium text-gray-900">{invoice.po_no}</div>
                        </div>
                    </div>

                    {/* Items Table */}
                    <div className="mb-4">
                        <h3 className="font-bold text-gray-900 mb-4">Detail Barang / Jasa</h3>
                        <div className="bg-gray-50 rounded-lg p-3 grid grid-cols-12 gap-4 text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
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
                    <div className="border-t border-gray-100 pt-4 space-y-2">
                        <div className="flex justify-end gap-10 text-xs">
                            <span className="text-gray-500 font-medium">DPP</span>
                            <span className="font-bold text-gray-900 w-32 text-right">Rp {parseFloat(invoice.dpp).toLocaleString('id-ID')}</span>
                        </div>
                        <div className="flex justify-end gap-10 text-xs">
                            <span className="text-gray-500 font-medium">PPN (11%)</span>
                            <span className="font-bold text-gray-900 w-32 text-right">Rp {parseFloat(invoice.ppn).toLocaleString('id-ID')}</span>
                        </div>
                        <div className="flex justify-end gap-10 text-sm">
                            <span className="font-bold text-gray-900">Total</span>
                            <span className="font-extrabold text-gray-900 w-32 text-right text-lg">Rp {parseFloat(invoice.total).toLocaleString('id-ID')}</span>
                        </div>
                    </div>

                </div>
            </div>
        </Layout>
    );
};

export default PurchaseTaxInvoiceDetail;
