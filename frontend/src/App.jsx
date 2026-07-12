// FinFlow Production Build Trigger 2
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  Plus, 
  Search, 
  Trash2, 
  Edit3, 
  Download, 
  LayoutDashboard, 
  Settings, 
  X, 
  Calendar, 
  DollarSign, 
  AlertCircle, 
  CheckCircle,
  Database,
  Tag,
  FileText
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';
import logoImg from './assets/logo.png';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const EXPENSE_CATEGORIES = ['Food', 'Rent', 'Utilities', 'Entertainment', 'Travel', 'Shopping', 'Medical', 'Education', 'Other'];
const INCOME_CATEGORIES = ['Salary', 'Freelance', 'Investment', 'Gift', 'Other'];

function App() {
  // Navigation
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Data State
  const [transactions, setTransactions] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);

  // Forms
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showResumeModal, setShowResumeModal] = useState(false);

  // Form inputs (Add/Edit)
  const [formTitle, setFormTitle] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formType, setFormType] = useState('expense');
  const [formCategory, setFormCategory] = useState(EXPENSE_CATEGORIES[0]);
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formDescription, setFormDescription] = useState('');

  // Form inputs (Budget)
  const [budgetCategory, setBudgetCategory] = useState(EXPENSE_CATEGORIES[0]);
  const [budgetLimit, setBudgetLimit] = useState('');

  // Filtering / Searching
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Notifications
  const [toasts, setToasts] = useState([]);

  // System DB Status
  const [dbStatus, setDbStatus] = useState({ connected: false, type: 'Checking...' });

  // Subscriptions State
  const [subscriptions, setSubscriptions] = useState([]);
  const [showSubModal, setShowSubModal] = useState(false);
  const [subTitle, setSubTitle] = useState('');
  const [subAmount, setSubAmount] = useState('');
  const [subCycle, setSubCycle] = useState('monthly');
  const [subCategory, setSubCategory] = useState('Entertainment');
  const [subDueDate, setSubDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [editingSub, setEditingSub] = useState(null);

  // Trigger toast notification
  const addToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  // Fetch all transactions
  const fetchTransactions = async () => {
    try {
      const res = await fetch(`${API_BASE}/expenses`);
      const data = await res.json();
      if (data.success) {
        setTransactions(data.data);
      } else {
        addToast('Failed to fetch transactions', 'error');
      }
    } catch (err) {
      console.error(err);
      addToast('Cannot connect to server', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Fetch budgets
  const [fetchBudgets, setFetchBudgets] = useState(() => async () => {
    try {
      const res = await fetch(`${API_BASE}/budgets`);
      const data = await res.json();
      if (data.success) {
        setBudgets(data.data);
      }
    } catch (err) {
      console.error(err);
    }
  });

  // Fetch DB Connection Status
  const fetchDbStatus = async () => {
    try {
      const res = await fetch(`${API_BASE}/status`);
      const data = await res.json();
      if (data.success) {
        setDbStatus({ connected: data.dbConnected, type: data.dbType });
      }
    } catch (err) {
      setDbStatus({ connected: false, type: 'Offline Mode' });
    }
  };

  // Fetch subscriptions
  const fetchSubscriptions = async () => {
    try {
      const res = await fetch(`${API_BASE}/subscriptions`);
      const data = await res.json();
      if (data.success) {
        setSubscriptions(data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchTransactions();
    // Call the unwrapped fetchBudgets
    const getBudgets = async () => {
      try {
        const res = await fetch(`${API_BASE}/budgets`);
        const data = await res.json();
        if (data.success) setBudgets(data.data);
      } catch (err) {
        console.error(err);
      }
    };
    getBudgets();
    fetchSubscriptions();
    fetchDbStatus();
  }, []);

  // Sync category select on type change
  useEffect(() => {
    if (formType === 'expense') {
      setFormCategory(EXPENSE_CATEGORIES[0]);
    } else {
      setFormCategory(INCOME_CATEGORIES[0]);
    }
  }, [formType]);

  // Open modal for editing
  const handleOpenEdit = (t) => {
    setEditingTransaction(t);
    setFormTitle(t.title);
    setFormAmount(t.amount);
    setFormType(t.type);
    setFormCategory(t.category);
    setFormDate(new Date(t.date).toISOString().split('T')[0]);
    setFormDescription(t.description || '');
    setShowAddModal(true);
  };

  // Open modal for adding
  const handleOpenAdd = () => {
    setEditingTransaction(null);
    setFormTitle('');
    setFormAmount('');
    setFormType('expense');
    setFormCategory(EXPENSE_CATEGORIES[0]);
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormDescription('');
    setShowAddModal(true);
  };

  // Submit add/edit form
  const handleSubmitTransaction = async (e) => {
    e.preventDefault();
    if (!formTitle || !formAmount || !formCategory || !formDate) {
      addToast('Please fill out all required fields', 'error');
      return;
    }

    const payload = {
      title: formTitle,
      amount: parseFloat(formAmount),
      type: formType,
      category: formCategory,
      date: formDate,
      description: formDescription
    };

    try {
      let url = `${API_BASE}/expenses`;
      let method = 'POST';

      if (editingTransaction) {
        url = `${API_BASE}/expenses/${editingTransaction._id}`;
        method = 'PUT';
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (data.success) {
        addToast(
          editingTransaction 
            ? 'Transaction updated successfully' 
            : 'Transaction added successfully', 
          'success'
        );
        setShowAddModal(false);
        fetchTransactions();
      } else {
        addToast(data.message || 'Operation failed', 'error');
      }
    } catch (err) {
      console.error(err);
      addToast('Network error, try again', 'error');
    }
  };

  // Delete transaction
  const handleDeleteTransaction = async (id) => {
    if (!window.confirm('Are you sure you want to delete this transaction?')) return;
    try {
      const res = await fetch(`${API_BASE}/expenses/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        addToast('Transaction deleted successfully', 'success');
        fetchTransactions();
      } else {
        addToast(data.message || 'Failed to delete transaction', 'error');
      }
    } catch (err) {
      console.error(err);
      addToast('Network error, try again', 'error');
    }
  };

  // Submit budget
  const handleSubmitBudget = async (e) => {
    e.preventDefault();
    if (!budgetLimit || parseFloat(budgetLimit) < 0) {
      addToast('Please enter a valid budget limit', 'error');
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/budgets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: budgetCategory,
          limit: parseFloat(budgetLimit)
        })
      });
      const data = await res.json();
      if (data.success) {
        addToast(`Budget set for ${budgetCategory}`, 'success');
        setBudgetLimit('');
        setShowBudgetModal(false);
        fetchBudgets();
      } else {
        addToast(data.message || 'Failed to set budget', 'error');
      }
    } catch (err) {
      console.error(err);
      addToast('Network error, try again', 'error');
    }
  };

  // Clear/delete budget
  const handleDeleteBudget = async (id, category) => {
    try {
      const res = await fetch(`${API_BASE}/budgets/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        addToast(`Budget removed for ${category}`, 'success');
        fetchBudgets();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Submit add/edit subscription
  const handleSubmitSubscription = async (e) => {
    e.preventDefault();
    if (!subTitle || !subAmount || !subCycle || !subCategory || !subDueDate) {
      addToast('Please fill out all required fields', 'error');
      return;
    }

    const payload = {
      title: subTitle,
      amount: parseFloat(subAmount),
      billingCycle: subCycle,
      category: subCategory,
      nextDueDate: subDueDate,
      status: editingSub ? editingSub.status : 'active'
    };

    try {
      let url = `${API_BASE}/subscriptions`;
      let method = 'POST';

      if (editingSub) {
        url = `${API_BASE}/subscriptions/${editingSub._id}`;
        method = 'PUT';
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (data.success) {
        addToast(
          editingSub 
            ? 'Subscription updated successfully' 
            : 'Subscription added successfully', 
          'success'
        );
        setShowSubModal(false);
        fetchSubscriptions();
      } else {
        addToast(data.message || 'Operation failed', 'error');
      }
    } catch (err) {
      console.error(err);
      addToast('Network error, try again', 'error');
    }
  };

  // Delete subscription
  const handleDeleteSubscription = async (id) => {
    if (!window.confirm('Are you sure you want to delete this subscription?')) return;
    try {
      const res = await fetch(`${API_BASE}/subscriptions/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        addToast('Subscription deleted', 'success');
        fetchSubscriptions();
      } else {
        addToast(data.message || 'Failed to delete', 'error');
      }
    } catch (err) {
      console.error(err);
      addToast('Network error, try again', 'error');
    }
  };

  // Toggle status (active/paused)
  const handleToggleSubscriptionStatus = async (sub) => {
    const newStatus = sub.status === 'active' ? 'paused' : 'active';
    try {
      const res = await fetch(`${API_BASE}/subscriptions/${sub._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (data.success) {
        addToast(`Subscription ${newStatus === 'active' ? 'activated' : 'paused'}`, 'success');
        fetchSubscriptions();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Open modal for adding sub
  const handleOpenAddSub = () => {
    setEditingSub(null);
    setSubTitle('');
    setSubAmount('');
    setSubCycle('monthly');
    setSubCategory('Entertainment');
    setSubDueDate(new Date().toISOString().split('T')[0]);
    setShowSubModal(true);
  };

  // Open modal for editing sub
  const handleOpenEditSub = (sub) => {
    setEditingSub(sub);
    setSubTitle(sub.title);
    setSubAmount(sub.amount);
    setSubCycle(sub.billingCycle);
    setSubCategory(sub.category);
    setSubDueDate(new Date(sub.nextDueDate).toISOString().split('T')[0]);
    setShowSubModal(true);
  };

  // Add Sample Data (Resume wow factor)
  const handleAddSampleData = async () => {
    setLoading(true);
    const sampleTransactions = [
      { title: 'Monthly Salary', amount: 85000, type: 'income', category: 'Salary', date: '2026-07-01', description: 'Main job payroll' },
      { title: 'Apartment Rent', amount: 15000, type: 'expense', category: 'Rent', date: '2026-07-02', description: 'July rent payment' },
      { title: 'Gourmet Dinner', amount: 1200, type: 'expense', category: 'Food', date: '2026-07-04', description: 'Dinner with friends' },
      { title: 'Freelance Web Design', amount: 20000, type: 'income', category: 'Freelance', date: '2026-07-05', description: 'Portfolio landing page UI' },
      { title: 'Electricity & Internet', amount: 2400, type: 'expense', category: 'Utilities', date: '2026-07-06', description: 'Broadband + power' },
      { title: 'Petrol refuel', amount: 1800, type: 'expense', category: 'Travel', date: '2026-07-07', description: 'Car tank full' },
      { title: 'Movie Night & Snacks', amount: 950, type: 'expense', category: 'Entertainment', date: '2026-07-08', description: 'Watched sci-fi flick' },
      { title: 'Sneakers Purchase', amount: 4500, type: 'expense', category: 'Shopping', date: '2026-07-09', description: 'New running shoes' }
    ];

    const sampleBudgets = [
      { category: 'Food', limit: 8000 },
      { category: 'Utilities', limit: 5000 },
      { category: 'Entertainment', limit: 4000 },
      { category: 'Travel', limit: 6000 }
    ];

    const sampleSubs = [
      { title: 'Spotify Premium', amount: 119, billingCycle: 'monthly', category: 'Entertainment', nextDueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], status: 'active' },
      { title: 'Netflix Premium', amount: 649, billingCycle: 'monthly', category: 'Entertainment', nextDueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], status: 'active' },
      { title: 'Gym Membership', amount: 1500, billingCycle: 'monthly', category: 'Other', nextDueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], status: 'active' },
      { title: 'AWS Cloud Hosting', amount: 450, billingCycle: 'monthly', category: 'Utilities', nextDueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], status: 'active' }
    ];

    try {
      // Add transactions
      for (let t of sampleTransactions) {
        await fetch(`${API_BASE}/expenses`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(t)
        });
      }

      // Add budgets
      for (let b of sampleBudgets) {
        await fetch(`${API_BASE}/budgets`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(b)
        });
      }

      // Add subscriptions
      for (let s of sampleSubs) {
        await fetch(`${API_BASE}/subscriptions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(s)
        });
      }

      addToast('Loaded mock transaction database!', 'success');
      fetchTransactions();
      fetchBudgets();
      fetchSubscriptions();
    } catch (err) {
      console.error(err);
      addToast('Error inserting sample data', 'error');
    }
  };

  // CSV Export utility
  const exportCSV = () => {
    if (filteredTransactions.length === 0) {
      addToast('No data to export', 'error');
      return;
    }

    const headers = ['Date', 'Title', 'Type', 'Category', 'Amount', 'Description'];
    const rows = filteredTransactions.map(t => [
      new Date(t.date).toLocaleDateString(),
      `"${t.title.replace(/"/g, '""')}"`,
      t.type,
      t.category,
      t.amount,
      `"${(t.description || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `FinFlow_Transactions_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('Downloaded transactions CSV', 'success');
  };

  // Export database as JSON backup
  const exportJSON = () => {
    const dataStr = JSON.stringify({ transactions, budgets }, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `FinFlow_Backup_${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    addToast('Downloaded database JSON backup', 'success');
    setShowProfileMenu(false);
  };

  // Reset database (wipes all records)
  const handleResetDatabase = async () => {
    if (!window.confirm('WARNING: This will delete all transactions and budgets permanently! Are you sure?')) return;
    try {
      const res = await fetch(`${API_BASE}/reset`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        addToast('Database wiped successfully', 'success');
        fetchTransactions();
        fetchBudgets();
        fetchSubscriptions();
        setShowProfileMenu(false);
      } else {
        addToast('Failed to wipe database', 'error');
      }
    } catch (err) {
      console.error(err);
      addToast('Network error, try again', 'error');
    }
  };

  // Computations
  const computedStats = useMemo(() => {
    let income = 0;
    let expenses = 0;
    transactions.forEach((t) => {
      if (t.type === 'income') {
        income += t.amount;
      } else {
        expenses += t.amount;
      }
    });
    return {
      income,
      expenses,
      balance: income - expenses
    };
  }, [transactions]);

  // Filters logic
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            (t.description && t.description.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesType = filterType === 'all' || t.type === filterType;
      const matchesCategory = filterCategory === 'all' || t.category === filterCategory;
      
      let matchesDate = true;
      if (startDate) {
        matchesDate = matchesDate && new Date(t.date) >= new Date(startDate);
      }
      if (endDate) {
        // Include full day
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        matchesDate = matchesDate && new Date(t.date) <= end;
      }

      return matchesSearch && matchesType && matchesCategory && matchesDate;
    });
  }, [transactions, searchQuery, filterType, filterCategory, startDate, endDate]);

  // Chart Data: Category Breakdown
  const categoryChartData = useMemo(() => {
    const categoriesMap = {};
    transactions.forEach((t) => {
      if (t.type === 'expense') {
        categoriesMap[t.category] = (categoriesMap[t.category] || 0) + t.amount;
      }
    });

    const labels = Object.keys(categoriesMap);
    const data = Object.values(categoriesMap);

    return {
      labels,
      datasets: [
        {
          label: 'Expenses by Category',
          data,
          backgroundColor: [
            '#6366f1', // Indigo
            '#10b981', // Emerald
            '#f43f5e', // Rose
            '#f59e0b', // Amber
            '#06b6d4', // Cyan
            '#8b5cf6', // Violet
            '#ec4899', // Pink
            '#3b82f6', // Blue
            '#94a3b8'  // Slate
          ],
          borderWidth: 1,
          borderColor: 'rgba(255, 255, 255, 0.08)'
        }
      ]
    };
  }, [transactions]);

  // Chart Data: Timeline
  const timelineChartData = useMemo(() => {
    // Sort transactions by date ascending for timeline charting
    const sorted = [...transactions].sort((a, b) => new Date(a.date) - new Date(b.date));
    
    // Group totals by date
    const datesMap = {};
    sorted.forEach((t) => {
      const d = new Date(t.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      if (!datesMap[d]) {
        datesMap[d] = { income: 0, expense: 0 };
      }
      if (t.type === 'income') {
        datesMap[d].income += t.amount;
      } else {
        datesMap[d].expense += t.amount;
      }
    });

    const labels = Object.keys(datesMap).slice(-8); // Show last 8 active days
    const incomeData = labels.map(l => datesMap[l].income);
    const expenseData = labels.map(l => datesMap[l].expense);

    return {
      labels,
      datasets: [
        {
          label: 'Income',
          data: incomeData,
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          tension: 0.3,
          fill: true
        },
        {
          label: 'Expenses',
          data: expenseData,
          borderColor: '#f43f5e',
          backgroundColor: 'rgba(244, 63, 94, 0.1)',
          tension: 0.3,
          fill: true
        }
      ]
    };
  }, [transactions]);

  // Calculate actual category expenses for budgets
  const categoryExpenses = useMemo(() => {
    const totals = {};
    transactions.forEach((t) => {
      if (t.type === 'expense') {
        totals[t.category] = (totals[t.category] || 0) + t.amount;
      }
    });
    return totals;
  }, [transactions]);

  return (
    <div className="app-container">
      {/* Toast Notifications */}
      <div className="toast-container">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast ${toast.type}`}>
            {toast.type === 'success' ? (
              <CheckCircle size={18} style={{ color: 'var(--success)' }} />
            ) : (
              <AlertCircle size={18} style={{ color: 'var(--danger)' }} />
            )}
            <span>{toast.message}</span>
          </div>
        ))}
      </div>

      {/* Sidebar navigation */}
      <aside className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div className="brand">
          <img src={logoImg} alt="FinFlow Logo" style={{ width: '28px', height: '28px', borderRadius: '6px', objectFit: 'cover' }} />
          <span className="brand-name">FinFlow</span>
        </div>

        <ul className="nav-menu">
          <li 
            className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => { setActiveTab('dashboard'); setIsSidebarOpen(false); }}
          >
            <LayoutDashboard size={18} />
            Dashboard
          </li>
          <li 
            className={`nav-item ${activeTab === 'transactions' ? 'active' : ''}`}
            onClick={() => { setActiveTab('transactions'); setIsSidebarOpen(false); }}
          >
            <FileText size={18} />
            Transactions
          </li>
          <li 
            className={`nav-item ${activeTab === 'budgets' ? 'active' : ''}`}
            onClick={() => { setActiveTab('budgets'); setIsSidebarOpen(false); }}
          >
            <Settings size={18} />
            Category Budgets
          </li>
          <li 
            className={`nav-item ${activeTab === 'subscriptions' ? 'active' : ''}`}
            onClick={() => { setActiveTab('subscriptions'); setIsSidebarOpen(false); }}
          >
            <Calendar size={18} />
            Subscriptions
          </li>
        </ul>

        <div className="sidebar-footer">
          <p> FinFlow </p>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            gap: '6px', 
            fontSize: '0.72rem', 
            color: 'var(--text-secondary)',
            marginTop: '8px'
          }}>
            <span style={{ 
              width: '7px', 
              height: '7px', 
              borderRadius: '50%', 
              background: dbStatus.connected ? 'var(--success)' : '#f59e0b',
              boxShadow: dbStatus.connected ? '0 0 8px var(--success)' : '0 0 8px #f59e0b',
              display: 'inline-block'
            }}></span>
            {dbStatus.type}
          </div>
        </div>
      </aside>

      {/* Main content body */}
      <main className="main-content">
        <header className="top-header">
          <div className="header-title">
            <h1>
              {activeTab === 'dashboard' && 'Financial Dashboard'}
              {activeTab === 'transactions' && 'Transaction Log'}
              {activeTab === 'budgets' && 'Budgets & Limits'}
              {activeTab === 'subscriptions' && 'Auto-Debit Subscriptions'}
            </h1>
            <p>
              {activeTab === 'dashboard' && 'Real-time overview of your income, expenses, and category budgets'}
              {activeTab === 'transactions' && 'View, search, edit, and export your transaction history'}
              {activeTab === 'budgets' && 'Define limits per expense category to monitor and curb spending'}
              {activeTab === 'subscriptions' && 'Monitor and manage monthly auto-debit payments and upcoming bills'}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            {transactions.length === 0 && (
              <button className="btn btn-outline" onClick={handleAddSampleData} style={{ gap: '6px' }}>
                <Database size={16} />
                Load Demo Data
              </button>
            )}
            <div className="profile-container" style={{ position: 'relative' }}>
              <div 
                className="user-profile" 
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                style={{ cursor: 'pointer', userSelect: 'none' }}
              >
                <div className="avatar">HJ</div>
                <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Harshil</span>
              </div>
              {showProfileMenu && (
                <div className="profile-dropdown glass-card">
                  <div className="dropdown-profile-header">
                    <div className="avatar large">HJ</div>
                    <div>
                      <div className="profile-name">Harshil Jain</div>
                      <div className="profile-title">Full-Stack Candidate</div>
                    </div>
                  </div>
                  <div className="dropdown-divider"></div>
                  <ul className="dropdown-menu-list">
                    <li onClick={() => { setShowResumeModal(true); setShowProfileMenu(false); }}>
                      🎓 View Placement Card
                    </li>
                    <li onClick={exportJSON}>
                      💾 Export JSON Backup
                    </li>
                    <li onClick={handleResetDatabase} className="danger-action">
                      ⚠️ Wipe Database
                    </li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        </header>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' }}>
              <div style={{ width: '40px', height: '40px', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
              <p style={{ color: 'var(--text-secondary)' }}>Loading financial metrics...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Dashboard Tab */}
            {activeTab === 'dashboard' && (
              <div className="fade-in">
                {/* Stats Widgets */}
                <div className="stats-grid">
                  <div className="glass-card stat-card balance">
                    <div className="stat-info">
                      <h3>Net Balance</h3>
                      <div className="stat-value">₹{computedStats.balance.toLocaleString()}</div>
                    </div>
                    <div className="stat-icon">
                      <Wallet size={24} />
                    </div>
                  </div>
                  <div className="glass-card stat-card income">
                    <div className="stat-info">
                      <h3>Total Income</h3>
                      <div className="stat-value" style={{ color: 'var(--success)' }}>₹{computedStats.income.toLocaleString()}</div>
                    </div>
                    <div className="stat-icon">
                      <TrendingUp size={24} />
                    </div>
                  </div>
                  <div className="glass-card stat-card expenses">
                    <div className="stat-info">
                      <h3>Total Expenses</h3>
                      <div className="stat-value" style={{ color: 'var(--danger)' }}>₹{computedStats.expenses.toLocaleString()}</div>
                    </div>
                    <div className="stat-icon">
                      <TrendingDown size={24} />
                    </div>
                  </div>
                </div>

                {/* Charts Area */}
                <div className="charts-grid">
                  <div className="glass-card">
                    <div className="chart-header">
                      <h2>Income vs Expense Trend</h2>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Daily aggregation</span>
                    </div>
                    <div style={{ height: '240px', position: 'relative' }}>
                      {transactions.length > 0 ? (
                        <Line 
                          data={timelineChartData} 
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: { legend: { display: false } },
                            scales: {
                              x: { grid: { color: 'rgba(255,255,255,0.03)' }, ticks: { color: '#94a3b8' } },
                              y: { grid: { color: 'rgba(255,255,255,0.03)' }, ticks: { color: '#94a3b8' } }
                            }
                          }}
                        />
                      ) : (
                        <div className="empty-state">
                          <p>Add transactions to populate trend charts</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="glass-card">
                    <div className="chart-header">
                      <h2>Category Distribution</h2>
                    </div>
                    <div style={{ height: '240px', position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                      {Object.keys(categoryExpenses).length > 0 ? (
                        <Doughnut 
                          data={categoryChartData} 
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: { legend: { display: false } }
                          }}
                        />
                      ) : (
                        <div className="empty-state">
                          <p>No expense data breakdown</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Dashboard Split: Recent Transactions + Budgets progress */}
                <div className="charts-grid">
                  <div className="glass-card">
                    <div className="chart-header">
                      <h2>Recent Transactions</h2>
                      <button className="btn btn-outline" onClick={handleOpenAdd} style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
                        <Plus size={14} /> Add New
                      </button>
                    </div>
                    <div className="recent-transactions-container">
                      {transactions.length === 0 ? (
                        <div className="empty-state">
                          <h3>No transactions yet</h3>
                          <p style={{ fontSize: '0.85rem', marginTop: '4px' }}>Get started by adding some income or expenses.</p>
                        </div>
                      ) : (
                        <div className="table-wrapper">
                          <table className="transaction-table">
                            <thead>
                              <tr>
                                <th>Transaction</th>
                                <th>Category</th>
                                <th>Amount</th>
                                <th>Type</th>
                              </tr>
                            </thead>
                            <tbody>
                              {transactions.slice(0, 5).map((t) => (
                                <tr key={t._id}>
                                  <td>
                                    <div style={{ fontWeight: 600 }}>{t.title}</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                      {new Date(t.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </div>
                                  </td>
                                  <td>
                                    <span className="category-tag">{t.category}</span>
                                  </td>
                                  <td style={{ fontWeight: 700 }}>
                                    ₹{t.amount.toLocaleString()}
                                  </td>
                                  <td>
                                    <span className={`badge ${t.type === 'income' ? 'badge-income' : 'badge-expense'}`}>
                                      {t.type}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="glass-card">
                    <div className="chart-header">
                      <h2>Budget Compliance</h2>
                      <button className="btn btn-outline" onClick={() => setShowBudgetModal(true)} style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
                        Set Limit
                      </button>
                    </div>
                    
                    <div className="budget-list">
                      {budgets.length === 0 ? (
                        <div className="empty-state" style={{ padding: '1.5rem' }}>
                          <p style={{ fontSize: '0.85rem' }}>No budget limits configured.</p>
                        </div>
                      ) : (
                        budgets.map((b) => {
                          const spent = categoryExpenses[b.category] || 0;
                          const percentage = Math.min((spent / b.limit) * 100, 100);
                          
                          let progressClass = 'progress-safe';
                          if (percentage >= 100) progressClass = 'progress-danger';
                          else if (percentage >= 85) progressClass = 'progress-warning';

                          return (
                            <div key={b._id} className="budget-item">
                              <div className="budget-info">
                                <span className="budget-category">{b.category}</span>
                                <span className="budget-values">
                                  ₹{spent.toLocaleString()} / <span style={{ color: 'var(--primary)' }}>₹{b.limit.toLocaleString()}</span>
                                </span>
                              </div>
                              <div className="progress-bar-container">
                                <div 
                                  className={`progress-bar-fill ${progressClass}`} 
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Transactions Log Tab */}
            {activeTab === 'transactions' && (
              <div className="glass-card fade-in">
                <div className="filters-bar">
                  <div className="search-wrapper">
                    <Search size={16} className="search-icon" />
                    <input 
                      type="text" 
                      placeholder="Search description..." 
                      className="glass-input search-input"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>

                  <div className="filter-actions">
                    <select 
                      className="glass-input" 
                      value={filterType} 
                      onChange={(e) => setFilterType(e.target.value)}
                    >
                      <option value="all">All Types</option>
                      <option value="income">Income Only</option>
                      <option value="expense">Expense Only</option>
                    </select>

                    <select 
                      className="glass-input" 
                      value={filterCategory} 
                      onChange={(e) => setFilterCategory(e.target.value)}
                    >
                      <option value="all">All Categories</option>
                      {[...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES].map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>

                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <input 
                        type="date" 
                        className="glass-input" 
                        style={{ padding: '0.55rem' }}
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                      />
                      <span style={{ color: 'var(--text-muted)' }}>to</span>
                      <input 
                        type="date" 
                        className="glass-input" 
                        style={{ padding: '0.55rem' }}
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                      />
                    </div>

                    <button className="btn btn-outline" onClick={exportCSV} title="Export current view to CSV">
                      <Download size={16} /> Export
                    </button>
                    
                    <button className="btn btn-primary" onClick={handleOpenAdd}>
                      <Plus size={16} /> New Transaction
                    </button>
                  </div>
                </div>

                {filteredTransactions.length === 0 ? (
                  <div className="empty-state">
                    <h3>No matching transactions found</h3>
                    <p style={{ fontSize: '0.85rem', marginTop: '4px' }}>Try relaxing your search terms or filter constraints.</p>
                  </div>
                ) : (
                  <div className="table-wrapper">
                    <table className="transaction-table">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Transaction Title</th>
                          <th>Category</th>
                          <th>Amount</th>
                          <th>Type</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredTransactions.map((t) => (
                          <tr key={t._id}>
                            <td>{new Date(t.date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</td>
                            <td>
                              <div style={{ fontWeight: 600 }}>{t.title}</div>
                              {t.description && <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{t.description}</div>}
                            </td>
                            <td>
                              <span className="category-tag">{t.category}</span>
                            </td>
                            <td style={{ fontWeight: 700 }}>₹{t.amount.toLocaleString()}</td>
                            <td>
                              <span className={`badge ${t.type === 'income' ? 'badge-income' : 'badge-expense'}`}>
                                {t.type}
                              </span>
                            </td>
                            <td>
                              <div className="action-buttons">
                                <button className="action-btn edit" onClick={() => handleOpenEdit(t)}>
                                  <Edit3 size={16} />
                                </button>
                                <button className="action-btn delete" onClick={() => handleDeleteTransaction(t._id)}>
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Budgets setup tab */}
            {activeTab === 'budgets' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 2fr', gap: '2rem' }} className="fade-in">
                {/* Left pane: set budget */}
                <div className="glass-card" style={{ height: 'fit-content' }}>
                  <h2 style={{ fontSize: '1.2rem', marginBottom: '1.5rem', fontWeight: 600 }}>Define Budget Limit</h2>
                  <form onSubmit={handleSubmitBudget}>
                    <div className="form-group">
                      <label>Expense Category</label>
                      <select 
                        className="glass-input" 
                        value={budgetCategory}
                        onChange={(e) => setBudgetCategory(e.target.value)}
                      >
                        {EXPENSE_CATEGORIES.map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Monthly Limit (₹)</label>
                      <input 
                        type="number" 
                        className="glass-input" 
                        placeholder="e.g. 5000" 
                        required 
                        value={budgetLimit}
                        onChange={(e) => setBudgetLimit(e.target.value)}
                      />
                    </div>

                    <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
                      Save Budget Limit
                    </button>
                  </form>
                </div>

                {/* Right pane: budgets lists with deletes */}
                <div className="glass-card">
                  <h2 style={{ fontSize: '1.2rem', marginBottom: '1.5rem', fontWeight: 600 }}>Active Budgets</h2>
                  {budgets.length === 0 ? (
                    <div className="empty-state">
                      <p>No budgets created. Set a budget limit on the left to start track limits.</p>
                    </div>
                  ) : (
                    <div className="table-wrapper">
                      <table className="transaction-table">
                        <thead>
                          <tr>
                            <th>Category</th>
                            <th>Budget Limit</th>
                            <th>Actual Spend</th>
                            <th>Status</th>
                            <th>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {budgets.map((b) => {
                            const spent = categoryExpenses[b.category] || 0;
                            const percentage = Math.min((spent / b.limit) * 100, 100);
                            
                            let statusText = 'On Track';
                            let statusBadge = 'badge-income';
                            
                            if (spent > b.limit) {
                              statusText = 'Exceeded';
                              statusBadge = 'badge-badge-expense'; // Wait, let's keep badge-expense
                              statusBadge = 'badge-expense';
                            } else if (spent >= b.limit * 0.85) {
                              statusText = 'Approaching';
                              statusBadge = 'badge-expense';
                            }

                            return (
                              <tr key={b._id}>
                                <td style={{ fontWeight: 600 }}>{b.category}</td>
                                <td>₹{b.limit.toLocaleString()}</td>
                                <td>₹{spent.toLocaleString()}</td>
                                <td>
                                  <span className={`badge ${statusBadge}`}>
                                    {statusText} ({Math.round(percentage)}%)
                                  </span>
                                </td>
                                <td>
                                  <button className="action-btn delete" onClick={() => handleDeleteBudget(b._id, b.category)}>
                                    <Trash2 size={16} />
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Subscriptions Tab */}
            {activeTab === 'subscriptions' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 2fr', gap: '2rem' }} className="fade-in">
                {/* Left pane: summary card & timeline alert */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <div className="glass-card">
                    <h3 style={{ fontSize: '1rem', color: 'var(--text-secondary)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Monthly Auto-Debits
                    </h3>
                    <div style={{ fontSize: '2.2rem', fontWeight: 700, marginTop: '0.5rem', color: 'var(--primary)' }}>
                      ₹{subscriptions
                        .filter(s => s.status === 'active')
                        .reduce((acc, curr) => acc + (curr.billingCycle === 'yearly' ? curr.amount / 12 : curr.amount), 0)
                        .toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 500 }}> / month</span>
                    </div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                      Sum of all active subscriptions (yearly bills are divided by 12).
                    </p>
                    <button className="btn btn-primary" onClick={handleOpenAddSub} style={{ width: '100%', marginTop: '1.25rem' }}>
                      <Plus size={16} /> Add Subscription
                    </button>
                  </div>

                  {/* Upcoming Bill Alert Timeline */}
                  <div className="glass-card">
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem' }}>Auto-Debit Timeline</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '230px', overflowY: 'auto', paddingRight: '4px' }}>
                      {subscriptions.filter(s => s.status === 'active').length === 0 ? (
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>No active auto-debits scheduled.</p>
                      ) : (
                        [...subscriptions]
                          .filter(s => s.status === 'active')
                          .sort((a, b) => new Date(a.nextDueDate) - new Date(b.nextDueDate))
                          .map(s => {
                            const daysLeft = Math.ceil((new Date(s.nextDueDate) - new Date()) / (1000 * 60 * 60 * 24));
                            let alertColor = 'var(--text-secondary)';
                            if (daysLeft <= 3) {
                              alertColor = 'var(--danger)';
                            } else if (daysLeft <= 7) {
                              alertColor = '#f59e0b';
                            }

                            return (
                              <div key={s._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--card-border)' }}>
                                <div>
                                  <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{s.title}</div>
                                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Due: {new Date(s.nextDueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                  <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>₹{s.amount}</div>
                                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: alertColor }}>
                                    {daysLeft <= 0 ? 'Due Today' : `${daysLeft} days left`}
                                  </span>
                                </div>
                              </div>
                            );
                          })
                      )}
                    </div>
                  </div>
                </div>

                {/* Right pane: list of subscriptions */}
                <div className="glass-card">
                  <h2 style={{ fontSize: '1.2rem', marginBottom: '1.5rem', fontWeight: 600 }}>Active Subscriptions & Recurring Bills</h2>
                  {subscriptions.length === 0 ? (
                    <div className="empty-state">
                      <p>No recurring subscriptions found. Click "Load Demo Data" or add one to start tracking.</p>
                    </div>
                  ) : (
                    <div className="table-wrapper">
                      <table className="transaction-table">
                        <thead>
                          <tr>
                            <th>Subscription</th>
                            <th>Cost</th>
                            <th>Cycle</th>
                            <th>Status</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {subscriptions.map((s) => (
                            <tr key={s._id} style={{ opacity: s.status === 'paused' ? 0.6 : 1 }}>
                              <td>
                                <div style={{ fontWeight: 600 }}>{s.title}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Category: {s.category}</div>
                              </td>
                              <td style={{ fontWeight: 700 }}>₹{s.amount.toLocaleString()}</td>
                              <td style={{ textTransform: 'capitalize', fontSize: '0.85rem' }}>{s.billingCycle}</td>
                              <td>
                                <button 
                                  className={`badge ${s.status === 'active' ? 'badge-income' : 'badge-expense'}`}
                                  onClick={() => handleToggleSubscriptionStatus(s)}
                                  style={{ cursor: 'pointer', background: 'transparent' }}
                                  title="Click to toggle status"
                                >
                                  {s.status}
                                </button>
                              </td>
                              <td>
                                <div className="action-buttons">
                                  <button className="action-btn edit" onClick={() => handleOpenEditSub(s)}>
                                    <Edit3 size={16} />
                                  </button>
                                  <button className="action-btn delete" onClick={() => handleDeleteSubscription(s._id)}>
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* Transaction Modal Overlay */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="glass-card modal-content">
            <div className="modal-header">
              <h2>{editingTransaction ? 'Edit Transaction' : 'New Transaction'}</h2>
              <button className="action-btn" onClick={() => setShowAddModal(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmitTransaction}>
              <div className="form-group">
                <label>Title</label>
                <input 
                  type="text" 
                  className="glass-input" 
                  placeholder="e.g. Cinema tickets" 
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                />
              </div>

              <div className="input-row">
                <div className="form-group">
                  <label>Amount (₹)</label>
                  <input 
                    type="number" 
                    className="glass-input" 
                    placeholder="e.g. 250" 
                    required
                    value={formAmount}
                    onChange={(e) => setFormAmount(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>Type</label>
                  <select 
                    className="glass-input" 
                    value={formType}
                    onChange={(e) => setFormType(e.target.value)}
                  >
                    <option value="expense">Expense</option>
                    <option value="income">Income</option>
                  </select>
                </div>
              </div>

              <div className="input-row">
                <div className="form-group">
                  <label>Category</label>
                  <select 
                    className="glass-input" 
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                  >
                    {formType === 'expense' 
                      ? EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)
                      : INCOME_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)
                    }
                  </select>
                </div>

                <div className="form-group">
                  <label>Date</label>
                  <input 
                    type="date" 
                    className="glass-input" 
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Description (Optional)</label>
                <textarea 
                  className="glass-input" 
                  placeholder="Additional notes..." 
                  style={{ height: '70px', resize: 'none' }}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingTransaction ? 'Update' : 'Add Transaction'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Budget Modal Overlay (Quick setup from dashboard) */}
      {showBudgetModal && (
        <div className="modal-overlay">
          <div className="glass-card modal-content" style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h2>Define Limit</h2>
              <button className="action-btn" onClick={() => setShowBudgetModal(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmitBudget}>
              <div className="form-group">
                <label>Category</label>
                <select 
                  className="glass-input" 
                  value={budgetCategory}
                  onChange={(e) => setBudgetCategory(e.target.value)}
                >
                  {EXPENSE_CATEGORIES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Limit (₹)</label>
                <input 
                  type="number" 
                  className="glass-input" 
                  placeholder="e.g. 5000" 
                  required
                  value={budgetLimit}
                  onChange={(e) => setBudgetLimit(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowBudgetModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Set Budget
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Subscription Modal Overlay */}
      {showSubModal && (
        <div className="modal-overlay">
          <div className="glass-card modal-content">
            <div className="modal-header">
              <h2>{editingSub ? 'Edit Subscription' : 'New Subscription'}</h2>
              <button className="action-btn" onClick={() => setShowSubModal(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmitSubscription}>
              <div className="form-group">
                <label>Subscription Name</label>
                <input 
                  type="text" 
                  className="glass-input" 
                  placeholder="e.g. Spotify Premium" 
                  required
                  value={subTitle}
                  onChange={(e) => setSubTitle(e.target.value)}
                />
              </div>

              <div className="input-row">
                <div className="form-group">
                  <label>Amount (₹)</label>
                  <input 
                    type="number" 
                    className="glass-input" 
                    placeholder="e.g. 199" 
                    required
                    value={subAmount}
                    onChange={(e) => setSubAmount(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>Billing Cycle</label>
                  <select 
                    className="glass-input" 
                    value={subCycle}
                    onChange={(e) => setSubCycle(e.target.value)}
                  >
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
              </div>

              <div className="input-row">
                <div className="form-group">
                  <label>Category</label>
                  <select 
                    className="glass-input" 
                    value={subCategory}
                    onChange={(e) => setSubCategory(e.target.value)}
                  >
                    {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div className="form-group">
                  <label>Next Due Date</label>
                  <input 
                    type="date" 
                    className="glass-input" 
                    required
                    value={subDueDate}
                    onChange={(e) => setSubDueDate(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowSubModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingSub ? 'Update' : 'Add Subscription'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Resume Placement Card Modal */}
      {showResumeModal && (
        <div className="modal-overlay">
          <div className="glass-card modal-content" style={{ maxWidth: '450px' }}>
            <div className="modal-header">
              <h2>Candidate Placement Card</h2>
              <button className="action-btn" onClick={() => setShowResumeModal(false)}>
                <X size={20} />
              </button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', alignItems: 'center', textAlign: 'center', padding: '1rem 0' }}>
              <div style={{ 
                width: '80px', 
                height: '80px', 
                borderRadius: '50%', 
                background: 'linear-gradient(135deg, var(--primary) 0%, #8b5cf6 100%)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                fontSize: '2rem',
                fontWeight: 700,
                color: '#fff',
                boxShadow: '0 0 20px var(--primary-glow)'
              }}>
                HJ
              </div>
              
              <div>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Harshil Jain</h3>
                <p style={{ color: 'var(--primary)', fontWeight: 600, fontSize: '0.95rem', marginTop: '0.25rem' }}>
                  Full-Stack Software Developer
                </p>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                  Information Technology
                </p>
              </div>

              <div className="dropdown-divider" style={{ width: '100%' }}></div>

              <div style={{ width: '100%', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>📍 Education:</span>
                  <span style={{ fontWeight: 500 }}>B.Tech in IT</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>📧 Email:</span>
                  <span style={{ fontWeight: 500 }}>harshiljain2709@gmail.com</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>🔗 LinkedIn:</span>
                  <a href="https://linkedin.com/in/harshiljainn" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 600 }}>
                    linkedin.com/in/harshil-jain
                  </a>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>💻 GitHub:</span>
                  <a href="https://github.com/harshil2709" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 600 }}>
                    github.com/harshil-jain
                  </a>
                </div>
              </div>

              <div className="dropdown-divider" style={{ width: '100%' }}></div>
              
              <div style={{ width: '100%' }}>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                  "Highly passionate about building scalable, secure, and responsive full-stack applications. Open to Software Engineering internships and full-time placement opportunities."
                </p>
              </div>

              <button 
                className="btn btn-primary" 
                onClick={() => setShowResumeModal(false)}
                style={{ width: '100%', marginTop: '0.5rem' }}
              >
                Close Profile Card
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
