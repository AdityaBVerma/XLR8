import { ApiError } from "../util/ApiError.js"
import axios from "axios"

export const forwardRequest = async (req, res, targetUrl) => {
    try {
        const response = await axios({
            method: req.method,
            url : targetUrl,
            params : req.query,
            data : req.body,
            // data : {...req.body, user:req?.user}, could do this but its going in the body
            headers :{
                ...(req.headers.authorization && {
                    Authorization: req.headers.authorization
                }),
                ...(req.headers.cookie && {
                    Cookie: req.headers.cookie
                }),
                ...(req.user && {
                    "x-user": JSON.stringify(req.user)
                })
            }
        })
        if (response.headers["set-cookie"]) {
            res.setHeader("set-cookie", response.headers["set-cookie"]);
        }
        console.log("hi")
        return res.status(response.status).json(response.data);
    } catch (error) {
        // console.log(error.response.data)
        // console.log(error.response)
        const message =
            error.response?.data || "service error"
        throw new ApiError(
            error.response?.status || 500,
            message + " Proxy request falied"
        );
    }
}

export const forwardStream = async(req, res, targetUrl) => {
    try {
        const response = await axios({
            method: req.method,
            url : targetUrl,
            params : req.query,
            data : req.body,
            responseType : "stream",
            headers : {
                ...(req.headers.authorization && {
                    Authorization: req.headers.authorization
                }),
                ...(req.headers.cookie && {
                    Cookie: req.headers.cookie
                }),
                ...(req.user && {
                    "x-user": JSON.stringify(req.user)
                })
            }
        });
        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache");
        res.setHeader("Connection", "keep-alive");
        response.data.pipe(res);
    } catch (error) {
        const message =
            error.response?.data || "service error"
        throw new ApiError(
            error.response?.status || 500,
            message + " Streaming request failed"
        );
    }
}

export const forwardUpload = async (req, res, targetUrl) => {
    try {
        const response = await axios({
            method: req.method,
            data: req,
            url: targetUrl,
            params: req.query,
            headers: {
                ...req.headers,
                ...(req.headers.authorization && {
                    Authorization: req.headers.authorization
                }),
                ...(req.user && {
                    "x-user": JSON.stringify(req.user)
                })
            }
        })
        return res.status(response.status).json(response.data);
    } catch (error) {
        const message =
            error.response?.data || "service error"
        throw new ApiError(
            error.response?.status || 500,
            message + " Upload proxy error"
        );
    }
}