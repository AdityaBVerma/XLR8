import mongoose, { Schema } from "mongoose";

const chatSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        required: true,
        index: true
    },
    title: {
        type: String,
        default: "New Chat",
        trim: true
    },
    lastMessageAt: {
        type: Date,
        default: Date.now,
        index: true
    },
    metadata: {
        type: Schema.Types.Mixed,
        default: {}
        /*
        Example:
        {
            model: "gpt-4",
            temperature: 0.7,
            topK: 5,
            systemPrompt: "You are a helpful assistant"
        }
        */
    }

}, { timestamps: true });

export const Chat = mongoose.model("Chat", chatSchema);