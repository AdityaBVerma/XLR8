import cookieParser from "cookie-parser"
import express from "express"
import cors from "cors"
import arcjet, { validateEmail } from "@arcjet/node";

const app = express()

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))
app.use(express.json({limit: "16kb"}))
app.use(express.urlencoded({extended: true, limit: "16kb"}))
app.use(cookieParser())


export const aj = arcjet({
    key: process.env.ARCJET_KEY,
    rules: [
    validateEmail({
        mode: "LIVE",
        deny: ["DISPOSABLE", "INVALID", "NO_MX_RECORDS"],
    }),
    ],
});


import userRouter from "./routes/user.routes.js"

app.use(userRouter)

export {app}