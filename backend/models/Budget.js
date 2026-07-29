const mongoose = require("mongoose");

const budgetSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        category: {
            type: String,
            required: [true, "Please specify a category"],
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
