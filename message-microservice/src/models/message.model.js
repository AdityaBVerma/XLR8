import mongoose, {Schema} from "mongoose";

const messageSchema = new Schema({
    chatId : {
        type: Schema.Types.ObjectId,
        required : true
    },
    userId : {
        type : Schema.Types.ObjectId,
        required : true
    }, 
    role : {
        type : String,
        enum : ["user", "assistant", "system"]
    },
    content : {
        type: String,
        required: true,
    },
    metadata : {
        type: Schema.Types.Mixed,
        default : {}
    }
}, { timestamps: true});


export const Message = mongoose.model("Message", messageSchema);

/**
 * 
{
    id,
    chatId,
    userId,
    role: "user" | "assistant" | "system",
    content: "text",
    metadata: {
        sources: [],
        tokens: 123
    },
    createdAt
}
 * 
 * 
 */