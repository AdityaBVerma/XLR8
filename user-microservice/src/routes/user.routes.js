import { Router } from "express";
import { 
    registerUser, 
    loginUser, 
    logoutUser, 
    refreshAccessToken, 
    changeCurrentPassword, 
    getCurrentUser, 
    updateAccountDetails 
} from "../controllers/user.controller.js"


const router = Router()

router.route("/register").post( registerUser)

router.route("/login").post( loginUser)

router.route("/logout").post( logoutUser)

router.route("/refresh").post(refreshAccessToken)

router.route("/change-password").patch(changeCurrentPassword)

router.route("/current-user").get( getCurrentUser)

router.route("/update-account").patch( updateAccountDetails)


export default router
