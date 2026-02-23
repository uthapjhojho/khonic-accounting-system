import React from 'react';
import { Check } from 'lucide-react';

const SuccessModal = ({ isOpen, onClose, title, message }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 flex items-center justify-center z-50 animate-in fade-in duration-300" style={{ backgroundColor: 'rgba(0, 0, 0, 0.4)' }}>
            <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-[400px] mx-4 p-10 flex flex-col items-center text-center animate-in zoom-in-95 duration-300">
                <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mb-8 shadow-xl shadow-green-100">
                    <Check className="text-white" size={48} strokeWidth={4} />
                </div>

                <h2 className="text-2xl font-bold text-[#1A1A1A] mb-3 tracking-tight">{title}</h2>
                <p className="text-gray-500 font-medium mb-10 leading-relaxed text-sm">{message || 'Berhasil disimpan!'}</p>

                <button
                    onClick={onClose}
                    className="w-full py-4 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl transition-all shadow-sm text-lg"
                >
                    Kembali
                </button>
            </div>
        </div>
    );
};

export default SuccessModal;
