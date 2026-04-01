import { Router } from "express";
import { forwardRequest } from "../services/proxy.js";
import { WORKSPACE_SERVICE } from "../config/services.js";
import { verifyJWT } from "../middleware/verifyJWT.js";

const router = Router();

router.use(verifyJWT);
/**
 * WARN:
 * Dont use this as of Now
 * No underlying service is created regarding this
 */
router.use((req, res)=>{
    const targetUrl = WORKSPACE_SERVICE + req.originalUrl.replace(/^\/workspace/, "");
    return forwardRequest(req, res, targetUrl);
});

export default router;