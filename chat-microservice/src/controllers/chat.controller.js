import axios from "axios";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Chat } from "../models/chat.model.js";
import { ApiError } from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { PGVectorStore } from "@langchain/community/vectorstores/pgvector";
import { GoogleGenAI } from "@google/genai";


const embeddings = new GoogleGenerativeAIEmbeddings({
    apiKey: process.env.GEMINI_API_KEY,
    model: "gemini-embedding-001",
    config: { outputDimensionality: 768 },
});

let vectorStore;

export const initVectorStore = async () => {
    vectorStore = await PGVectorStore.initialize(embeddings, {
        postgresConnectionOptions: {
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            port: Number(process.env.DB_PORT)
        },
        tableName: "document_chunks",
        columns: {
            idColumnName: "id",
            vectorColumnName: "embedding",
            contentColumnName: "content",
            metadataColumnName: "metadata",
        },
        distanceStrategy: "cosine",
    });
};

export const getTopKChunks = async (query, k = 5, filter = {}) => {
    if (!vectorStore) {
        throw new Error("Vector store not initialized");
    }

    if (!query) {
        throw new Error("Query is required for retrieval");
    }

    try {
        const results = await vectorStore.similaritySearchWithScore(query, k, filter);

        return results.map(([doc, score]) => ({
            content: doc.pageContent,
            metadata: doc.metadata,
            score
        }));

    } catch (err) {
        console.error("Retrieval error:", err);
        throw err;
    }
};

export const createChat = asyncHandler(async (req, res) => {
    const userDecoded = req.headers["x-user"]
        ? JSON.parse(req.headers["x-user"])
        : null;

    if (!userDecoded || !userDecoded._id) {
        throw new ApiError(401, "Unauthorized");
    }

    const { title } = req.body;
    const userId = userDecoded._id;

    const chat = await Chat.create({
        userId,
        title: title || "New Chat"
    });

    if (!chat) {
        throw new ApiError(400, "Could not create chat");
    }

    return res
        .status(201)
        .json(new ApiResponse(201, chat, "Chat created successfully"));
});

export const getChats = asyncHandler(async (req, res) => {
    const userDecoded = req.headers["x-user"]
        ? JSON.parse(req.headers["x-user"])
        : null;

    if (!userDecoded || !userDecoded._id) {
        throw new ApiError(401, "Unauthorized");
    }

    const userId = userDecoded._id;

    const chats = await Chat.find({ userId })
        .sort({ lastMessageAt: -1 });

    return res
        .status(200)
        .json(new ApiResponse(200, chats, "Chats fetched successfully"));
});

export const getChatById = asyncHandler(async (req, res) => {
    const userDecoded = req.headers["x-user"]
        ? JSON.parse(req.headers["x-user"])
        : null;

    if (!userDecoded || !userDecoded._id) {
        throw new ApiError(401, "Unauthorized");
    }

    const userId = userDecoded._id;
    const { chatId } = req.params;

    if (!chatId) {
        throw new ApiError(400, "chatId is required");
    }

    const chat = await Chat.findOne({ _id: chatId, userId });

    if (!chat) {
        throw new ApiError(404, "Chat not found or unauthorized");
    }

    return res.status(200).json(
        new ApiResponse(200, chat, "Chat fetched successfully")
    );
});

export const askChat = asyncHandler(async (req, res) => {

    const userDecoded = req.headers["x-user"]
        ? JSON.parse(req.headers["x-user"])
        : null;

    if (!userDecoded || !userDecoded._id) {
        throw new ApiError(401, "Unauthorized");
    }

    const userId = userDecoded._id;
    const { chatId } = req.params;
    const { content } = req.body;
    console.log("BODY:", req.body);
    if (!chatId || !content) {
        throw new ApiError(400, "chatId and content are required");
    }

    const chat = await Chat.findOne({ _id: chatId, userId });

    if (!chat) {
        throw new ApiError(404, "Chat not found or unauthorized");
    }

    await axios.post(`${process.env.MESSAGE_SERVICE_URL}/`, {
        chatId,
        userId,
        role: "user",
        content
    });

    const messageRes = await axios.get(
        `${process.env.MESSAGE_SERVICE_URL}/${chatId}?limit=10&page=1`
    );

    const messages = messageRes.data.data;
    // console.log(messages)
    const topKDocs = await getTopKChunks(content, 5, {
        user_id: userId
    });

    const MAX_CONTEXT_CHARS = 3000;

    let context = topKDocs.map(doc => doc.content).join("\n\n");
    if (context.length > MAX_CONTEXT_CHARS) {
        context = context.slice(0, MAX_CONTEXT_CHARS);
    }

    const formattedMessages = messages.map(m => ({
        role: m.role,
        content: m.content
    }));

    const systemPrompt = `
    You are a helpful AI assistant.

    STRICT RULES:
    - Answer ONLY from the provided context
    - If the answer is not in the context, say: "I don't know based on the provided data"
    - Do NOT make up information

    Context:
    ${context}
    `;

    const MAX_HISTORY = 6;

    const contents = [
        {
            role: "user",
            parts: [{ text: systemPrompt }]
        },

        ...formattedMessages.slice(-MAX_HISTORY).map(m => ({
            role: m.role === "assistant" ? "model" : "user",
            parts: [{ text: m.content }]
        }))
    ];


    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    const genAI = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY
    });

    const result = await genAI.models.generateContentStream({
        model: "gemini-2.5-flash",
        contents
    });

    let fullResponse = "";
    // console.log(result);
    for await (const chunk of result) {
        console.log(chunk)
        const text = chunk.text;
        fullResponse += text;

        res.write(`data: ${JSON.stringify({ token: text })}\n\n`);
    }

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();

    await axios.post(`${process.env.MESSAGE_SERVICE_URL}/`, {
        chatId,
        userId,
        role: "assistant",
        content: fullResponse
    });

    chat.lastMessageAt = new Date();
    await chat.save();
});


export const updateChatTitle = asyncHandler(async (req, res) => {
    const userDecoded = req.headers["x-user"]
        ? JSON.parse(req.headers["x-user"])
        : null;

    if (!userDecoded || !userDecoded._id) {
        throw new ApiError(401, "Unauthorized");
    }

    const userId = userDecoded._id;
    const { chatId } = req.params;
    const { title } = req.body;

    if (!chatId || !title) {
        throw new ApiError(400, "chatId and title are required");
    }

    const chat = await Chat.findOneAndUpdate(
        { _id: chatId, userId }, 
        { title },
        { new: true }
    );

    if (!chat) {
        throw new ApiError(404, "Chat not found or unauthorized");
    }

    return res.status(200).json(
        new ApiResponse(200, chat, "Chat title updated successfully")
    );
});

export const deleteChat = asyncHandler(async (req, res) => {
    const userDecoded = req.headers["x-user"]
        ? JSON.parse(req.headers["x-user"])
        : null;

    if (!userDecoded || !userDecoded._id) {
        throw new ApiError(401, "Unauthorized");
    }

    const userId = userDecoded._id;
    const { chatId } = req.params;

    if (!chatId) {
        throw new ApiError(400, "chatId is required");
    }

    const chat = await Chat.findOneAndDelete({
        _id: chatId,
        userId
    });

    if (!chat) {
        throw new ApiError(404, "Chat not found or unauthorized");
    }
    
    // TODO:
    // Call message service to delete all messages of this chat
    // await axios.delete(`${process.env.MESSAGE_SERVICE_URL}/messages/${chatId}`);

    return res.status(200).json(
        new ApiResponse(200, {}, "Chat deleted successfully")
    );
});