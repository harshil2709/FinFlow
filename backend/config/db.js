const mongoose = require("mongoose");

let isConnected = false;

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/expense-tracker", {
            serverSelectionTimeoutMS: 2000 // 2 seconds timeout
        });
        console.log(`MongoDB Connected: ${conn.connection.host}`);
        isConnected = true;
    } catch (error) {
        console.warn(`\n⚠️  MongoDB connection refused (${error.message}).`);
        console.warn(`⚠️  Hybrid Fallback Activated: Storing data in local JSON files (/backend/data/*.json).\n`);
        isConnected = false;
    }
};

const getIsConnected = () => isConnected;

module.exports = { connectDB, getIsConnected };
