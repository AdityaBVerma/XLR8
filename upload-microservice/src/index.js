import dotenv from "dotenv";
dotenv.config(); 
import { app } from "./app.js"
import connectDB from "./db/index.js"
import { initpostgre } from "./vector/init.js";

connectDB()
.then(async () => {
    await initpostgre();
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
