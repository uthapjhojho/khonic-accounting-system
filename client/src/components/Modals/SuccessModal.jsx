import React from 'react';
import { Check } from 'lucide-react';

const SuccessModal = ({ isOpen, onClose, title, message }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)' }}>
            <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-[400px] mx-4 p-10 flex flex-col items-center text-center">
                <div className="w-24 h-24 bg-[#555555] rounded-full flex items-center justify-center mb-8 shadow-xl">
                    <Check className="text-white" size={48} strokeWidth={4} />
                </div>

                <h2 className="text-2xl font-bold text-[#1A1A1A] mb-3 tracking-tight">{title}</h2>
                <p className="text-gray-500 font-medium mb-10 leading-relaxed text-sm">Faktur Pajak Penjualan berhasil disimpan!</p>

                <button
                    onClick={onClose}
                    className="w-full py-4 bg-[#555555] hover:bg-[#444444] text-white font-bold rounded-xl transition-all shadow-sm text-lg"
                >
                    Kembali
                </button>
            </div>
        </div>
    );
};

export default SuccessModal;
