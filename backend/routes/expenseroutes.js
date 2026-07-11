const express = require("express");
const router = express.Router();

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

// Transactions Routes
router.get("/expenses", getExpenses);
router.post("/expenses", addExpense);
router.delete("/expenses/:id", deleteExpense);
router.put("/expenses/:id", updateExpense);

// Budgets Routes
router.get("/budgets", getBudgets);
router.post("/budgets", setBudget);
router.delete("/budgets/:id", deleteBudget);

// System Reset Route
router.delete("/reset", resetDatabase);

// System Status Route
router.get("/status", getStatus);

// Subscriptions Routes
router.get("/subscriptions", getSubscriptions);
router.post("/subscriptions", addSubscription);
router.delete("/subscriptions/:id", deleteSubscription);
router.put("/subscriptions/:id", updateSubscription);

module.exports = router;