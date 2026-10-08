import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true, },
        email: { type: String, required: true, unique: true, lowercase: true, trim: true, },
        password: { type: String, required: true, },
    },
    { timestamps: true, }
);

// Prevent re-compilation error in Next.js
const User = mongoose.models.User || mongoose.model("User", UserSchema);

export default mongoose.models.User ||
    mongoose.model("User", UserSchema);