import React, { useState, useEffect, useRef } from 'react';
import { X, ChevronDown, Check } from 'lucide-react';

const AddAccountModal = ({ isOpen, onClose, accounts = [], onAddAccount }) => {
    const initialFormState = {
        namaAkun: '',
        akunInduk: null,
        nomorAkun: '',
        saldo: ''
    };

    const [formData, setFormData] = useState(initialFormState);
    const [errors, setErrors] = useState({});
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        let timer;
        if (isSuccess) {
            timer = setTimeout(() => {
                handleCloseFull();
            }, 2000);
        }
        return () => clearTimeout(timer);
    }, [isSuccess]);

    // Reset form when modal opens or closes
    useEffect(() => {
        if (!isOpen) {
            setFormData(initialFormState);
            setErrors({});
            setIsDropdownOpen(false);
            setIsSuccess(false);
        }
    }, [isOpen]);

    // Flatten accounts for the dropdown
    const flattenAccounts = (accs, level = 0) => {
        let flat = [];
        accs.forEach(acc => {
            flat.push({ id: acc.id, code: acc.code, name: acc.name, level, parent_id: acc.parent_id });
            if (acc.children) {
                flat = [...flat, ...flattenAccounts(acc.children, level + 1)];
            }
        });
        return flat;
    };

    const flatAccounts = flattenAccounts(accounts);

    // Get all used codes for duplicate check
    const usedCodes = flatAccounts.map(acc => acc.code);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Helper to format number to currency string (Rp is handled by absolute span)
    const formatRupiahValue = (value) => {
        if (value === null || value === undefined || value === '') return '';
        const numberString = value.toString().replace(/[^0-9]/g, '');
        if (!numberString || numberString === '0') return '';
        return numberString.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    };

    const validate = (field, value, currentParent = formData.akunInduk) => {
        let newErrors = { ...errors };

        if (field === 'nomorAkun' || field === 'akunInduk') {
            const code = field === 'nomorAkun' ? value : formData.nomorAkun;
            const parent = field === 'akunInduk' ? value : currentParent;

            if (code && parent) {
                const codeNum = parseFloat(code);
                const parentNum = parseFloat(parent.code);
                const nextLevel = parent.level + 1;

                // 1. Level Check (Max Level 3)
                if (nextLevel > 3) {
                    newErrors.nomorAkun = 'Maksimal hirarki adalah level 3';
                } else if (usedCodes.includes(code)) {
                    // 2. Duplicate Check
                    newErrors.nomorAkun = 'Nomor akun sudah digunakan';
                } else {
                    // 3. Range & Format Check based on Level
                    let isValidRange = false;
                    let isValidFormat = false;

                    if (nextLevel === 1) {
                        // Parent is Level 0 (e.g., 100.000)
                        // Range: [100.000, 200.000)
                        isValidRange = codeNum >= parentNum && codeNum < parentNum + 100.000;
                        isValidFormat = code.endsWith('.000');
                    } else if (nextLevel === 2) {
                        // Parent is Level 1 (e.g., 110.000)
                        // Range: [110.000, 120.000)
                        isValidRange = codeNum >= parentNum && codeNum < parentNum + 10.000;
                        isValidFormat = code.endsWith('.000');
                    } else if (nextLevel === 3) {
                        // Parent is Level 2 (e.g., 111.000)
                        // Range: [111.000, 112.000)
                        isValidRange = codeNum >= parentNum && codeNum < parentNum + 1.000;
                        isValidFormat = !code.endsWith('.000') && code.includes('.');
                    }

                    if (!isValidRange) {
                        newErrors.nomorAkun = `Nomor harus dalam rentang parent (${parent.code})`;
                    } else if (!isValidFormat) {
                        newErrors.nomorAkun = nextLevel === 3 ? 'Format detail harus xxx.yyy (bukan .000)' : 'Format harus xxx.000';
                    } else {
                        delete newErrors.nomorAkun;
                    }
                }
            } else if (!code) {
                delete newErrors.nomorAkun;
            }
        }

        setErrors(newErrors);
    };

    const handleInputChange = (field, value) => {
        let processedValue = value;

        if (field === 'namaAkun') {
            // No numbers, allow letters and specific special characters: & ' " , . / -
            processedValue = value.replace(/[0-9]/g, '');
            processedValue = processedValue.replace(/[^a-zA-Z\s&'\",.\/\-]/g, '');
        }

        if (field === 'nomorAkun') {
            // Only allow numbers and dots, max length 7
            processedValue = value.replace(/[^0-9.]/g, '').slice(0, 7);
        }

        if (field === 'saldo') {
            processedValue = formatRupiahValue(value);
        }

        setFormData(prev => ({ ...prev, [field]: processedValue }));
        validate(field, processedValue);
    };

    const handleParentSelect = (parent) => {
        if (parent.level >= 3) return; // Level 3 cannot be a parent
        setFormData(prev => ({ ...prev, akunInduk: parent }));
        setIsDropdownOpen(false);
        validate('akunInduk', parent);
    };

    const handleSubmit = async () => {
        if (onAddAccount) {
            const result = await onAddAccount({
                parent_id: formData.akunInduk?.id,
                code: formData.nomorAkun,
                name: formData.namaAkun,
                balance: formData.saldo
            });

            if (result && result.success) {
                setIsSuccess(true);
            }
        }
    };

    const handleCloseFull = () => {
        setIsSuccess(false);
        onClose();
    };

    if (!isOpen) return null;

    const hasErrors = Object.keys(errors).length > 0;
    const isFormIncomplete = !formData.namaAkun || !formData.akunInduk || formData.nomorAkun.length !== 7 || !formData.saldo;
    const isButtonDisabled = hasErrors || isFormIncomplete;

    return (
        <div className="fixed inset-0 flex items-center justify-center z-50 px-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.4)' }}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden relative">
                {/* Success View */}
                {isSuccess && (
                    <div className="absolute inset-0 bg-white z-20 flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-300">
                        <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mb-10 shadow-lg shadow-green-100 scale-125">
                            <Check size={48} className="text-white" strokeWidth={3} />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Berhasil Tambah Akun Baru</h2>
                        <p className="text-gray-500 mb-10">Akun baru berhasil ditambahkan!</p>
                        <button
                            onClick={handleCloseFull}
                            className="w-full py-4 rounded-xl bg-green-600 text-white font-bold hover:bg-green-700 transition-all shadow-lg shadow-green-100"
                        >
                            Kembali
                        </button>
                    </div>
                )}

                <div className="flex items-center justify-between p-6">
                    <h2 className="text-xl font-bold text-gray-900">Tambah Akun Baru</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>

                <div className="p-6 pt-0 space-y-5">
                    {/* Nama Akun */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                            <span className="text-red-500">*</span> Nama Akun
                        </label>
                        <input
                            type="text"
                            value={formData.namaAkun}
                            onChange={(e) => handleInputChange('namaAkun', e.target.value)}
                            placeholder="Test Pemasukan"
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-gray-200 outline-none transition-all"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Akun Induk */}
                        <div className="relative" ref={dropdownRef}>
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                                <span className="text-red-500">*</span> Akun Induk
                            </label>
                            <button
                                type="button"
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-gray-200 outline-none flex items-center justify-between bg-white text-left text-gray-900"
                            >
                                <span className="truncate">
                                    {formData.akunInduk ? `${formData.akunInduk.code}` : ''}
                                </span>
                                <ChevronDown size={18} className="text-gray-400 flex-shrink-0 ml-2" />
                            </button>

                            {isDropdownOpen && (
                                <div className="absolute z-10 w-[200%] mt-2 bg-white border border-gray-100 rounded-xl shadow-xl max-h-64 overflow-y-auto py-2">
                                    {flatAccounts.map((acc) => {
                                        const isSelectable = acc.level < 3;
                                        return (
                                            <button
                                                key={acc.id}
                                                type="button"
                                                onClick={() => handleParentSelect(acc)}
                                                className={`w-full text-left px-4 py-2 text-sm transition-colors ${isSelectable
                                                    ? 'hover:bg-gray-50 text-gray-900 font-medium'
                                                    : 'text-gray-400 cursor-not-allowed'
                                                    }`}
                                                style={{ paddingLeft: `${acc.level * 1.5 + 1}rem` }}
                                            >
                                                {acc.code} - {acc.name}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Nomor Akun */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                                <span className="text-red-500">*</span> Nomor Akun
                            </label>
                            <input
                                type="text"
                                value={formData.nomorAkun}
                                maxLength={7}
                                onChange={(e) => handleInputChange('nomorAkun', e.target.value)}
                                placeholder="Contoh : 120.000"
                                className={`w-full px-4 py-3 rounded-xl border ${errors.nomorAkun ? 'border-red-500' : 'border-gray-200'} focus:ring-2 focus:ring-gray-200 outline-none transition-all`}
                            />
                        </div>
                    </div>
                    {errors.nomorAkun && <p className="text-red-500 text-xs mt-[-10px]">{errors.nomorAkun}</p>}

                    {/* Saldo */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                            <span className="text-red-500">*</span> Saldo
                        </label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">Rp</span>
                            <input
                                type="text"
                                value={formData.saldo}
                                placeholder="0"
                                onChange={(e) => handleInputChange('saldo', e.target.value)}
                                className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-gray-200 outline-none transition-all"
                            />
                        </div>
                    </div>

                    {/* Submit Button */}
                    <button
                        onClick={handleSubmit}
                        className={`w-full py-4 rounded-xl font-bold transition-all mt-4 mb-2 ${isButtonDisabled
                            ? 'bg-gray-200 text-white cursor-not-allowed'
                            : 'bg-green-600 text-white hover:bg-green-700 shadow-lg'
                            }`}
                        disabled={isButtonDisabled}
                    >
                        Tambah Jurnal
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AddAccountModal;
