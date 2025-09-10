import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    name: { type: String },         // Google name
    email: { type: String, unique: true, required: true }, // unique login
    image: { type: String },        // profile picture
  },
  { timestamps: true } // adds createdAt, updatedAt
);

export default mongoose.models.User || mongoose.model("User", UserSchema);
