import { createClient } from "redis"

const connectRedis = async () => {
    try {
        const redisClient = createClient({
            url: process.env.REDIS_URL || "redis://localhost:6379"
        })

        redisClient.on("error", (err) => console.error("Redis Client Error", err))

        await redisClient.connect()
        console.log("※※ REDIS Connection established ※※")

        return redisClient
    } catch (error) {
        console.error("REDIS connection failed at db/redis.js:", error)
        process.exit(1)
    }
};

export default connectRedis
