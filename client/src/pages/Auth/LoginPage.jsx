import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { LogIn, User, Lock, Loader, Eye, EyeOff, CheckCircle } from 'lucide-react';

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [successMessage, setSuccessMessage] = useState(location.state?.message || '');

    // 10-second auto-dismiss for success notification
    useEffect(() => {
        if (successMessage) {
            const timer = setTimeout(() => setSuccessMessage(''), 10000);
            return () => clearTimeout(timer);
        }
    }, [successMessage]);

    // Clear state from history so it doesn't reappear
    useEffect(() => {
        if (location.state?.message) {
            window.history.replaceState({}, document.title);
        }
    }, [location.state]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMessage(''); // Dismiss success message when clicking login
        setIsLoading(true);

        try {
            await login(email, password);
            navigate('/list-akun'); // Redirect to dashboard after login
        } catch (err) {
            setError(err.message || 'Login gagal. Silakan periksa kredensial Anda.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 border border-gray-100">
                <div className="text-center mb-8">
                    <div className="flex justify-center mb-6">
                        <div className="flex items-center gap-2">
                            <span className="font-bold text-3xl tracking-tight text-gray-900">Khonic</span>
                            <span className="text-gray-500 text-lg">backoffice</span>
                        </div>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">Selamat Datang</h2>
                    <p className="text-gray-500 mt-2">Silakan masuk untuk melanjutkan</p>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg mb-6 border border-red-100">
                        {error}
                    </div>
                )}

                {successMessage && (
                    <div className="fixed top-20 right-8 z-50 flex items-center gap-2 px-6 py-4 rounded-xl border border-transparent bg-green-600 text-white shadow-2xl animate-in slide-in-from-top-4 duration-300">
                        <CheckCircle size={20} className="text-white" />
                        <span className="font-bold tracking-tight">{successMessage}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                <User size={18} />
                            </div>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
                                placeholder="nama@gmail.com"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                <Lock size={18} />
                            </div>
                            <input
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full pl-10 pr-10 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
                                placeholder="••••••••"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 outline-none"
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm"
                    >
                        {isLoading ? (
                            <>
                                <Loader size={18} className="animate-spin" />
                                Memproses...
                            </>
                        ) : (
                            <>
                                <LogIn size={18} />
                                Masuk
                            </>
                        )}
                    </button>
                </form>
                <div className="mt-8 text-center text-sm text-gray-500">
                    Belum punya akun? <Link to="/register" className="text-orange-600 hover:text-orange-700 font-medium">Daftar sekarang</Link>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
