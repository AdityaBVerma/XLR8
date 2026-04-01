import { Router } from "express";
import {
  createChat,
  getChats,
  getChatById,
  askChat,
  deleteChat,
  updateChatTitle
} from "../controllers/chat.controller.js";

const router = Router();

// Create a new chat
router.post("/", createChat);

// Get all chats for a user
router.get("/", getChats);

// Get a single chat by ID
router.get("/:chatId", getChatById);

// Core endpoint (LLM + top-k + streaming)
router.post("/:chatId/ask", askChat);

// Update chat title
router.patch("/:chatId", updateChatTitle);

// Delete a chat
router.delete("/:chatId", deleteChat);

export default router;