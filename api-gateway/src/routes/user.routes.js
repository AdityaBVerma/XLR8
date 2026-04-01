import { Router } from "express";
import { forwardRequest } from "../services/proxy.js";
import { USER_SERVICE } from "../config/services.js";
import { verifyJWT } from "../middleware/verifyJWT.js";

const router = Router();

const publicRoutes = ["/register", "/login", "/refresh"];

router.use((req, res, next)=>{
    if(publicRoutes.some(route => req.path === route || req.path.startsWith(route+'/'))){
        return next();
    }
    return verifyJWT(req, res, next);
})

router.use((req, res)=>{
    const targetUrl = USER_SERVICE + req.originalUrl.replace(/^\/user/, "");
    console.log(targetUrl);
    return forwardRequest(req, res, targetUrl);
})

export default router