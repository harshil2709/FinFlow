const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/authMiddleware");
const { registerUser, loginUser, getMe } = require("../controllers/authController");

const {
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
    updateSubscription
} = require("../controllers/expensecontroller");

// Authentication Endpoints
router.post("/auth/register", registerUser);
router.post("/auth/login", loginUser);
router.get("/auth/me", protect, getMe);

// System Status Route
router.get("/status", getStatus);

// Transactions Routes (Protected)
router.get("/expenses", protect, getExpenses);
router.post("/expenses", protect, addExpense);
router.delete("/expenses/:id", protect, deleteExpense);
router.put("/expenses/:id", protect, updateExpense);

// Budgets Routes (Protected)
router.get("/budgets", protect, getBudgets);
router.post("/budgets", protect, setBudget);
router.delete("/budgets/:id", protect, deleteBudget);

// System Reset Route (Protected)
router.delete("/reset", protect, resetDatabase);

// Subscriptions Routes (Protected)
router.get("/subscriptions", protect, getSubscriptions);
router.post("/subscriptions", protect, addSubscription);
router.delete("/subscriptions/:id", protect, deleteSubscription);
router.put("/subscriptions/:id", protect, updateSubscription);

module.exports = router;