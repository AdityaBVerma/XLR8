import { app } from "./app.js"
import connectDB from "./db/index.js"
import connectRedis from "./cache/index.js"
import dotenv from "dotenv"

dotenv.config({
    path: "./.env"
})

connectDB()
.then(() => connectRedis())
.then(redisClient => {
    app.locals.redis = redisClient
    app.on("error", (error) => {
        console.log("Error :", error)
        throw error
    })
    app.get("/test", (req, res) => {
        res.send("Hello dev")
    })
    app.get("/test-redis", async (req, res) => {
        await redisClient.set("hello", "world")
        const value = await redisClient.get("hello")
        res.send(`Value from Redis: ${value}`)
    })
    app.listen(process.env.PORT || 3000, () => {
        console.log(`※※ App is listening on port ※※ ${process.env.PORT || 3000}`)
    })
})
.catch(error => {
    console.log("Connection error at ./src/index.js", error)
})
