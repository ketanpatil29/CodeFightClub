const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    email: { type: String, unique: true, required: true },
    passwordHash: { type: String },
    otp: { type: String },
    otpExpiry: { type: Date }
});

module.exports = mongoose.model("User", userSchema);