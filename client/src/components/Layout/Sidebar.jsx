import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    List,
    FileText,
    Building2,
    TrendingUp,
    TrendingDown,
    Receipt,
    FileSpreadsheet,
    BookOpen,
    ClipboardList
} from 'lucide-react';

const Sidebar = () => {
    const location = useLocation();

    const menuItems = [
        {
            section: 'MENU', items: [
                { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
                { name: 'Daftar Akun', path: '/list-akun', icon: List },
                { name: 'Convert ke DJP', path: '/convert-djp', icon: FileText },
                { name: 'E-Faktur', path: '/e-faktur', icon: Building2 },
            ]
        },
        {
            section: 'KAS & BANK', items: [
                { name: 'Penerimaan', path: '/penerimaan', icon: TrendingUp },
                { name: 'Pengeluaran', path: '/pengeluaran', icon: TrendingDown },
            ]
        },
        {
            section: 'PENJUALAN', items: [
                { name: 'Penagihan', path: '/penagihan', icon: Receipt },
                { name: 'Faktur Pajak Penjualan', path: '/faktur-pajak-penjualan', icon: FileText },
            ]
        },
        {
            section: 'PEMBELIAN', items: [
                { name: 'Faktur Pajak Pembelian', path: '/faktur-pajak-pembelian', icon: ClipboardList },
            ]
        },
        {
            section: 'PAJAK', items: [
                { name: 'Review Faktur Pajak', path: '/review-faktur-pajak', icon: FileText },
            ]
        },
        {
            section: 'BUKU BESAR', items: [
                { name: 'Jurnal Umum', path: '/jurnal-umum', icon: BookOpen },
                { name: 'Review Transaksi', path: '/review-transaksi', icon: ClipboardList },
            ]
        },
    ];

    return (
        <div className="w-64 bg-sidebar border-r border-gray-200 min-h-screen flex flex-col font-sans">
            <div className="p-6 flex items-center gap-2">
                <span className="font-bold text-xl tracking-tight">Khonic</span>
                <span className="text-gray-500 text-sm">backoffice</span>
            </div>

            <div className="flex-1 overflow-y-auto py-4">
                {menuItems.map((section, idx) => (
                    <div key={idx} className="mb-6 px-4">
                        <h3 className="text-xs font-semibold text-gray-500 mb-3 tracking-wider">{section.section}</h3>
                        <div className="space-y-1">
                            {section.items.map((item) => {
                                const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
                                const Icon = item.icon;
                                return (
                                    <Link
                                        key={item.path}
                                        to={item.path}
                                        className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${isActive
                                            ? 'bg-gray-100 text-gray-900 font-medium'
                                            : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                                            }`}
                                    >
                                        <Icon size={18} className={isActive ? 'text-gray-900' : 'text-gray-400'} />
                                        {item.name}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Sidebar;
