import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import accountService from '../../services/accountService';
import Layout from '../../components/Layout/Layout';
import AddAccountModal from '../../components/Modals/AddAccountModal';
import EditAccountModal from '../../components/Modals/EditAccountModal';
import DeleteAccountModal from '../../components/Modals/DeleteAccountModal';
import { Plus, Search, ChevronDown, ChevronUp, PencilLine, Trash2, CheckCircle, AlertTriangle, Lock } from 'lucide-react';
import nav from '../../constants/navigation.json';
import PageHeader from '../../components/Layout/PageHeader';

// Removed initialAccounts mock

const AccountList = () => {
    const location = useLocation();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedAccount, setSelectedAccount] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [notification, setNotification] = useState(location.state?.notification || null);
    const [expanded, setExpanded] = useState({});
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchAccounts = async () => {
        try {
            const data = await accountService.getAllAccounts();

            // Build tree from flat list
            const buildTree = (list) => {
                if (!list || !Array.isArray(list)) return [];
                const map = {};
                list.forEach(item => {
                    map[item.id] = { ...item, children: [] };
                });
                const tree = [];
                list.forEach(item => {
                    if (item.parent_id && map[item.parent_id]) {
                        map[item.parent_id].children.push(map[item.id]);
                    } else {
                        tree.push(map[item.id]);
                    }
                });
                return tree;
            };

            setAccounts(buildTree(data));
        } catch (err) {
            console.error('Error fetching accounts:', err);
            setAccounts([]); // Reset to empty if error
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        fetchAccounts();
    }, []);

    React.useEffect(() => {
        if (location.state?.notification) {
            window.history.replaceState({}, document.title);
        }
    }, [location.state]);

    const handleAddAccount = async (newAccountData) => {
        try {
            const { parent_id, code, name, balance } = newAccountData;

            // Find parent to get level and type
            const findParent = (accs, id) => {
                for (const acc of accs) {
                    if (acc.id === id) return acc;
                    if (acc.children) {
                        const found = findParent(acc.children, id);
                        if (found) return found;
                    }
                }
                return null;
            };

            const parent = findParent(accounts, parent_id);

            await accountService.createAccount({
                id: code,
                code,
                name,
                level: parent ? parent.level + 1 : 0,
                type: parent ? parent.type : 'Assets',
                parent_id: parent_id,
                balance: parseBalance(balance),
                is_system: false
            });

            await fetchAccounts();
            setNotification({ message: 'Berhasil Tambah Akun!', type: 'success' });
            setTimeout(() => setNotification(null), 3000);
            return { success: true };
        } catch (err) {
            console.error('Error adding account:', err);
            const errorMsg = err.response?.data?.error || err.message || 'Gagal tambah akun';
            setNotification({ message: errorMsg, type: 'error' });
            setTimeout(() => setNotification(null), 5000);
            return { success: false, message: errorMsg };
        }
    };

    const handleEditAccount = async (updatedData) => {
        try {
            await accountService.updateAccount(updatedData.id, {
                id: updatedData.id,
                code: updatedData.code,
                name: updatedData.name,
                level: updatedData.level,
                type: updatedData.type,
                parent_id: updatedData.parent_id,
                is_system: updatedData.is_system,
                balance: parseBalance(updatedData.balance)
            });

            await fetchAccounts();
            setNotification({ message: 'Berhasil Edit Akun!', type: 'success' });
            setTimeout(() => setNotification(null), 3000);
            return { success: true };
        } catch (err) {
            console.error('Error updating account:', err);
            const errorMsg = err.response?.data?.error || err.message || 'Gagal edit akun';
            setNotification({ message: errorMsg, type: 'error' });
            setTimeout(() => setNotification(null), 5000);
            return { success: false, message: errorMsg };
        }
    };

    const handleDeleteAccount = async (id) => {
        try {
            await accountService.deleteAccount(id);
            await fetchAccounts();
            setNotification({ message: 'Berhasil Hapus Akun!', type: 'success' });
            setTimeout(() => setNotification(null), 3000);
        } catch (err) {
            console.error('Error deleting account:', err);
            const errorMsg = err.response?.data?.error || err.message || 'Gagal hapus akun';
            setNotification({ message: errorMsg, type: 'warning' });
            setTimeout(() => setNotification(null), 5000);
        }
    };

    const handleEditClick = (account) => {
        if (account.children && account.children.length > 0) {
            setNotification({ message: 'Akun tidak dapat diubah karena memiliki akun turunan', type: 'warning' });
            setTimeout(() => setNotification(null), 8000);
            return;
        }
        setSelectedAccount(account);
        setIsEditModalOpen(true);
    };

    const handleDeleteClick = (account) => {
        if (account.children && account.children.length > 0) {
            setNotification({ message: 'Akun tidak dapat dihapus karena memiliki akun turunan', type: 'warning' });
            setTimeout(() => setNotification(null), 8000);
            return;
        }
        setSelectedAccount(account);
        setIsDeleteModalOpen(true);
    };

    const toggleExpand = (id) => {
        // ...
        setExpanded(prev => ({
            ...prev,
            [id]: prev[id] === undefined ? false : !prev[id]
        }));
    };

    // Helper to parse balance (can be number or string from API or input)
    const parseBalance = (val) => {
        if (typeof val === 'number') return val;
        if (!val || val === '') return 0;

        let str = val.toString().trim().replace(/Rp|\s/g, '');

        // If it contains a comma, it's definitely Indonesian format (dot=thousands, comma=decimal)
        if (str.includes(',')) {
            str = str.replace(/\./g, '').replace(',', '.');
        } else {
            // Handle cases with only dots
            const dots = (str.match(/\./g) || []).length;
            if (dots > 1) {
                // Multiple dots = thousands separators (e.g. 1.000.000)
                str = str.replace(/\./g, '');
            } else if (dots === 1) {
                // Single dot: ambiguous. 
                // In ID format, 1.000 is 1000. In EN format, 1.000 is 1.
                // If the dot is followed by exactly 3 digits, it's almost certainly a thousand separator in this context.
                const parts = str.split('.');
                if (parts[1].length === 3) {
                    str = str.replace(/\./g, '');
                }
                // Otherwise, keep the dot as decimal (e.g. 1000.50 from API)
            }
        }

        const result = parseFloat(str);
        return isNaN(result) ? 0 : result;
    };

    // Helper to format number to currency string
    const formatBalance = (num) => {
        return 'Rp' + num.toLocaleString('id-ID');
    };

    // Recursive function to sum all child balances
    const calculateTotal = (account) => {
        if (!account.children || account.children.length === 0) {
            return parseBalance(account.balance);
        }
        return account.children.reduce((sum, child) => sum + calculateTotal(child), 0);
    };

    // Recursive sorting function
    const sortAccounts = (accs) => {
        return [...accs].sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }))
            .map(acc => ({
                ...acc,
                children: acc.children ? sortAccounts(acc.children) : []
            }));
    };

    // Recursive filtering function
    const filterAccounts = (accs, term) => {
        if (!term) return accs;
        const lowerTerm = term.toLowerCase();

        return accs.map(acc => {
            const matchesCurrent = acc.name.toLowerCase().includes(lowerTerm) ||
                acc.code.toLowerCase().includes(lowerTerm);

            const filteredChildren = acc.children ? filterAccounts(acc.children, term) : [];
            const hasMatchingChildren = filteredChildren.length > 0;

            if (matchesCurrent || hasMatchingChildren) {
                return {
                    ...acc,
                    children: filteredChildren
                };
            }
            return null;
        }).filter(Boolean);
    };

    const filteredAccounts = filterAccounts(accounts, searchTerm);
    const sortedAccounts = sortAccounts(filteredAccounts);

    const renderRow = (account, isLast = false, parentLast = []) => {
        const hasChildren = account.children && account.children.length > 0;
        const isExpanded = expanded[account.id] !== false; // Default to expanded if undefined

        if (account.level === 0) {
            const totalSaldo = calculateTotal(account);

            return (
                <React.Fragment key={account.id}>
                    <div className="flex items-center py-3 bg-gray-50 border-b border-gray-200 text-sm font-bold text-gray-500 uppercase tracking-wider mt-4 first:mt-0 group min-h-[52px]">
                        <div className="w-1/4 pl-4 text-gray-600">{account.code}</div>
                        <div className="flex-1 text-gray-900 flex items-center gap-2">
                            {account.name}
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                {account.is_system && (
                                    <div className="p-1.5 bg-gray-200/50 border border-gray-300/30 rounded-lg text-gray-500">
                                        <Lock size={12} />
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="w-64 text-right pr-4 flex items-center justify-end gap-3">
                            <span className="text-gray-400 normal-case font-medium whitespace-nowrap">Total Saldo :</span>
                            <span className="text-gray-900 text-sm normal-case whitespace-nowrap min-w-[120px]">{formatBalance(totalSaldo)}</span>
                            <button
                                onClick={() => toggleExpand(account.id)}
                                className="p-1 hover:bg-gray-200 rounded-full transition-colors text-gray-500"
                            >
                                {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </button>
                        </div>
                    </div>
                    {hasChildren && isExpanded && account.children.map((child, index) =>
                        renderRow(child, index === account.children.length - 1, [...parentLast, true])
                    )}
                </React.Fragment>
            );
        }

        return (
            <React.Fragment key={account.id}>
                <div className="flex items-center py-4 border-b border-gray-50 hover:bg-gray-50 transition-colors relative group">
                    {/* Tree Lines Container */}
                    <div className="absolute top-0 bottom-0 left-4" style={{ width: `${account.level * 2}rem` }}>
                        {/* Parent Vertical Lines */}
                        {parentLast.slice(1, -1).map((isParentLast, i) => (
                            !isParentLast && (
                                <div
                                    key={i}
                                    className="absolute top-0 bottom-0 border-l border-gray-200"
                                    style={{ left: `${(i + 1) * 2 - 1}rem` }}
                                />
                            )
                        ))}
                        {/* Current Level L-Shape */}
                        <div
                            className={`absolute top-0 ${isLast ? 'h-1/2' : 'bottom-0'} border-l border-gray-200`}
                            style={{ left: `${(account.level - 1) * 2 + 1}rem` }}
                        />
                        <div
                            className="absolute top-1/2 border-b border-gray-200"
                            style={{
                                left: `${(account.level - 1) * 2 + 1}rem`,
                                width: '1rem'
                            }}
                        />
                    </div>

                    <div className="w-1/4 pl-4" style={{ paddingLeft: `${account.level * 2 + 1.25}rem` }}>
                        <span className="text-gray-600 font-medium">{account.code}</span>
                    </div>
                    <div className="flex-1 flex items-center gap-2">
                        <span className="text-gray-900 font-medium">{account.name}</span>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {account.is_system ? (
                                <div className="p-1.5 bg-gray-50 border border-gray-100 rounded-lg text-gray-400">
                                    <Lock size={14} />
                                </div>
                            ) : (
                                <>
                                    <button
                                        onClick={() => handleEditClick(account)}
                                        className="p-1.5 bg-white border border-gray-100 rounded-lg shadow-sm hover:bg-gray-50 text-gray-500 transition-all"
                                    >
                                        <PencilLine size={14} />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteClick(account)}
                                        className="p-1.5 bg-white border border-gray-100 rounded-lg shadow-sm hover:bg-red-50 hover:text-red-500 text-gray-500 transition-all"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                    <div className="w-64 text-right pr-4">
                        <span className={`min-w-[120px] inline-block pr-[28px] font-medium ${hasChildren ? 'text-gray-900' : 'text-gray-500'}`}>
                            {formatBalance(hasChildren ? calculateTotal(account) : parseBalance(account.balance))}
                        </span>
                    </div>
                </div>
                {hasChildren && isExpanded && account.children.map((child, index) =>
                    renderRow(child, index === account.children.length - 1, [...parentLast, isLast])
                )}
            </React.Fragment>
        );
    };

    return (
        <Layout>
            <PageHeader
                title={nav.accounts.label}
                breadcrumbs={[
                    { label: nav.accounts.label, path: nav.accounts.path }
                ]}
            />
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 min-h-[calc(100vh-8rem)] relative">
                {loading && (
                    <div className="absolute inset-0 bg-white/50 z-50 flex items-center justify-center rounded-xl">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                    </div>
                )}
                {/* Floating Notification */}
                {notification && (
                    <div className={`fixed top-20 right-8 z-50 flex items-center gap-2 px-4 py-3 rounded-xl border border-transparent shadow-xl animate-in slide-in-from-top-2 duration-300 ${(notification.type === 'warning' || notification.type === 'error')
                        ? 'bg-red-500 text-white'
                        : 'bg-green-600 text-white'
                        }`}>
                        {(notification.type === 'warning' || notification.type === 'error') ? (
                            <AlertTriangle size={18} className="text-white" />
                        ) : (
                            <CheckCircle size={18} className="text-white" />
                        )}
                        <span className="font-bold text-sm">{notification.message}</span>
                    </div>
                )}

                {/* Toolbar */}
                <div className="p-6 flex items-center justify-between border-b border-gray-100 gap-4">
                    <div className="relative flex-1 max-w-xl">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Cari akun..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-200 bg-gray-50"
                        />
                    </div>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center gap-2 bg-gray-700 hover:bg-gray-800 text-white px-5 py-2.5 rounded-lg font-medium transition-colors"
                    >
                        <Plus size={18} />
                        Tambah Akun Baru
                    </button>
                </div>


                {/* Table Body */}
                <div className="text-sm">
                    {sortedAccounts.map(account => renderRow(account))}
                </div>
            </div>

            <AddAccountModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                accounts={accounts}
                onAddAccount={handleAddAccount}
            />

            <EditAccountModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                accounts={accounts}
                onEditAccount={handleEditAccount}
                account={selectedAccount}
            />

            <DeleteAccountModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onDelete={handleDeleteAccount}
                account={selectedAccount}
            />
        </Layout>
    );
};

export default AccountList;
