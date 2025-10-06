import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  email: { type: String, unique: true, required: true },
  passwordHash: { type: String },
  otp: { type: String },
  otpExpiry: { type: Date },
});

// ESM export
const User = mongoose.model("User", userSchema);
export default User;
