import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import ErrorBoundary from './components/ErrorBoundary';
import Dashboard from './pages/Dashboard';
import Invoices from './pages/Invoices';
import CreateInvoice from './pages/CreateInvoice';
import Products from './pages/Products';
import Customers from './pages/Customers';
import { DataProvider } from './context/DataContext';
import { Users } from 'lucide-react';

const PlaceholderPage = ({ title }) => (
  <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
    <h1 className="text-3xl font-bold text-slate-900">{title}</h1>
    <p className="text-slate-500 mt-1">This section is currently under development.</p>
    <div className="mt-8 glass p-20 rounded-2xl flex flex-col items-center justify-center text-slate-400 gap-4">
      <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
        <Users size={32} className="text-slate-300" />
      </div>
      <span>Content Coming Soon</span>
    </div>
  </div>
);

const App = () => {
  return (
    <ErrorBoundary>
      <DataProvider>
        <HashRouter>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Dashboard />} />
              <Route path="invoices" element={<Invoices />} />
              <Route path="invoices/new" element={<CreateInvoice />} />
              <Route path="customers" element={<Customers />} />
              <Route path="products" element={<Products />} />
            </Route>
          </Routes>
        </HashRouter>
      </DataProvider>
    </ErrorBoundary>
  );
};

export default App;
