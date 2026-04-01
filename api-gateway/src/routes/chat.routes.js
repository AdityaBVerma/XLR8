import { Router } from "express";
import { forwardRequest, forwardStream } from "../services/proxy.js";
import { CHAT_SERVICE } from "../config/services.js";
import { verifyJWT } from "../middleware/verifyJWT.js";

const router = Router();

router.use(verifyJWT);

router.use("/:chatId/ask", (req, res) => {
    const targetUrl = CHAT_SERVICE + req.originalUrl.replace(/^\/chat/, "");
    return forwardStream(req, res, targetUrl);
});

router.use((req, res)=>{
    const targetUrl = CHAT_SERVICE + req.originalUrl.replace(/^\/chat/, "");
    return forwardRequest(req, res, targetUrl);
});

export default router;