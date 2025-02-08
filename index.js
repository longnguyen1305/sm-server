const express = require("express");
const app = express();
const cors = require("cors");

// Communicate to client

app.use(express.json()); //req.body
app.use(cors());

// ROUTES //

// Register and login

app.use("/auth", require("./routes/jwtAuth"));

// Dashboard

app.use("/dashboard", require("./routes/dashboard"));

// Project

app.use("/project", require("./routes/project"))


app.listen(5000, () => {
    console.log("Server is running on port 5000");
});