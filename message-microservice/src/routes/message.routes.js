import {Router} from 'express';
import { getMessages, createMessage } from '../controllers/message.controller.js';

const router = Router();

router.post("/", createMessage);
router.get("/:chatId", getMessages);

export default router;