const mongoose = require("mongoose");

const goalSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        title: {
            type: String,
            required: [true, "Please add a goal title"],
            trim: true
        },
        targetAmount: {
            type: Number,
            required: [true, "Please add a target amount"]
        },
        currentAmount: {
            type: Number,
            default: 0
        },
        targetDate: {
            type: Date,
            required: [true, "Please specify a target completion date"]
        },
        category: {
            type: String,
            default: "Savings"
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Goal", goalSchema);
