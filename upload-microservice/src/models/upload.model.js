import mongoose, { Schema } from "mongoose";

const docSchema = new Schema({
    title: {
        type: String,
        required: true
    },
    ownerId: {
        type: Schema.Types.ObjectId,
        required: true
    },
    docfile: {
        url: {
            type: String,
            required: true
        },
        public_id: {
            type: String,
            required: true
        }
    }
}, { timestamps: true });

export const Doc = mongoose.model("Doc", docSchema);