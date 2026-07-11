const mongoose = require("mongoose");

const subscriptionSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, "Please add a subscription title"],
            trim: true
        },
        amount: {
            type: Number,
            required: [true, "Please add an amount"]
        },
        billingCycle: {
            type: String,
            required: [true, "Please select billing cycle"],
            enum: ["monthly", "yearly"]
        },
        category: {
            type: String,
            required: [true, "Please add a category"],
            trim: true
        },
        nextDueDate: {
            type: Date,
            required: [true, "Please specify the next due date"]
        },
        status: {
            type: String,
            required: [true, "Please set subscription status"],
            enum: ["active", "paused"],
            default: "active"
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Subscription", subscriptionSchema);
