import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

app.use(cors());

app.use(cookieParser());
app.use((req, res, next) => {
    if (req.path.startsWith("/upload")) {
        return next();
    }
    express.json()(req, res, next);
});


import chatRoutes from "./routes/chat.routes.js";
import uploadRoutes from "./routes/upload.routes.js";
import userRoutes from "./routes/user.routes.js";
import workspaceRoutes from "./routes/workspace.routes.js";
import messageRoutes from "./routes/message.routes.js";


app.use("/workspace", workspaceRoutes);
app.use("/user", userRoutes);
app.use("/chat", chatRoutes);
app.use("/upload", uploadRoutes);
app.use("/message", messageRoutes);

app.get("/health", (req, res) => {
    res.json({ status: "Gateway running" });
});


export default app;
