import React from 'react';
import { X, AlertCircle } from 'lucide-react';

const CancelInvoiceModal = ({ isOpen, onClose, onConfirm, invoiceNumber }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
            <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-md mx-4 p-8 relative">
                <button onClick={onClose} className="absolute right-6 top-6 text-gray-400 hover:text-gray-600">
                    <X size={24} />
                </button>

                <h2 className="text-xl font-bold text-gray-900 mb-4 pr-8">Batalkan Faktur Pajak</h2>

                <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                    Anda akan membatalkan Faktur Pajak <span className="font-bold text-gray-900">{invoiceNumber || '010.001-25.12345678'}</span>. Tindakan ini akan mengubah statusnya menjadi "Cancelled" dan tidak dapat diurungkan.
                </p>

                <div className="bg-gray-50 p-4 rounded-xl flex items-start gap-3 mb-8 border border-gray-100">
                    <div className="bg-white p-1 rounded-full shadow-sm border border-gray-100 mt-0.5">
                        <AlertCircle size={16} className="text-gray-400" />
                    </div>
                    <p className="text-xs text-gray-500 font-medium leading-tight">
                        Pastikan Anda juga telah membatalkan faktur ini di aplikasi e-Faktur DJP.
                    </p>
                </div>

                <div className="space-y-3">
                    <button
                        onClick={onConfirm}
                        className="w-full py-3.5 bg-[#555555] hover:bg-[#444444] text-white font-bold rounded-xl transition-all shadow-sm"
                    >
                        Ya, Batalkan
                    </button>
                    <button
                        onClick={onClose}
                        className="w-full py-3.5 border border-gray-200 hover:bg-gray-50 text-gray-500 font-bold rounded-xl transition-all"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CancelInvoiceModal;
