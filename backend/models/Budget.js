const mongoose = require("mongoose");

const budgetSchema = new mongoose.Schema(
    {
        category: {
            type: String,
            required: [true, "Please specify a category"],
            unique: true,
            trim: true
        },
        limit: {
            type: Number,
            required: [true, "Please specify a budget limit"]
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Budget", budgetSchema);
