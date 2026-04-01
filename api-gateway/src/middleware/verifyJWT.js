import jwt from 'jsonwebtoken';
import asyncHandler from '../util/asyncHandler.js';
import { ApiError } from '../util/ApiError.js';

export const verifyJWT = asyncHandler(async(req, _, next) => {
    // console.log(req)
    const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ","")

    if(!token){
        throw new ApiError(401, "Unauthorized request or access token not provided");
    }

    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    
    req.user = decoded;
    // console.log(decoded)
    // console.log(req.user)
    next();
})