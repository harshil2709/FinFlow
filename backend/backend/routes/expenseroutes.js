const express = require("express");
const router = express.Router();

const { addExpense, getExpenses } = require("../controllers/expensecontroller");

router.post("/expense", addExpense);
router.get("/expenses", getExpenses);

module.exports = router;