import { Router } from "express";
import { forwardUpload } from "../services/proxy.js";
import { UPLOAD_SERVICE } from "../config/services.js";
import { verifyJWT } from "../middleware/verifyJWT.js";

const router = Router();

router.use(verifyJWT);

router.use((req, res)=>{
    const targetUrl = UPLOAD_SERVICE + req.originalUrl.replace(/^\/upload/, "");
    return forwardUpload(req, res, targetUrl);
});

export default router;