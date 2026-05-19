import mongoose from "mongoose";

const profileSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    username: { type: String, required: true },
    name: { type: String, default: '' },
    age: { type: Number, default: null },
    phone: { type: String, default: '' },
    address: { type: String, default: '' },
    email: { type: String, default: '' },
    memo: { type: String, default: '' },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

export default mongoose.model("Profile", profileSchema);