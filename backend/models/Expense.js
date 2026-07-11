const mongoose = require("mongoose");

const expenseSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, "Please add a title"],
            trim: true
        },
        amount: {
            type: Number,
            required: [true, "Please add an amount"]
        },
        type: {
            type: String,
            required: [true, "Please select transaction type"],
            enum: ["income", "expense"]
        },
        category: {
            type: String,
            required: [true, "Please add a category"],
            trim: true
        },
        date: {
            type: Date,
            default: Date.now
        },
        description: {
            type: String,
            trim: true
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Expense", expenseSchema);
