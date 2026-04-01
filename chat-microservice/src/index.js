import { app } from "./app.js"
import { initVectorStore } from "./controllers/chat.controller.js"
import connectDB from "./db/index.js"
import dotenv from "dotenv"

dotenv.config({
    path: "./.env"
})

connectDB()
.then(async () => {
    await initVectorStore();
    app.on("error", (error) => {
        console.log("Error :", error)
        throw error
    })
    app.get("/test", (req, res) => {
        res.send("Hello dev")
    })
    app.listen(process.env.PORT || 3000, () => {
        console.log(`※※ App is listening on port ※※ ${process.env.PORT || 3000}`)
    })
})
.catch(error => {
    console.log("Connection error at ./src/index.js", error)
})
