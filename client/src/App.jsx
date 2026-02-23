import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/Auth/LoginPage';
import RegisterPage from './pages/Auth/RegisterPage';
import AccountList from './pages/AccountList/AccountList';
import GeneralJournalList from './pages/GeneralJournal/GeneralJournalList';
import AddGeneralJournal from './pages/GeneralJournal/AddGeneralJournal';
import EditGeneralJournal from './pages/GeneralJournal/EditGeneralJournal';
import CashBankReceipt from './pages/CashBank/CashBankReceipt';
import CashBankPayment from './pages/CashBank/CashBankPayment';
import Invoicing from './pages/Sales/Invoicing';
import SalesTaxInvoice from './pages/Sales/SalesTaxInvoice';
import SalesTaxInvoiceForm from './pages/Sales/SalesTaxInvoiceForm';
import SalesTaxInvoiceDetail from './pages/Sales/SalesTaxInvoiceDetail';
import PurchaseTaxInvoice from './pages/Purchase/PurchaseTaxInvoice';
import PurchaseTaxInvoiceForm from './pages/Purchase/PurchaseTaxInvoiceForm';
import PurchaseTaxInvoiceDetail from './pages/Purchase/PurchaseTaxInvoiceDetail';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  return children;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Protected Routes */}
      <Route path="/list-akun" element={<ProtectedRoute><AccountList /></ProtectedRoute>} />
      <Route path="/jurnal-umum" element={<ProtectedRoute><GeneralJournalList /></ProtectedRoute>} />
      <Route path="/jurnal-umum/baru" element={<ProtectedRoute><AddGeneralJournal /></ProtectedRoute>} />
      <Route path="/jurnal-umum/edit/:id" element={<ProtectedRoute><EditGeneralJournal /></ProtectedRoute>} />
      <Route path="/penerimaan" element={<ProtectedRoute><CashBankReceipt /></ProtectedRoute>} />
      <Route path="/pengeluaran" element={<ProtectedRoute><CashBankPayment /></ProtectedRoute>} />
      <Route path="/penagihan" element={<ProtectedRoute><Invoicing /></ProtectedRoute>} />
      <Route path="/faktur-pajak-penjualan" element={<ProtectedRoute><SalesTaxInvoice /></ProtectedRoute>} />
      <Route path="/faktur-pajak-penjualan/baru" element={<ProtectedRoute><SalesTaxInvoiceForm /></ProtectedRoute>} />
      <Route path="/faktur-pajak-penjualan/edit/:id" element={<ProtectedRoute><SalesTaxInvoiceForm /></ProtectedRoute>} />
      <Route path="/faktur-pajak-penjualan/detail/:id" element={<ProtectedRoute><SalesTaxInvoiceDetail /></ProtectedRoute>} />
      <Route path="/faktur-pajak-pembelian" element={<ProtectedRoute><PurchaseTaxInvoice /></ProtectedRoute>} />
      <Route path="/faktur-pajak-pembelian/baru" element={<ProtectedRoute><PurchaseTaxInvoiceForm /></ProtectedRoute>} />
      <Route path="/faktur-pajak-pembelian/edit/:id" element={<ProtectedRoute><PurchaseTaxInvoiceForm /></ProtectedRoute>} />
      <Route path="/faktur-pajak-pembelian/detail/:id" element={<ProtectedRoute><PurchaseTaxInvoiceDetail /></ProtectedRoute>} />

      {/* Catch all - redirect to list-akun (which will redirect to / if not auth) */}
      <Route path="*" element={<Navigate to="/list-akun" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}

export default App;
