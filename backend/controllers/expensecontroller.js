const Expense = require("../models/Expense");
const Budget = require("../models/Budget");
const Subscription = require("../models/Subscription");
const Goal = require("../models/Goal");
const { getIsConnected } = require("../config/db");
const { isRedisConnected, getCachedData, setCachedData, deleteCachedData } = require("../config/redis");
const fs = require("fs");
const path = require("path");

// Local JSON File Paths (Fallback Storage)
const DATA_DIR = path.join(__dirname, "../data");
const EXPENSES_FILE = path.join(DATA_DIR, "expenses.json");
const BUDGETS_FILE = path.join(DATA_DIR, "budgets.json");
const SUBSCRIPTIONS_FILE = path.join(DATA_DIR, "subscriptions.json");
const GOALS_FILE = path.join(DATA_DIR, "goals.json");

// Ensure data files and folders exist for JSON fallback mode
const ensureLocalDB = () => {
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(EXPENSES_FILE)) {
        fs.writeFileSync(EXPENSES_FILE, JSON.stringify([]));
    }
    if (!fs.existsSync(BUDGETS_FILE)) {
        fs.writeFileSync(BUDGETS_FILE, JSON.stringify([]));
    }
    if (!fs.existsSync(SUBSCRIPTIONS_FILE)) {
        fs.writeFileSync(SUBSCRIPTIONS_FILE, JSON.stringify([]));
    }
    if (!fs.existsSync(GOALS_FILE)) {
        fs.writeFileSync(GOALS_FILE, JSON.stringify([]));
    }
};

const readLocalData = (filePath) => {
    ensureLocalDB();
    try {
        return JSON.parse(fs.readFileSync(filePath, "utf8"));
    } catch (e) {
        return [];
    }
};

const writeLocalData = (filePath, data) => {
    ensureLocalDB();
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
};

// --- Transaction Controllers ---

// Get all transactions
const getExpenses = async (req, res) => {
    try {
        if (getIsConnected()) {
            const { type, category, search, startDate, endDate } = req.query;
            let query = {};
            if (req.user && req.user.id && req.user.id !== 'guest_user_id') {
                query.user = req.user.id;
            }

            if (type) query.type = type;
            if (category) query.category = category;
            if (search) query.title = { $regex: search, $options: "i" };
            if (startDate || endDate) {
                query.date = {};
                if (startDate) query.date.$gte = new Date(startDate);
                if (endDate) query.date.$lte = new Date(endDate);
            }

            const expenses = await Expense.find(query).sort({ date: -1 });
            res.status(200).json({
                success: true,
                count: expenses.length,
                data: expenses
            });
        } else {
            // Local JSON Fallback Mode
            let data = readLocalData(EXPENSES_FILE);
            const { type, category, search, startDate, endDate } = req.query;

            if (type) {
                data = data.filter((t) => t.type === type);
            }
            if (category) {
                data = data.filter((t) => t.category === category);
            }
            if (search) {
                const queryStr = search.toLowerCase();
                data = data.filter((t) => 
                    t.title.toLowerCase().includes(queryStr) || 
                    (t.description && t.description.toLowerCase().includes(queryStr))
                );
            }
            if (startDate) {
                data = data.filter((t) => new Date(t.date) >= new Date(startDate));
            }
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                data = data.filter((t) => new Date(t.date) <= end);
            }

            // Sort by date descending
            data.sort((a, b) => new Date(b.date) - new Date(a.date));

            res.status(200).json({
                success: true,
                count: data.length,
                data: data
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Server Error",
            error: error.message
        });
    }
};

// Add a transaction
const addExpense = async (req, res) => {
    try {
        const { title, amount, type, category, date, description } = req.body;

        if (!title || !amount || !type || !category) {
            return res.status(400).json({
                success: false,
                message: "Please provide title, amount, type, and category"
            });
        }

        if (getIsConnected()) {
            const newExpenseData = {
                title,
                amount,
                type,
                category,
                date: date || undefined,
                description
            };
            if (req.user && req.user.id && req.user.id !== 'guest_user_id') {
                newExpenseData.user = req.user.id;
            }
            const expense = await Expense.create(newExpenseData);
            res.status(201).json({
                success: true,
                data: expense
            });
        } else {
            // Local JSON Fallback Mode
            const expenses = readLocalData(EXPENSES_FILE);
            const newExpense = {
                _id: Date.now().toString(), // Mock DB ID
                title,
                amount: parseFloat(amount),
                type,
                category,
                date: date || new Date().toISOString(),
                description,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            expenses.push(newExpense);
            writeLocalData(EXPENSES_FILE, expenses);

            res.status(201).json({
                success: true,
                data: newExpense
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Server Error",
            error: error.message
        });
    }
};

// Delete a transaction
const deleteExpense = async (req, res) => {
    try {
        if (getIsConnected()) {
            const expense = await Expense.findById(req.params.id);

            if (!expense) {
                return res.status(404).json({
                    success: false,
                    message: "Transaction not found"
                });
            }

            await expense.deleteOne();
            res.status(200).json({
                success: true,
                data: {}
            });
        } else {
            // Local JSON Fallback Mode
            let expenses = readLocalData(EXPENSES_FILE);
            const exists = expenses.some((t) => t._id === req.params.id);

            if (!exists) {
                return res.status(404).json({
                    success: false,
                    message: "Transaction not found"
                });
            }

            expenses = expenses.filter((t) => t._id !== req.params.id);
            writeLocalData(EXPENSES_FILE, expenses);

            res.status(200).json({
                success: true,
                data: {}
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Server Error",
            error: error.message
        });
    }
};

// Update a transaction
const updateExpense = async (req, res) => {
    try {
        if (getIsConnected()) {
            let expense = await Expense.findById(req.params.id);

            if (!expense) {
                return res.status(404).json({
                    success: false,
                    message: "Transaction not found"
                });
            }

            expense = await Expense.findByIdAndUpdate(req.params.id, req.body, {
                new: true,
                runValidators: true
            });

            res.status(200).json({
                success: true,
                data: expense
            });
        } else {
            // Local JSON Fallback Mode
            let expenses = readLocalData(EXPENSES_FILE);
            const index = expenses.findIndex((t) => t._id === req.params.id);

            if (index === -1) {
                return res.status(404).json({
                    success: false,
                    message: "Transaction not found"
                });
            }

            expenses[index] = {
                ...expenses[index],
                ...req.body,
                updatedAt: new Date().toISOString()
            };
            writeLocalData(EXPENSES_FILE, expenses);

            res.status(200).json({
                success: true,
                data: expenses[index]
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Server Error",
            error: error.message
        });
    }
};

// --- Budget Controllers ---

const getBudgets = async (req, res) => {
    try {
        if (getIsConnected()) {
            let filter = {};
            if (req.user && req.user.id && req.user.id !== 'guest_user_id') {
                filter.user = req.user.id;
            }
            const budgets = await Budget.find(filter);
            res.status(200).json({
                success: true,
                data: budgets
            });
        } else {
            // Local JSON Fallback Mode
            const budgets = readLocalData(BUDGETS_FILE);
            res.status(200).json({
                success: true,
                data: budgets
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Server Error",
            error: error.message
        });
    }
};

const setBudget = async (req, res) => {
    try {
        const { category, limit } = req.body;

        if (!category || limit === undefined) {
            return res.status(400).json({
                success: false,
                message: "Please provide a category and a limit"
            });
        }

        if (getIsConnected()) {
            let filter = { category };
            let updateData = { category, limit };
            if (req.user && req.user.id && req.user.id !== 'guest_user_id') {
                filter.user = req.user.id;
                updateData.user = req.user.id;
            }

            const budget = await Budget.findOneAndUpdate(
                filter,
                updateData,
                { new: true, upsert: true, runValidators: true }
            );
            res.status(200).json({
                success: true,
                data: budget
            });
        } else {
            // Local JSON Fallback Mode
            let budgets = readLocalData(BUDGETS_FILE);
            const index = budgets.findIndex((b) => b.category === category);
            let updatedBudget;

            if (index !== -1) {
                budgets[index].limit = parseFloat(limit);
                budgets[index].updatedAt = new Date().toISOString();
                updatedBudget = budgets[index];
            } else {
                updatedBudget = {
                    _id: Date.now().toString(),
                    category,
                    limit: parseFloat(limit),
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };
                budgets.push(updatedBudget);
            }
            writeLocalData(BUDGETS_FILE, budgets);

            res.status(200).json({
                success: true,
                data: updatedBudget
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Server Error",
            error: error.message
        });
    }
};

const deleteBudget = async (req, res) => {
    try {
        if (getIsConnected()) {
            const budget = await Budget.findById(req.params.id);

            if (!budget) {
                return res.status(404).json({
                    success: false,
                    message: "Budget limit not found"
                });
            }

            await budget.deleteOne();
            res.status(200).json({
                success: true,
                data: {}
            });
        } else {
            // Local JSON Fallback Mode
            let budgets = readLocalData(BUDGETS_FILE);
            const exists = budgets.some((b) => b._id === req.params.id);

            if (!exists) {
                return res.status(404).json({
                    success: false,
                    message: "Budget limit not found"
                });
            }

            budgets = budgets.filter((b) => b._id !== req.params.id);
            writeLocalData(BUDGETS_FILE, budgets);

            res.status(200).json({
                success: true,
                data: {}
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Server Error",
            error: error.message
        });
    }
};

const resetDatabase = async (req, res) => {
    try {
        if (getIsConnected()) {
            await Expense.deleteMany({});
            await Budget.deleteMany({});
            await Subscription.deleteMany({});
            await Goal.deleteMany({});
        } else {
            writeLocalData(EXPENSES_FILE, []);
            writeLocalData(BUDGETS_FILE, []);
            writeLocalData(SUBSCRIPTIONS_FILE, []);
            writeLocalData(GOALS_FILE, []);
        }
        res.status(200).json({
            success: true,
            message: "Database reset successfully"
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Server Error",
            error: error.message
        });
    }
};

const getStatus = async (req, res) => {
    const dbActive = getIsConnected();
    const redisActive = isRedisConnected();
    let dbTypeStr = dbActive ? "MongoDB Cloud" : "Local JSON File";
    if (redisActive) {
        dbTypeStr += " + Redis Cache";
    }
    res.status(200).json({
        success: true,
        dbConnected: dbActive,
        redisConnected: redisActive,
        dbType: dbTypeStr
    });
};

// --- Subscription Controllers ---

const getSubscriptions = async (req, res) => {
    try {
        if (getIsConnected()) {
            let filter = {};
            if (req.user && req.user.id && req.user.id !== 'guest_user_id') {
                filter.user = req.user.id;
            }
            const subscriptions = await Subscription.find(filter).sort({ nextDueDate: 1 });
            res.status(200).json({
                success: true,
                count: subscriptions.length,
                data: subscriptions
            });
        } else {
            const subscriptions = readLocalData(SUBSCRIPTIONS_FILE);
            subscriptions.sort((a, b) => new Date(a.nextDueDate) - new Date(b.nextDueDate));
            res.status(200).json({
                success: true,
                count: subscriptions.length,
                data: subscriptions
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Server Error",
            error: error.message
        });
    }
};

const addSubscription = async (req, res) => {
    try {
        const { title, amount, billingCycle, category, nextDueDate, status } = req.body;

        if (!title || !amount || !billingCycle || !category || !nextDueDate) {
            return res.status(400).json({
                success: false,
                message: "Please provide title, amount, billingCycle, category, and nextDueDate"
            });
        }

        if (getIsConnected()) {
            const subData = {
                title,
                amount,
                billingCycle,
                category,
                nextDueDate,
                status: status || "active"
            };
            if (req.user && req.user.id && req.user.id !== 'guest_user_id') {
                subData.user = req.user.id;
            }
            const subscription = await Subscription.create(subData);
            res.status(201).json({
                success: true,
                data: subscription
            });
        } else {
            const subscriptions = readLocalData(SUBSCRIPTIONS_FILE);
            const newSub = {
                _id: Date.now().toString(),
                title,
                amount: parseFloat(amount),
                billingCycle,
                category,
                nextDueDate,
                status: status || "active",
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            subscriptions.push(newSub);
            writeLocalData(SUBSCRIPTIONS_FILE, subscriptions);
            res.status(201).json({
                success: true,
                data: newSub
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Server Error",
            error: error.message
        });
    }
};

const deleteSubscription = async (req, res) => {
    try {
        if (getIsConnected()) {
            const subscription = await Subscription.findById(req.params.id);
            if (!subscription) {
                return res.status(404).json({
                    success: false,
                    message: "Subscription not found"
                });
            }
            await subscription.deleteOne();
            res.status(200).json({
                success: true,
                data: {}
            });
        } else {
            let subscriptions = readLocalData(SUBSCRIPTIONS_FILE);
            const exists = subscriptions.some((s) => s._id === req.params.id);
            if (!exists) {
                return res.status(404).json({
                    success: false,
                    message: "Subscription not found"
                });
            }
            subscriptions = subscriptions.filter((s) => s._id !== req.params.id);
            writeLocalData(SUBSCRIPTIONS_FILE, subscriptions);
            res.status(200).json({
                success: true,
                data: {}
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Server Error",
            error: error.message
        });
    }
};

const updateSubscription = async (req, res) => {
    try {
        if (getIsConnected()) {
            let subscription = await Subscription.findById(req.params.id);
            if (!subscription) {
                return res.status(404).json({
                    success: false,
                    message: "Subscription not found"
                });
            }
            subscription = await Subscription.findByIdAndUpdate(req.params.id, req.body, {
                new: true,
                runValidators: true
            });
            res.status(200).json({
                success: true,
                data: subscription
            });
        } else {
            let subscriptions = readLocalData(SUBSCRIPTIONS_FILE);
            const index = subscriptions.findIndex((s) => s._id === req.params.id);
            if (index === -1) {
                return res.status(404).json({
                    success: false,
                    message: "Subscription not found"
                });
            }
            subscriptions[index] = {
                ...subscriptions[index],
                ...req.body,
                updatedAt: new Date().toISOString()
            };
            writeLocalData(SUBSCRIPTIONS_FILE, subscriptions);
            res.status(200).json({
                success: true,
                data: subscriptions[index]
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Server Error",
            error: error.message
        });
    }
};

// --- Savings Goal Controllers ---

const getGoals = async (req, res) => {
    try {
        if (getIsConnected()) {
            let filter = {};
            if (req.user && req.user.id && req.user.id !== 'guest_user_id') {
                filter.user = req.user.id;
            }
            const goals = await Goal.find(filter).sort({ targetDate: 1 });
            res.status(200).json({
                success: true,
                count: goals.length,
                data: goals
            });
        } else {
            const goals = readLocalData(GOALS_FILE);
            goals.sort((a, b) => new Date(a.targetDate) - new Date(b.targetDate));
            res.status(200).json({
                success: true,
                count: goals.length,
                data: goals
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Server Error",
            error: error.message
        });
    }
};

const addGoal = async (req, res) => {
    try {
        const { title, targetAmount, currentAmount, targetDate, category } = req.body;

        if (!title || !targetAmount || !targetDate) {
            return res.status(400).json({
                success: false,
                message: "Please provide title, targetAmount, and targetDate"
            });
        }

        if (getIsConnected()) {
            const goalData = {
                title,
                targetAmount: parseFloat(targetAmount),
                currentAmount: currentAmount ? parseFloat(currentAmount) : 0,
                targetDate,
                category: category || "Savings"
            };
            if (req.user && req.user.id && req.user.id !== 'guest_user_id') {
                goalData.user = req.user.id;
            }
            const goal = await Goal.create(goalData);
            res.status(201).json({
                success: true,
                data: goal
            });
        } else {
            const goals = readLocalData(GOALS_FILE);
            const newGoal = {
                _id: Date.now().toString(),
                title,
                targetAmount: parseFloat(targetAmount),
                currentAmount: currentAmount ? parseFloat(currentAmount) : 0,
                targetDate,
                category: category || "Savings",
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            goals.push(newGoal);
            writeLocalData(GOALS_FILE, goals);
            res.status(201).json({
                success: true,
                data: newGoal
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Server Error",
            error: error.message
        });
    }
};

const updateGoal = async (req, res) => {
    try {
        if (getIsConnected()) {
            let goal = await Goal.findById(req.params.id);
            if (!goal) {
                return res.status(404).json({
                    success: false,
                    message: "Savings goal not found"
                });
            }
            goal = await Goal.findByIdAndUpdate(req.params.id, req.body, {
                new: true,
                runValidators: true
            });
            res.status(200).json({
                success: true,
                data: goal
            });
        } else {
            let goals = readLocalData(GOALS_FILE);
            const index = goals.findIndex((g) => g._id === req.params.id);
            if (index === -1) {
                return res.status(404).json({
                    success: false,
                    message: "Savings goal not found"
                });
            }
            goals[index] = {
                ...goals[index],
                ...req.body,
                updatedAt: new Date().toISOString()
            };
            writeLocalData(GOALS_FILE, goals);
            res.status(200).json({
                success: true,
                data: goals[index]
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Server Error",
            error: error.message
        });
    }
};

const deleteGoal = async (req, res) => {
    try {
        if (getIsConnected()) {
            const goal = await Goal.findById(req.params.id);
            if (!goal) {
                return res.status(404).json({
                    success: false,
                    message: "Savings goal not found"
                });
            }
            await goal.deleteOne();
            res.status(200).json({
                success: true,
                data: {}
            });
        } else {
            let goals = readLocalData(GOALS_FILE);
            const exists = goals.some((g) => g._id === req.params.id);
            if (!exists) {
                return res.status(404).json({
                    success: false,
                    message: "Savings goal not found"
                });
            }
            goals = goals.filter((g) => g._id !== req.params.id);
            writeLocalData(GOALS_FILE, goals);
            res.status(200).json({
                success: true,
                data: {}
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Server Error",
            error: error.message
        });
    }
};

module.exports = {
    getExpenses,
    addExpense,
    deleteExpense,
    updateExpense,
    getBudgets,
    setBudget,
    deleteBudget,
    resetDatabase,
    getStatus,
    getSubscriptions,
    addSubscription,
    deleteSubscription,
    updateSubscription,
    getGoals,
    addGoal,
    updateGoal,
    deleteGoal
};