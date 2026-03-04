let expenses = [];

const addExpense = (req, res) => {
    const { title, amount, category } = req.body;

    if (!title || !amount || !category) {
        return res.status(400).json({
            message: "All fields are required"
        });
    }

    const newExpense = { title, amount, category };
    expenses.push(newExpense);

    res.status(201).json({
        message: "Expense added successfully",
        expense: newExpense
    });
};

const getExpenses = (req, res) => {
    res.status(200).json({
        count: expenses.length,
        data: expenses
    });
};

module.exports = {
    addExpense,
    getExpenses
};