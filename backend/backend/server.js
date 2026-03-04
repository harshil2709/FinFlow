const express = require("express");
const app = express();
const PORT = 5000;

const expenseroutes = require("./routes/expenseroutes");

app.use(express.json());

// connect routes
app.use("/", expenseroutes);

app.listen(PORT, () => {
    console.log("Server running on port 5000");
});