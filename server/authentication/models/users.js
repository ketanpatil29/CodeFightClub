import mongoose from "mongoose";

const providerSchema = new mongoose.Schema({
  provider: { type: String, required: true },    // google / github
  providerId: { type: String, required: true },  // sub / GitHub ID
});

const userSchema = new mongoose.Schema({
  email: { type: String, unique: true, required: true },

  userName: { type: String },  // <-- REQUIRED for OAuth
  avatar: { type: String },    // <-- store Google/GitHub picture

  oauthProviders: [providerSchema],  // <-- REQUIRED for OAuth

  passwordHash: { type: String },
  otp: { type: String },
  otpExpiry: { type: Date },
});

export default mongoose.model("User", userSchema);
