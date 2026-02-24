import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout/Layout';
import PageHeader from '../../components/Layout/PageHeader';
import { Search, Plus, Filter, Download, MoreVertical, Eye, Edit, Trash2, CheckCircle, Clock, AlertCircle, Calendar, Pencil, X, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import taxInvoiceService from '../../services/taxInvoiceService';
import { formatDate, formatCurrency } from '../../utils/formatUtils';
import customerService from '../../services/customerService';
import CancelInvoiceModal from '../../components/Modals/CancelInvoiceModal';
import nav from '../../constants/navigation.json';
import statuses from '../../constants/statuses.json';

const SalesTaxInvoice = () => {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [customerFilter, setCustomerFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [filterDate, setFilterDate] = useState('');
    const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
    const [selectedInvoiceForCancel, setSelectedInvoiceForCancel] = useState(null);

    const [invoices, setInvoices] = useState([]);
    const [customers, setCustomers] = useState([]);

    // Fetch Tax Invoices
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [invData, custData] = await Promise.all([
                    taxInvoiceService.getAllTaxInvoices(),
                    customerService.getAllCustomers()
                ]);
                setInvoices(invData);
                setCustomers(custData);
            } catch (err) {
                console.error('Error fetching tax invoice data:', err);
            }
        };
        fetchData();
    }, []);

    const handleCancelClick = (invoice) => {
        setSelectedInvoiceForCancel(invoice);
        setIsCancelModalOpen(true);
    };

    const handleConfirmCancel = async () => {
        if (!selectedInvoiceForCancel) return;
        try {
            await taxInvoiceService.updateTaxInvoiceStatus(selectedInvoiceForCancel.id, 'Cancelled');
            // Refresh list
            const data = await taxInvoiceService.getAllTaxInvoices();
            setInvoices(data);
            setIsCancelModalOpen(false);
        } catch (err) {
            console.error('Error cancelling tax invoice:', err);
            alert('Gagal membatalkan faktur pajak');
        }
    };

    // Get unique statuses and customers for filters (from existing invoices)
    const uniqueStatuses = [...new Set(invoices.map(inv => inv.status))].sort();
    const uniqueCustomersInStore = [...new Set(invoices.map(inv => inv.customer_name))].sort();

    const filteredInvoices = invoices.filter(inv => {
        const matchesSearch =
            (inv.tax_invoice_no && inv.tax_invoice_no.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (inv.customer_name && inv.customer_name.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesCustomer = customerFilter === '' || inv.customer_name === customerFilter;
        const matchesStatus = statusFilter === '' || inv.status === statusFilter;

        // Date Filtering Logic
        let matchesDate = true;
        if (filterDate) {
            const d = new Date(inv.date);
            const yyyy = d.getFullYear();
            const mm = String(d.getMonth() + 1).padStart(2, '0');
            const dd = String(d.getDate()).padStart(2, '0');
            const invDateStr = `${yyyy}-${mm}-${dd}`;
            if (invDateStr !== filterDate) matchesDate = false;
        }

        return matchesSearch && matchesCustomer && matchesStatus && matchesDate;
    });

    const getStatusStyle = (status) => {
        return statuses.sales[status] || 'bg-gray-100 text-gray-600';
    };

    return (
        <Layout>
            <PageHeader
                title={nav.sales_tax.label}
                backPath={nav.dashboard.path}
            />

            <div className="space-y-6">
                {/* Toolbar */}
                <div className="flex items-center justify-between gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Cari faktur pajak..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-100 bg-gray-50/50 text-sm transition-all"
                        />
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-xl">
                            <Calendar size={14} className="text-gray-400" />
                            <input
                                type="date"
                                value={filterDate}
                                onChange={(e) => setFilterDate(e.target.value)}
                                onKeyDown={(e) => e.preventDefault()}
                                className="bg-transparent border-none text-[11px] text-gray-600 focus:outline-none focus:ring-0"
                                title="Filter Date"
                            />
                        </div>

                        <div className="relative">
                            <select
                                value={customerFilter}
                                onChange={(e) => setCustomerFilter(e.target.value)}
                                className="appearance-none pl-4 pr-10 py-3 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-600 cursor-pointer hover:bg-gray-50 transition-all focus:outline-none"
                            >
                                <option value="">Customer</option>
                                {uniqueCustomersInStore.map(name => (
                                    <option key={name} value={name}>{name}</option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                        </div>

                        <div className="relative">
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="appearance-none pl-4 pr-10 py-3 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-600 cursor-pointer hover:bg-gray-50 transition-all focus:outline-none"
                            >
                                <option value="">Status</option>
                                {uniqueStatuses.map(status => (
                                    <option key={status} value={status}>{status}</option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                        </div>

                        <button
                            onClick={() => navigate('/faktur-pajak-penjualan/baru')}
                            className="flex items-center gap-2 bg-[#4A4A4A] hover:bg-[#3A3A3A] text-white px-6 py-3 rounded-xl transition-all shadow-sm whitespace-nowrap"
                        >
                            <Plus size={20} />
                            Buat Faktur Pajak Baru
                        </button>
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                    {/* Table Header */}
                    <div className="grid grid-cols-12 gap-4 px-8 py-5 bg-white border-b border-gray-100 text-[12px] font-bold text-gray-500 tracking-wider">
                        <div className="col-span-3">Nomor Faktur Pajak</div>
                        <div className="col-span-1">Tanggal</div>
                        <div className="col-span-2">Customer</div>
                        <div className="col-span-2 text-right">DPP</div>
                        <div className="col-span-1 text-right">PPN</div>
                        <div className="col-span-1 text-right">Total</div>
                        <div className="col-span-1 text-center">Status</div>
                        <div className="col-span-1 text-center">Action</div>
                    </div>

                    {/* Table Body */}
                    <div className="divide-y divide-gray-50">
                        {filteredInvoices.map((invoice) => (
                            <div
                                key={invoice.id}
                                onClick={() => navigate(`/faktur-pajak-penjualan/detail/${invoice.id}`)}
                                className="grid grid-cols-12 gap-4 px-8 py-4 items-center hover:bg-gray-50/50 transition-colors cursor-pointer group"
                            >
                                <div className="col-span-3 text-sm text-gray-400 font-medium tracking-tight font-mono uppercase">{invoice.tax_invoice_no}</div>
                                <div className="col-span-1 text-sm text-gray-900 font-medium">{formatDate(invoice.date)}</div>
                                <div className="col-span-2 text-sm text-gray-700 font-medium">{invoice.customer_name}</div>
                                <div className="col-span-2 text-sm text-right text-gray-500 font-medium">Rp {parseFloat(invoice.dpp).toLocaleString('id-ID')}</div>
                                <div className="col-span-1 text-sm text-right text-gray-500 font-medium">Rp {parseFloat(invoice.ppn).toLocaleString('id-ID')}</div>
                                <div className="col-span-1 text-sm text-right font-black text-gray-900">Rp {parseFloat(invoice.total).toLocaleString('id-ID')}</div>
                                <div className="col-span-1 flex justify-center">
                                    <span className={`px-3 py-1 rounded-lg text-[10px] font-bold ${getStatusStyle(invoice.status)}`}>
                                        {invoice.status}
                                    </span>
                                </div>
                                <div className="col-span-1 flex justify-center gap-2">
                                    {invoice.status === 'Draft' ? (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); navigate(`/faktur-pajak-penjualan/edit/${invoice.id}`); }}
                                            className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg transition-all border border-gray-200"
                                            title="Edit"
                                        >
                                            <Pencil size={14} />
                                        </button>
                                    ) : invoice.status === 'Issued' ? (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleCancelClick(invoice); }}
                                            className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg transition-all border border-gray-200"
                                            title="Cancel"
                                        >
                                            <X size={14} />
                                        </button>
                                    ) : null}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <CancelInvoiceModal
                isOpen={isCancelModalOpen}
                onClose={() => setIsCancelModalOpen(false)}
                onConfirm={handleConfirmCancel}
                invoiceNumber={selectedInvoiceForCancel?.tax_invoice_no}
            />
        </Layout>
    );
};

export default SalesTaxInvoice;
