import { ApiResponse } from "../utils/ApiResponse.js";
import { Message } from "../models/message.model.js";
import { ApiError } from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";

export const createMessage = asyncHandler(async (req, res) => {
    const redisClient = req.app.locals.redis
    const {chatId, userId, role, content, metadata} = req.body;

    if(!chatId || !userId || !role || !content){
        throw new ApiError(400, "chatId, userId and content are required")
    }
    const allowableRoles = ['user', 'assistant'];
    const safeRole = allowableRoles.includes(role) ? role : 'user';
    
    const message = await Message.create({
        chatId,
        userId,
        role: safeRole,
        content,
        metadata,
    })
    if(!message){
        throw new ApiError(400, "couldn't create the message");
    }
    const keys = await redisClient.keys(`chat:${chatId}:*`);
    if (keys.length > 0) {
        await redisClient.del(keys);
    }
    return res.status(201).json(new ApiResponse(201, message, "Message created successfully"))
});

export const getMessages = asyncHandler( async (req, res) => {
    const redisClient = req.app.locals.redis;
    const { chatId } = req.params;
    const { limit = 10, page = 1 } = req.query;
    const limitNum = parseInt(limit);
    const pageNum = parseInt(page);
    const skip = (pageNum - 1) * limitNum;

    if (!chatId) {
        throw new ApiError(400, "chatId is required");
    }

    const cacheKey = `chat:${chatId}:page:${pageNum}:limit:${limitNum}`;
    const cached = await redisClient.get(cacheKey);
    if (cached) {
        const parsed = JSON.parse(cached);
        return res.status(200).json(
            new ApiResponse(200, parsed, "Messages fetched (cache)")
        )
    }

    const messages = await Message.find({chatId})
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum);

    if(!messages.length){
        throw new ApiError(404, "No messages found");
    }
    const result = [...messages].reverse();
    await redisClient.set(cacheKey, JSON.stringify(result), "EX", 300);
    return res.status(200).json(
        new ApiResponse(200, result, "Messages fetched")
    )
});