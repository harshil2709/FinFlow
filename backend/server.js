const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { connectDB } = require("./config/db");
const { initRedis } = require("./config/redis");
const expenseroutes = require("./routes/expenseroutes");

// Load env vars
dotenv.config();

// Connect to MongoDB & Redis Cache
connectDB();
initRedis();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use("/api", expenseroutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});