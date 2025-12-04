import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  email: { type: String, unique: true, required: true },
  name: { type: String, required: true },     // user's Google display name
  googleId: { type: String, unique: true },  // unique Google ID
}, { timestamps: true });                      // adds createdAt & updatedAt automatically

const User = mongoose.model("User", userSchema);
export default User;
