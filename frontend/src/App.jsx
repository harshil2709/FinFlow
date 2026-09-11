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
  Info,
  Database,
  Tag,
  FileText,
  User,
  LogOut,
  Lock,
  Mail,
  ShieldCheck,
  Target,
  Sparkles,
  FileSpreadsheet,
  PlusCircle,
  Award,
  Zap,
  PiggyBank,
  Compass,
  Sliders
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

  // Savings Goals State
  const [goals, setGoals] = useState([]);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [goalTitle, setGoalTitle] = useState('');
  const [goalTarget, setGoalTarget] = useState('');
  const [goalCurrent, setGoalCurrent] = useState('');
  const [goalDate, setGoalDate] = useState(new Date().toISOString().split('T')[0]);
  const [goalCategory, setGoalCategory] = useState('Savings');
  const [depositAmount, setDepositAmount] = useState('');

  // FinFlow Horizon Forecaster State
  const [forecastMonthlyExtra, setForecastMonthlyExtra] = useState(5000);
  const [forecastReturnRate, setForecastReturnRate] = useState(8);
  const [forecastCutPercent, setForecastCutPercent] = useState(10);
  // Settings State
  const [currencySymbol, setCurrencySymbol] = useState(() => localStorage.getItem('finflow_currency') || '₹');
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [alertBudgetWarnings, setAlertBudgetWarnings] = useState(() => localStorage.getItem('finflow_alert_budget') !== 'false');
  const [alertSubReminders, setAlertSubReminders] = useState(() => localStorage.getItem('finflow_alert_sub') !== 'false');

  const handleSaveSettings = () => {
    localStorage.setItem('finflow_currency', currencySymbol);
    localStorage.setItem('finflow_alert_budget', alertBudgetWarnings);
    localStorage.setItem('finflow_alert_sub', alertSubReminders);
    addToast('Account settings updated!', 'success');
    setShowSettingsModal(false);
  };

  // Authentication State
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('finflow_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [authToken, setAuthToken] = useState(() => localStorage.getItem('finflow_token') || '');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register'
  const [authName, setAuthName] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  // Edit Profile State
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [editProfileName, setEditProfileName] = useState('');

  const handleSaveProfile = (e) => {
    e.preventDefault();
    if (!editProfileName.trim()) {
      addToast('Please enter a valid name', 'error');
      return;
    }
    const updatedUser = currentUser 
      ? { ...currentUser, name: editProfileName.trim() }
      : { id: 'local_user', name: editProfileName.trim(), email: 'harshiljain2709@gmail.com' };
    
    setCurrentUser(updatedUser);
    localStorage.setItem('finflow_user', JSON.stringify(updatedUser));
    addToast('Profile name updated successfully!', 'success');
    setShowEditProfileModal(false);
  };

  // Helper for Auth Headers
  const getAuthHeaders = () => {
    const headers = { 'Content-Type': 'application/json' };
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }
    return headers;
  };

  // Trigger toast notification
  const addToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  // Authentication Handlers
  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError('');
    try {
      const endpoint = authMode === 'register' ? '/auth/register' : '/auth/login';
      const body = authMode === 'register' 
        ? { name: authName, email: authEmail, password: authPassword }
        : { email: authEmail, password: authPassword };

      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();

      if (data.success) {
        setAuthToken(data.token);
        setCurrentUser(data.user);
        localStorage.setItem('finflow_token', data.token);
        localStorage.setItem('finflow_user', JSON.stringify(data.user));
        addToast(authMode === 'register' ? 'Account created! Welcome to FinFlow.' : 'Logged in successfully!', 'success');
        setShowAuthModal(false);
        setAuthPassword('');
        setAuthName('');
        setAuthEmail('');
        // Trigger data refetch for logged in user
        fetchTransactions();
        fetchSubscriptions();
        getBudgets();
      } else {
        setAuthError(data.error || 'Authentication failed. Please try again.');
      }
    } catch (err) {
      console.error(err);
      setAuthError('Connection error. Please check server connection.');
    } finally {
      setAuthLoading(false);
    }
  };

  const openAuthModal = (mode = 'login') => {
    setAuthMode(mode);
    setAuthName('');
    setAuthEmail('');
    setAuthPassword('');
    setAuthError('');
    setShowAuthModal(true);
  };

  const handleLogout = () => {
    setAuthToken('');
    setCurrentUser(null);
    localStorage.removeItem('finflow_token');
    localStorage.removeItem('finflow_user');
    addToast('Logged out successfully', 'info');
    setShowProfileMenu(false);
    setTransactions([]);
    setBudgets([]);
    setSubscriptions([]);
  };

  // Fetch all transactions
  const fetchTransactions = async () => {
    try {
      const res = await fetch(`${API_BASE}/expenses`, { headers: getAuthHeaders() });
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setTransactions(data.data);
      } else {
        setTransactions([]);
      }
    } catch (err) {
      console.error(err);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch Budgets
  const getBudgets = async () => {
    try {
      const res = await fetch(`${API_BASE}/budgets`, { headers: getAuthHeaders() });
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setBudgets(data.data);
      } else {
        setBudgets([]);
      }
    } catch (err) {
      console.error(err);
      setBudgets([]);
    }
  };

  // Fetch subscriptions
  const fetchSubscriptions = async () => {
    try {
      const res = await fetch(`${API_BASE}/subscriptions`, { headers: getAuthHeaders() });
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setSubscriptions(data.data);
      } else {
        setSubscriptions([]);
      }
    } catch (err) {
      console.error(err);
      setSubscriptions([]);
    }
  };

  // Fetch Savings Goals
  const fetchGoals = async () => {
    try {
      const res = await fetch(`${API_BASE}/goals`, { headers: getAuthHeaders() });
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setGoals(data.data);
      } else {
        setGoals([]);
      }
    } catch (err) {
      console.error(err);
      setGoals([]);
    }
  };

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

  // Submit Goal Handler
  const handleSubmitGoal = async (e) => {
    e.preventDefault();
    if (!goalTitle || !goalTarget || !goalDate) {
      addToast('Please fill in all required goal fields', 'error');
      return;
    }

    const payload = {
      title: goalTitle,
      targetAmount: parseFloat(goalTarget),
      currentAmount: goalCurrent ? parseFloat(goalCurrent) : 0,
      targetDate: goalDate,
      category: goalCategory || 'Savings'
    };

    try {
      const res = await fetch(`${API_BASE}/goals`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        addToast(`Savings goal "${goalTitle}" added!`, 'success');
        setShowGoalModal(false);
        setGoalTitle('');
        setGoalTarget('');
        setGoalCurrent('');
        setGoalCategory('Savings');
        fetchGoals();
      } else {
        addToast(data.message || 'Failed to add goal', 'error');
      }
    } catch (err) {
      console.error(err);
      addToast('Network error, try again', 'error');
    }
  };

  // Deposit towards Goal
  const handleDepositGoal = async (e) => {
    e.preventDefault();
    if (!selectedGoal || !depositAmount || parseFloat(depositAmount) <= 0) {
      addToast('Please enter a valid deposit amount', 'error');
      return;
    }

    const currentAmt = Number(selectedGoal?.currentAmount) || 0;
    const newAmount = currentAmt + parseFloat(depositAmount);
    try {
      const res = await fetch(`${API_BASE}/goals/${selectedGoal._id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ currentAmount: newAmount })
      });
      const data = await res.json();
      if (data.success) {
        addToast(`Deposited ${currencySymbol}${parseFloat(depositAmount).toLocaleString()} towards ${selectedGoal.title || 'goal'}!`, 'success');
        setShowDepositModal(false);
        setDepositAmount('');
        setSelectedGoal(null);
        fetchGoals();
      } else {
        addToast(data.message || 'Failed to process deposit', 'error');
      }
    } catch (err) {
      console.error(err);
      addToast('Network error processing deposit', 'error');
    }
  };

  // Delete Goal
  const handleDeleteGoal = async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete goal "${title}"?`)) return;
    try {
      const res = await fetch(`${API_BASE}/goals/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
      const data = await res.json();
      if (data.success) {
        addToast(`Goal "${title}" removed`, 'success');
        fetchGoals();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Export Transactions as CSV Statement
  const exportCSV = () => {
    if (filteredTransactions.length === 0) {
      addToast('No transaction data to export', 'error');
      return;
    }
    const headers = ['Date', 'Title', 'Type', 'Category', 'Amount (INR)', 'Description'];
    const rows = filteredTransactions.map((t) => [
      new Date(t.date).toISOString().split('T')[0],
      `"${t.title.replace(/"/g, '""')}"`,
      t.type,
      `"${t.category}"`,
      t.amount,
      `"${(t.description || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `FinFlow_Statement_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('Downloaded CSV Financial Statement', 'success');
  };

  useEffect(() => {
    fetchTransactions();
    getBudgets();
    fetchSubscriptions();
    fetchGoals();
    fetchDbStatus();
  }, [authToken]);

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
        headers: getAuthHeaders(),
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
      const res = await fetch(`${API_BASE}/expenses/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
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
        headers: getAuthHeaders(),
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
        getBudgets();
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
      const res = await fetch(`${API_BASE}/budgets/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
      const data = await res.json();
      if (data.success) {
        addToast(`Budget removed for ${category}`, 'success');
        getBudgets();
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
        headers: getAuthHeaders(),
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

    const sampleGoals = [
      { title: 'Emergency Fund', targetAmount: 50000, currentAmount: 15000, targetDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], category: 'Emergency' },
      { title: 'New Macbook Pro', targetAmount: 120000, currentAmount: 45000, targetDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], category: 'Gadgets' },
      { title: 'Goa Vacation', targetAmount: 25000, currentAmount: 18000, targetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], category: 'Travel' }
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

      // Add sample goals
      for (let g of sampleGoals) {
        await fetch(`${API_BASE}/goals`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(g)
        });
      }

      addToast('Loaded mock financial database!', 'success');
      fetchTransactions();
      fetchBudgets();
      fetchSubscriptions();
      fetchGoals();
    } catch (err) {
      console.error(err);
      addToast('Error inserting sample data', 'error');
    }
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

  // Calculate FinFlow Horizon Wealth Forecast
  const wealthForecast = useMemo(() => {
    const extraP = Number(forecastMonthlyExtra) || 0;
    const monthlyExpenses = computedStats.expenses || 0;
    const cutSavings = monthlyExpenses * ((Number(forecastCutPercent) || 0) / 100);
    const totalP = extraP + cutSavings;

    const ratePct = Number(forecastReturnRate) || 0;
    const r = (ratePct / 100) / 12;

    const calcFV = (months) => {
      if (totalP <= 0) return 0;
      if (r <= 0) return totalP * months;
      return totalP * ((Math.pow(1 + r, months) - 1) / r);
    };

    const fv1 = Math.round(calcFV(12));
    const fv3 = Math.round(calcFV(36));
    const fv5 = Math.round(calcFV(60));

    const totalInvested3 = totalP * 36;
    const interestGained3 = Math.max(0, fv3 - totalInvested3);

    return { fv1, fv3, fv5, totalP, cutSavings, interestGained3 };
  }, [forecastMonthlyExtra, forecastReturnRate, forecastCutPercent, computedStats.expenses]);

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
            '#e0a96d', // Luxe Rose Gold
            '#10b981', // Emerald Green
            '#f43f5e', // Rose Red
            '#fbbf24', // Amber Gold
            '#a855f7', // Amethyst Violet
            '#e11d48', // Crimson
            '#34d399', // Mint
            '#f472b6', // Pink
            '#71717a'  // Obsidian Slate
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

  // AI Smart Insights computation
  const aiInsights = useMemo(() => {
    let score = 85;
    const tips = [];
    const { income, expenses } = computedStats;

    if (transactions.length === 0) {
      return {
        score: 100,
        status: 'Optimal',
        tips: ['Add transactions or load demo data to view personalized AI financial recommendations.']
      };
    }

    if (expenses > income && income > 0) {
      score -= 25;
      tips.push('Deficit Warning: Monthly expenses currently exceed total income. Consider pausing non-essential recurring payments.');
    } else if (income > 0) {
      const savingsRate = Math.round(((income - expenses) / income) * 100);
      if (savingsRate >= 30) {
        score += 10;
        tips.push(`Strong Savings Velocity: You are saving ${savingsRate}% of total income this period!`);
      } else if (savingsRate < 10) {
        score -= 10;
        tips.push(`Savings Rate Notice: Your savings rate is ${savingsRate}%. Target 20%+ for long-term health.`);
      }
    }

    const catTotals = {};
    transactions.forEach(t => {
      if (t.type === 'expense') {
        catTotals[t.category] = (catTotals[t.category] || 0) + t.amount;
      }
    });

    const topCategory = Object.keys(catTotals).sort((a, b) => catTotals[b] - catTotals[a])[0];
    if (topCategory && expenses > 0) {
      const pct = Math.round((catTotals[topCategory] / expenses) * 100);
      tips.push(`Top Expense Area: ${topCategory} represents ${pct}% of total spending.`);
    }

    const activeSubCount = subscriptions.filter(s => s.status === 'active').length;
    if (activeSubCount > 0) {
      tips.push(`Recurring Liabilities: ${activeSubCount} active auto-debit payments are actively scheduled.`);
    }

    const clampedScore = Math.min(100, Math.max(40, score));
    let status = 'Excellent';
    if (clampedScore < 60) status = 'Needs Attention';
    else if (clampedScore < 80) status = 'Good';

    return {
      score: clampedScore,
      status,
      tips
    };
  }, [computedStats, transactions, subscriptions]);

  return (
    <div className="app-container">
      {/* Toast Notifications */}
      <div className="toast-container">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast ${toast.type}`}>
            {toast.type === 'success' && <CheckCircle size={18} style={{ color: 'var(--success)' }} />}
            {toast.type === 'info' && <Info size={18} style={{ color: 'var(--primary)' }} />}
            {toast.type === 'error' && <AlertCircle size={18} style={{ color: 'var(--danger)' }} />}
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
          <li 
            className={`nav-item ${activeTab === 'goals' ? 'active' : ''}`}
            onClick={() => { setActiveTab('goals'); setIsSidebarOpen(false); }}
          >
            <Target size={18} />
            Savings Goals
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
              {activeTab === 'goals' && 'Savings Goals & Target Milestones'}
              {activeTab === 'profile' && 'User Profile & Financial Portfolio'}
            </h1>
            <p>
              {activeTab === 'dashboard' && 'Real-time overview of your income, expenses, and category budgets'}
              {activeTab === 'transactions' && 'View, search, edit, and export your transaction history'}
              {activeTab === 'budgets' && 'Define limits per expense category to monitor and curb spending'}
              {activeTab === 'subscriptions' && 'Monitor and manage monthly auto-debit payments and upcoming bills'}
              {activeTab === 'goals' && 'Track progress towards your savings targets and milestone allocations'}
              {activeTab === 'profile' && 'View your personal profile, transaction analytics, and financial milestones'}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            {!currentUser && transactions.length === 0 && (
              <button className="btn btn-outline" onClick={handleAddSampleData} style={{ gap: '6px' }}>
                <Database size={16} />
                Load Demo Data
              </button>
            )}

            {currentUser ? (
              <div className="profile-container" style={{ position: 'relative' }}>
                <div 
                  className="user-profile" 
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  style={{ cursor: 'pointer', userSelect: 'none' }}
                >
                  <div className="avatar" style={{ background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' }}>
                    {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{currentUser.name || 'User'}</span>
                </div>
                {showProfileMenu && (
                  <div className="profile-dropdown glass-card">
                    <div className="dropdown-profile-header">
                      <div className="avatar large" style={{ background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' }}>
                        {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
                      </div>
                      <div>
                        <div className="profile-name">{currentUser.name}</div>
                        <div className="profile-title" style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{currentUser.email}</div>
                      </div>
                    </div>
                    <div className="dropdown-divider"></div>
                    <ul className="dropdown-menu-list">
                      <li onClick={() => { setActiveTab('profile'); setShowProfileMenu(false); }} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <User size={16} style={{ color: 'var(--primary)' }} /> My Profile
                      </li>
                      <li onClick={() => { setShowSettingsModal(true); setShowProfileMenu(false); }} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Settings size={16} style={{ color: 'var(--text-secondary)' }} /> Account Settings
                      </li>
                      <li onClick={() => { handleResetDatabase(); setShowProfileMenu(false); }} className="danger-action" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Trash2 size={16} style={{ color: 'var(--danger)' }} /> Delete Account
                      </li>
                      <li onClick={() => { handleLogout(); setShowProfileMenu(false); }} style={{ color: 'var(--danger)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', borderTop: '1px solid var(--card-border)', paddingTop: '0.6rem', marginTop: '0.2rem' }}>
                        <LogOut size={16} /> Log Out
                      </li>
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <button 
                className="btn btn-primary" 
                onClick={() => openAuthModal('login')}
                style={{ gap: '6px', padding: '0.5rem 1rem' }}
              >
                <User size={16} />
                Sign In / Register
              </button>
            )}
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
                      <div className="stat-value">{currencySymbol}{computedStats.balance.toLocaleString()}</div>
                    </div>
                    <div className="stat-icon">
                      <Wallet size={24} />
                    </div>
                  </div>
                  <div className="glass-card stat-card income">
                    <div className="stat-info">
                      <h3>Total Income</h3>
                      <div className="stat-value" style={{ color: 'var(--success)' }}>{currencySymbol}{computedStats.income.toLocaleString()}</div>
                    </div>
                    <div className="stat-icon">
                      <TrendingUp size={24} />
                    </div>
                  </div>
                  <div className="glass-card stat-card expenses">
                    <div className="stat-info">
                      <h3>Total Expenses</h3>
                      <div className="stat-value" style={{ color: 'var(--danger)' }}>{currencySymbol}{computedStats.expenses.toLocaleString()}</div>
                    </div>
                    <div className="stat-icon">
                      <TrendingDown size={24} />
                    </div>
                  </div>
                </div>

                {/* AI Financial Coach Card */}
                <div className="glass-card" style={{ marginBottom: '2rem', border: '1px solid rgba(224, 169, 109, 0.3)', background: 'linear-gradient(135deg, rgba(224, 169, 109, 0.08) 0%, rgba(24, 24, 27, 0.6) 100%)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Sparkles size={20} style={{ color: 'var(--primary)' }} />
                      <h2 style={{ fontSize: '1.15rem', fontWeight: 700 }}>FinFlow AI Advisor & Health Index</h2>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(224, 169, 109, 0.15)', padding: '0.35rem 0.85rem', borderRadius: '20px', border: '1px solid rgba(224, 169, 109, 0.3)' }}>
                      <Award size={16} style={{ color: 'var(--primary)' }} />
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary)' }}>Health Score: {aiInsights.score}/100 ({aiInsights.status})</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                    {aiInsights.tips.map((tip, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '0.88rem', color: 'var(--text-primary)', background: 'rgba(255,255,255,0.02)', padding: '0.6rem 0.85rem', borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--card-border)' }}>
                        <Zap size={16} style={{ color: 'var(--primary)', flexShrink: 0, marginTop: '2px' }} />
                        <span>{tip}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* FinFlow Horizon: Smart Wealth Forecaster Card */}
                <div className="glass-card" style={{ marginBottom: '2rem', border: '1px solid rgba(16, 185, 129, 0.3)', background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(24, 24, 27, 0.7) 100%)', padding: '1.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Compass size={22} style={{ color: '#10b981' }} />
                      <div>
                        <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>FinFlow Horizon • Smart Wealth Forecaster</h2>
                        <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Interactive compound wealth simulator & strategic horizon planner</p>
                      </div>
                    </div>
                    <span className="badge badge-income" style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                      Predictive Engine
                    </span>
                  </div>

                  {/* Controls Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label" style={{ fontSize: '0.82rem', display: 'flex', justifyContent: 'space-between' }}>
                        <span>Extra Monthly Savings ({currencySymbol})</span>
                        <strong style={{ color: 'var(--primary)' }}>{currencySymbol}{Number(forecastMonthlyExtra).toLocaleString()}</strong>
                      </label>
                      <input 
                        type="range" 
                        min="0" 
                        max="100000" 
                        step="1000"
                        className="glass-input"
                        value={forecastMonthlyExtra} 
                        onChange={(e) => setForecastMonthlyExtra(e.target.value)} 
                        style={{ width: '100%', accentColor: 'var(--primary)', cursor: 'pointer', padding: '0.4rem' }}
                      />
                    </div>

                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label" style={{ fontSize: '0.82rem', display: 'flex', justifyContent: 'space-between' }}>
                        <span>Annual Return Rate (%)</span>
                        <strong style={{ color: '#10b981' }}>{forecastReturnRate}% p.a.</strong>
                      </label>
                      <input 
                        type="range" 
                        min="1" 
                        max="20" 
                        step="0.5"
                        className="glass-input"
                        value={forecastReturnRate} 
                        onChange={(e) => setForecastReturnRate(e.target.value)} 
                        style={{ width: '100%', accentColor: '#10b981', cursor: 'pointer', padding: '0.4rem' }}
                      />
                    </div>

                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label" style={{ fontSize: '0.82rem', display: 'flex', justifyContent: 'space-between' }}>
                        <span>Expense Optimization ({forecastCutPercent}%)</span>
                        <strong style={{ color: '#fbbf24' }}>+{currencySymbol}{Math.round(wealthForecast.cutSavings).toLocaleString()}/mo</strong>
                      </label>
                      <input 
                        type="range" 
                        min="0" 
                        max="30" 
                        step="1"
                        className="glass-input"
                        value={forecastCutPercent} 
                        onChange={(e) => setForecastCutPercent(e.target.value)} 
                        style={{ width: '100%', accentColor: '#fbbf24', cursor: 'pointer', padding: '0.4rem' }}
                      />
                    </div>
                  </div>

                  {/* Output Results Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                    <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', border: '1px solid var(--card-border)' }}>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>1-Year Horizon</div>
                      <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px' }}>
                        {currencySymbol}{wealthForecast.fv1.toLocaleString()}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>12 months accumulated</div>
                    </div>

                    <div style={{ padding: '1rem', background: 'rgba(16, 185, 129, 0.08)', borderRadius: '10px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                      <div style={{ fontSize: '0.78rem', color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>3-Year Horizon</div>
                      <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#10b981', marginTop: '4px' }}>
                        {currencySymbol}{wealthForecast.fv3.toLocaleString()}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'rgba(16, 185, 129, 0.8)', marginTop: '2px' }}>
                        Includes +{currencySymbol}{Math.round(wealthForecast.interestGained3).toLocaleString()} interest
                      </div>
                    </div>

                    <div style={{ padding: '1rem', background: 'rgba(224, 169, 109, 0.08)', borderRadius: '10px', border: '1px solid rgba(224, 169, 109, 0.3)' }}>
                      <div style={{ fontSize: '0.78rem', color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>5-Year Horizon</div>
                      <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--primary)', marginTop: '4px' }}>
                        {currencySymbol}{wealthForecast.fv5.toLocaleString()}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>60 months compounded</div>
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

            {/* Savings Goals Tab */}
            {activeTab === 'goals' && (
              <div className="fade-in">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <h2 style={{ fontSize: '1.4rem', fontWeight: 700 }}>Financial Savings Goals</h2>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Track custom savings milestones, target dates, and deposit progress</p>
                  </div>
                  <button className="btn btn-primary" onClick={() => { setGoalTitle(''); setGoalTarget(''); setGoalCurrent(''); setGoalCategory('Savings'); setGoalDate(new Date().toISOString().split('T')[0]); setShowGoalModal(true); }}>
                    <Plus size={16} /> New Savings Goal
                  </button>
                </div>

                {(!goals || goals.length === 0) ? (
                  <div className="glass-card empty-state" style={{ padding: '3rem 1.5rem' }}>
                    <PiggyBank size={48} style={{ color: 'var(--primary)', opacity: 0.8, marginBottom: '1rem' }} />
                    <h3>No active savings goals found</h3>
                    <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                      Create a target goal (e.g. Emergency Fund, Laptop, Travel) to track your savings milestones.
                    </p>
                    <button className="btn btn-primary" style={{ marginTop: '1.25rem' }} onClick={() => setShowGoalModal(true)}>
                      <Plus size={16} /> Create Goal Now
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
                    {(goals || []).map((g) => {
                      if (!g) return null;
                      const current = Number(g.currentAmount) || 0;
                      const target = Number(g.targetAmount) || 1;
                      const pct = Math.min(Math.round((current / target) * 100), 100);
                      const targetDateObj = g.targetDate ? new Date(g.targetDate) : new Date();
                      const daysLeft = Math.ceil((targetDateObj - new Date()) / (1000 * 60 * 60 * 24));
                      return (
                        <div key={g._id || Math.random()} className="glass-card" style={{ border: '1px solid var(--card-border)', position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                              <div>
                                <span className="badge badge-income" style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{g.category || 'Savings'}</span>
                                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginTop: '0.35rem' }}>{g.title || 'Savings Goal'}</h3>
                              </div>
                              <button className="action-btn delete" onClick={() => handleDeleteGoal(g._id, g.title)}>
                                <Trash2 size={16} />
                              </button>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.5rem' }}>
                              <span style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--primary)' }}>{currencySymbol}{current.toLocaleString()}</span>
                              <span style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>Target: {currencySymbol}{target.toLocaleString()}</span>
                            </div>

                            {/* Progress Bar */}
                            <div className="progress-bar-container" style={{ height: '10px', background: 'rgba(255,255,255,0.06)', borderRadius: '10px', overflow: 'hidden', marginBottom: '0.85rem' }}>
                              <div style={{ width: `${pct}%`, height: '100%', background: 'linear-gradient(90deg, var(--primary) 0%, #f43f5e 100%)', borderRadius: '10px', transition: 'var(--transition-smooth)' }}></div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                              <span>{pct}% Completed</span>
                              <span>{daysLeft > 0 ? `${daysLeft} days left` : 'Target Date Reached'}</span>
                            </div>
                          </div>

                          <button className="btn btn-outline" style={{ width: '100%', marginTop: '1.25rem', justifyContent: 'center', gap: '6px' }} onClick={() => { setSelectedGoal(g); setDepositAmount(''); setShowDepositModal(true); }}>
                            <PlusCircle size={16} /> Deposit Funds
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* My Profile & Financial Portfolio Tab */}
            {activeTab === 'profile' && (
              <div className="fade-in">
                {/* Profile Banner */}
                <div className="glass-card" style={{ marginBottom: '2rem', border: '1px solid rgba(224, 169, 109, 0.3)', background: 'linear-gradient(135deg, rgba(224, 169, 109, 0.1) 0%, rgba(24, 24, 27, 0.8) 100%)', padding: '2rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
                    <div style={{ width: '84px', height: '84px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary) 0%, #a855f7 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.2rem', fontWeight: 800, color: '#fff', boxShadow: '0 0 25px rgba(224, 169, 109, 0.4)' }}>
                      {currentUser ? (currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U') : 'H'}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                        <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>{currentUser ? currentUser.name : 'Harshil Jain'}</h1>
                        <span className="badge badge-income" style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Pro Account</span>
                      </div>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>{currentUser ? currentUser.email : 'user@finflow.app'} • Personal Wealth Dashboard</p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                      <button className="btn btn-primary" onClick={() => { setEditProfileName(currentUser ? currentUser.name : 'Harshil Jain'); setShowEditProfileModal(true); }} style={{ gap: '6px' }}>
                        <Edit3 size={16} /> Edit Profile
                      </button>
                    </div>
                  </div>
                </div>

                {/* Portfolio Stats Grid */}
                <div className="stats-grid" style={{ marginBottom: '2rem' }}>
                  <div className="glass-card stat-card balance">
                    <div className="stat-info">
                      <h3>Total Income Flow</h3>
                      <div className="stat-value" style={{ color: 'var(--success)' }}>₹{computedStats.income.toLocaleString()}</div>
                    </div>
                    <div className="stat-icon"><TrendingUp size={24} /></div>
                  </div>
                  <div className="glass-card stat-card expenses">
                    <div className="stat-info">
                      <h3>Total Expense Flow</h3>
                      <div className="stat-value" style={{ color: 'var(--danger)' }}>₹{computedStats.expenses.toLocaleString()}</div>
                    </div>
                    <div className="stat-icon"><TrendingDown size={24} /></div>
                  </div>
                  <div className="glass-card stat-card balance">
                    <div className="stat-info">
                      <h3>Net Capital Savings</h3>
                      <div className="stat-value" style={{ color: 'var(--primary)' }}>₹{computedStats.balance.toLocaleString()}</div>
                    </div>
                    <div className="stat-icon"><Wallet size={24} /></div>
                  </div>
                </div>

                {/* Visual Chart & Milestones Split */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                  {/* Category Expense Visual Chart */}
                  <div className="glass-card">
                    <div className="chart-header" style={{ marginBottom: '1rem' }}>
                      <h2>Visual Category Breakdown</h2>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Distribution</span>
                    </div>
                    <div style={{ height: '240px', position: 'relative' }}>
                      {transactions.length > 0 ? (
                        <Doughnut 
                          data={categoryChartData} 
                          options={{ 
                            responsive: true, 
                            maintainAspectRatio: false, 
                            plugins: { legend: { position: 'bottom', labels: { color: '#94a3b8', font: { size: 11 } } } } 
                          }} 
                        />
                      ) : (
                        <div className="empty-state"><p>No transactions to display visual breakdown</p></div>
                      )}
                    </div>
                  </div>

                  {/* Account Badges & System Metrics */}
                  <div className="glass-card">
                    <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1rem' }}>Account Milestones & Metrics</h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '0.75rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid var(--card-border)' }}>
                        <Award size={24} style={{ color: 'var(--primary)' }} />
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>Financial Health Score: {aiInsights.score}/100</div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Status: {aiInsights.status}</div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '0.75rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid var(--card-border)' }}>
                        <Target size={24} style={{ color: '#10b981' }} />
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>Savings Goals Tracked: {goals.length} Active Targets</div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Target completion progress</div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '0.75rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid var(--card-border)' }}>
                        <Zap size={24} style={{ color: '#fbbf24' }} />
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>Total Transactions: {transactions.length} Records</div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Scoped to your user ID</div>
                        </div>
                      </div>
                    </div>
                  </div>
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



      {/* User Authentication Modal */}
      {showAuthModal && (
        <div className="modal-overlay">
          <div className="glass-card modal-content" style={{ maxWidth: '420px', padding: '2rem' }}>
            <div className="modal-header" style={{ marginBottom: '1.25rem' }}>
              <div>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 700 }}>
                  {authMode === 'login' ? 'Sign In to FinFlow' : 'Create Account'}
                </h2>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                  {authMode === 'login' ? 'Access your personal cloud dashboard' : 'Join FinFlow to manage your finances safely'}
                </p>
              </div>
              <button className="action-btn" onClick={() => setShowAuthModal(false)}>
                <X size={20} />
              </button>
            </div>

            {/* Auth Mode Toggle Tabs */}
            <div style={{ display: 'flex', background: 'rgba(0,0,0,0.25)', borderRadius: 'var(--border-radius-md)', padding: '4px', marginBottom: '1.5rem' }}>
              <button 
                type="button" 
                onClick={() => openAuthModal('login')}
                style={{
                  flex: 1,
                  padding: '0.5rem',
                  border: 'none',
                  borderRadius: 'var(--border-radius-sm)',
                  background: authMode === 'login' ? 'var(--primary)' : 'transparent',
                  color: '#fff',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  transition: 'var(--transition-smooth)'
                }}
              >
                Sign In
              </button>
              <button 
                type="button" 
                onClick={() => openAuthModal('register')}
                style={{
                  flex: 1,
                  padding: '0.5rem',
                  border: 'none',
                  borderRadius: 'var(--border-radius-sm)',
                  background: authMode === 'register' ? 'var(--primary)' : 'transparent',
                  color: '#fff',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  transition: 'var(--transition-smooth)'
                }}
              >
                Register
              </button>
            </div>

            {authError && (
              <div style={{
                background: 'var(--danger-glow)',
                border: '1px solid var(--danger)',
                color: 'var(--text-primary)',
                padding: '0.75rem',
                borderRadius: 'var(--border-radius-sm)',
                fontSize: '0.85rem',
                marginBottom: '1.25rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <AlertCircle size={16} style={{ color: 'var(--danger)', flexShrink: 0 }} />
                <span>{authError}</span>
              </div>
            )}

            <form onSubmit={handleAuthSubmit} autoComplete="off">
              {authMode === 'register' && (
                <div className="form-group" style={{ marginBottom: '1rem' }}>
                  <label className="form-label">Full Name</label>
                  <div style={{ position: 'relative' }}>
                    <User size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input 
                      type="text" 
                      className="glass-input" 
                      style={{ paddingLeft: '2.4rem' }}
                      placeholder="Enter your full name"
                      autoComplete="off"
                      required
                      value={authName}
                      onChange={(e) => setAuthName(e.target.value)}
                    />
                  </div>
                </div>
              )}

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">Email Address</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input 
                    type="email" 
                    className="glass-input" 
                    style={{ paddingLeft: '2.4rem' }}
                    placeholder="name@example.com"
                    autoComplete="off"
                    required
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label">Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input 
                    type="password" 
                    className="glass-input" 
                    style={{ paddingLeft: '2.4rem' }}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    required
                    minLength={6}
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                  />
                </div>
              </div>

              <button 
                type="submit" 
                className="btn btn-primary" 
                disabled={authLoading}
                style={{ width: '100%', justifyContent: 'center', padding: '0.75rem' }}
              >
                {authLoading 
                  ? 'Processing...' 
                  : authMode === 'login' ? 'Sign In to Account' : 'Create My Account'}
              </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              {authMode === 'login' ? (
                <>
                  Don't have an account?{' '}
                  <span 
                    onClick={() => openAuthModal('register')}
                    style={{ color: 'var(--primary)', fontWeight: 600, cursor: 'pointer' }}
                  >
                    Register here
                  </span>
                </>
              ) : (
                <>
                  Already have an account?{' '}
                  <span 
                    onClick={() => openAuthModal('login')}
                    style={{ color: 'var(--primary)', fontWeight: 600, cursor: 'pointer' }}
                  >
                    Sign in here
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* New Savings Goal Modal */}
      {showGoalModal && (
        <div className="modal-overlay">
          <div className="glass-card modal-content" style={{ maxWidth: '460px' }}>
            <div className="modal-header">
              <h2>New Savings Goal</h2>
              <button className="action-btn" onClick={() => setShowGoalModal(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmitGoal}>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">Goal Title</label>
                <input 
                  type="text" 
                  className="glass-input" 
                  placeholder="e.g. Emergency Fund, New Laptop"
                  required
                  value={goalTitle}
                  onChange={(e) => setGoalTitle(e.target.value)}
                />
              </div>

              <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Target Amount ({currencySymbol})</label>
                  <input 
                    type="number" 
                    className="glass-input" 
                    placeholder="e.g. 50000"
                    required
                    min="1"
                    value={goalTarget}
                    onChange={(e) => setGoalTarget(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Starting Balance ({currencySymbol})</label>
                  <input 
                    type="number" 
                    className="glass-input" 
                    placeholder="0"
                    min="0"
                    value={goalCurrent}
                    onChange={(e) => setGoalCurrent(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                <div className="form-group">
                  <label className="form-label">Target Date</label>
                  <input 
                    type="date" 
                    className="glass-input" 
                    required
                    value={goalDate}
                    onChange={(e) => setGoalDate(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select 
                    className="glass-input" 
                    value={goalCategory} 
                    onChange={(e) => setGoalCategory(e.target.value)}
                  >
                    <option value="Savings">Savings</option>
                    <option value="Gadgets">Gadgets</option>
                    <option value="Travel">Travel</option>
                    <option value="Emergency">Emergency</option>
                    <option value="Vehicle">Vehicle</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowGoalModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create Goal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Deposit Funds Modal */}
      {showDepositModal && selectedGoal && (
        <div className="modal-overlay">
          <div className="glass-card modal-content" style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h2>Deposit Funds</h2>
              <button className="action-btn" onClick={() => setShowDepositModal(false)}>
                <X size={20} />
              </button>
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Add funds to <strong style={{ color: 'var(--text-primary)' }}>{selectedGoal.title}</strong></p>
              <div style={{ fontSize: '0.85rem', color: 'var(--primary)', marginTop: '4px' }}>
                Current Progress: {currencySymbol}{(Number(selectedGoal?.currentAmount) || 0).toLocaleString()} / {currencySymbol}{(Number(selectedGoal?.targetAmount) || 0).toLocaleString()}
              </div>
            </div>

            <form onSubmit={handleDepositGoal}>
              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label">Deposit Amount ({currencySymbol})</label>
                <input 
                  type="number" 
                  className="glass-input" 
                  placeholder="e.g. 2500"
                  required
                  min="1"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowDepositModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Confirm Deposit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      {showEditProfileModal && (
        <div className="modal-overlay">
          <div className="glass-card modal-content" style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h2>Edit Profile</h2>
              <button className="action-btn" onClick={() => setShowEditProfileModal(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveProfile}>
              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label">Full Name</label>
                <input 
                  type="text" 
                  className="glass-input" 
                  placeholder="Enter your full name"
                  required
                  value={editProfileName}
                  onChange={(e) => setEditProfileName(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowEditProfileModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Account Settings Modal */}
      {showSettingsModal && (
        <div className="modal-overlay">
          <div className="glass-card modal-content" style={{ maxWidth: '480px', padding: '1.75rem' }}>
            <div className="modal-header" style={{ marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Settings size={22} style={{ color: 'var(--primary)' }} />
                <h2 style={{ fontSize: '1.4rem', fontWeight: 700 }}>Account Settings</h2>
              </div>
              <button className="action-btn" onClick={() => setShowSettingsModal(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handleSaveSettings(); }}>
              {/* 1. Currency Preference Switcher */}
              <div style={{ marginBottom: '1.5rem', background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--card-border)' }}>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, marginBottom: '0.5rem' }}>
                  <DollarSign size={16} style={{ color: 'var(--primary)' }} /> Primary Currency Display
                </label>
                <select 
                  className="glass-input" 
                  value={currencySymbol} 
                  onChange={(e) => setCurrencySymbol(e.target.value)}
                  style={{ width: '100%' }}
                >
                  <option value="₹">₹ INR - Indian Rupee</option>
                  <option value="$">$ USD - US Dollar</option>
                  <option value="€">€ EUR - Euro</option>
                  <option value="£">£ GBP - British Pound</option>
                </select>
              </div>

              {/* 2. Data & Backup Center */}
              <div style={{ marginBottom: '1.5rem', background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--card-border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, margin: 0 }}>
                    <Database size={16} style={{ color: 'var(--primary)' }} /> Data & Cloud Backups
                  </label>
                  <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '12px', background: dbStatus.connected ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)', color: dbStatus.connected ? 'var(--success)' : '#f59e0b', border: '1px solid currentColor' }}>
                    {dbStatus.connected ? 'MongoDB Cloud' : 'Local Fallback'}
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <button type="button" className="btn btn-outline" onClick={exportJSON} style={{ fontSize: '0.82rem', padding: '0.5rem', justifyContent: 'center', gap: '6px' }}>
                    <Download size={14} /> JSON Backup
                  </button>
                  <button type="button" className="btn btn-outline" onClick={exportCSV} style={{ fontSize: '0.82rem', padding: '0.5rem', justifyContent: 'center', gap: '6px' }}>
                    <FileSpreadsheet size={14} /> CSV Statement
                  </button>
                </div>
              </div>

              {/* 3. Notification & Alert Preferences */}
              <div style={{ marginBottom: '1.5rem', background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--card-border)' }}>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, marginBottom: '0.75rem' }}>
                  <AlertCircle size={16} style={{ color: 'var(--primary)' }} /> Alerts & Preferences
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.88rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                    <input 
                      type="checkbox" 
                      checked={alertBudgetWarnings} 
                      onChange={(e) => setAlertBudgetWarnings(e.target.checked)}
                      style={{ accentColor: 'var(--primary)', width: '16px', height: '16px' }}
                    />
                    <span>Show Over-Budget Compliance Warnings</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                    <input 
                      type="checkbox" 
                      checked={alertSubReminders} 
                      onChange={(e) => setAlertSubReminders(e.target.checked)}
                      style={{ accentColor: 'var(--primary)', width: '16px', height: '16px' }}
                    />
                    <span>Show Subscription Auto-Debit Due Notifications</span>
                  </label>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowSettingsModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Settings
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
