import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  email: { type: String, unique: true, required: true },

  // For normal login
  passwordHash: { type: String },

  // OTP login
  otp: { type: String },
  otpExpiry: { type: Date },

  // OAuth fields
  googleId: { type: String },
  githubId: { type: String },

  name: { type: String },
  avatar: { type: String },
});

// ESM export
const User = mongoose.model("User", userSchema);
export default User;
