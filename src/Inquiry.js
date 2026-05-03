import mongoose from "mongoose";

const inquirySchema = new mongoose.Schema({
    name: { type: String, required: true },
    title: { type: String, required: true },
    content: { type: String, required: true },
    secret: { type: Boolean, default: false },
    password: String,
    answer: String,
    answeredAt: Date,
    createdAt: { type: Date, default: Date.now },
    views: { type: Number, default: 0 },
});

export default mongoose.model("Inquiry", inquirySchema);