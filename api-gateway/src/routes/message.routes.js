import { Router } from "express";
import { forwardRequest } from "../services/proxy.js";
import { MESSAGE_SERVICE } from "../config/services.js";
import { verifyJWT } from "../middleware/verifyJWT.js";

const router = Router();

router.use(verifyJWT);
/**
 * TODO: restrict the user to access this from the frontend
 * Dont use this from the frontend
 */
router.use((req, res)=>{
    const targetUrl = MESSAGE_SERVICE + req.originalUrl.replace(/^\/message/, "");
    return forwardRequest(req, res, targetUrl);
});

export default router;