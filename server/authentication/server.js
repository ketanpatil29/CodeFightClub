const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config();
const app = express();

app.use(express.json());

mongoose.connect("mongodb://ketan:ketanvsmongodb@127.0.0.1:27017/codeFightClub?authSource=admin")
    .then(() => console.log("Database connected"))
    .catch(err => console.log(err));

app.listen(5000, () => console.log("Server running on port 5000"));