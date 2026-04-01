import asyncHandler from "../utils/asyncHandler.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.model.js"
import jwt from "jsonwebtoken"
import { aj } from "../app.js"

const generateAccessAndRefreshToken = async (userid) =>{
    try {
        const user = await User.findById(userid)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()
        user.refreshToken = refreshToken
        await user.save({validateBeforeSave: false})
        return {accessToken, refreshToken}
    } catch (error) {
        throw new ApiError(500, "Unable to generate access and refresh tokens")
    }
}

const registerUser = asyncHandler(async (req, res) => {
    const redisClient = req.app.locals.redis
    const {username, email, fullName, password} = req.body

    if([username, email, fullName, password].some((field) => !field || field.trim() === "")){
        throw new ApiError(400, "All fields are required")
    }

    const decision = await aj.protect(req, {email})
    if (decision.isDenied()) {
        throw new ApiError(403, "Email blocked")
    }

    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    })

    if(existedUser){
        throw new ApiError(400, "User already exists")
    }

    const user = await User.create({
        fullName: fullName.trim(),
        email: email.toLowerCase().trim(),
        username: username.toLowerCase().trim(),
        password,
    })

    const createdUser = await User.findById(user._id).select("-password -refreshToken")

    if(!createdUser){
        throw new ApiError(400, "Error creating user")
    }

    await redisClient.setEx(`user:${createdUser._id}`, 3600, JSON.stringify(createdUser))

    return res.status(201).json(
        new ApiResponse(201, createdUser, "User created successfully")
    )
})

const loginUser = asyncHandler(async (req, res) => {
    const redisClient = req.app.locals.redis
    const {username, email, password} = req.body

    const user = await User.findOne({
        $or: [{username}, {email}]
    })

    if (!user) {
        throw new ApiError(404, "User not found")
    }

    const isPasswordCorrect = await user.isPasswordCorrect(password)

    if (!isPasswordCorrect) {
        throw new ApiError(400, "Invalid credentials")
    }

    const {refreshToken, accessToken} = await generateAccessAndRefreshToken(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    await redisClient.setEx(`user:${loggedInUser._id}`, 3600, JSON.stringify(loggedInUser))

    const options = {
        httpOnly: true,
        secure: true
    }
    // console.log(accessToken);
    // console.log(refreshToken);

    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(
            200,
            {
                user: loggedInUser,
                accessToken,
                refreshToken
            },
            "User logged in successfully"
        )
    )
})

const logoutUser = asyncHandler(async (req, res) => {
    // console.log(req)
    const user = JSON.parse(req.headers["x-user"]);
    await User.findByIdAndUpdate(
        user._id,
        {
            $unset: { refreshToken: 1 }
        },
        { new: true }
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged out"))
})

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if(!incomingRefreshToken){
        throw new ApiError(400, "Refresh token required")
    }

    try {
        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)

        const user = await User.findById(decodedToken?._id)

        if (!user) {
            throw new ApiError(404, "User not found")
        }

        if (incomingRefreshToken !== user.refreshToken) {
            throw new ApiError(401, "Invalid refresh token")
        }

        const {refreshToken: newRefreshToken, accessToken} = await generateAccessAndRefreshToken(user._id)

        const options = {
            httpOnly: true,
            secure: true
        }

        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", newRefreshToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    accessToken,
                    refreshToken: newRefreshToken
                },
                "Token refreshed"
            )
        )
    } catch (error) {
        throw new ApiError(400, error?.message || "Refresh failed")
    }
})

const changeCurrentPassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body

    const user = await User.findById(req.user._id)

    if (!user) {
        throw new ApiError(404, "User not found")
    }

    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if (!isPasswordCorrect) {
        throw new ApiError(400, "Incorrect password")
    }

    user.password = newPassword
    user.refreshToken = null

    await user.save({validateBeforeSave: false})

    return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed"))
})

const getCurrentUser = asyncHandler(async (req, res) => {
    const redisClient = req.app.locals.redis
    const userdecoded = JSON.parse(req.headers["x-user"]);
    const cachedUser = await redisClient.get(`user:${userdecoded._id}`)

    if (cachedUser) {
        return res
        .status(200)
        .json(new ApiResponse(200, JSON.parse(cachedUser), "User fetched (cache)"))
    }

    const user = await User.findById(userdecoded._id).select("-password -refreshToken")

    await redisClient.setEx(`user:${user._id}`, 3600, JSON.stringify(user))

    return res
    .status(200)
    .json(new ApiResponse(200, user, "User fetched"))
})

const updateAccountDetails = asyncHandler(async (req, res) => {
    const redisClient = req.app.locals.redis
    const {fullName, email} = req.body
    const userdecoded = JSON.parse(req.headers["x-user"]);

    if (!fullName || !email) {
        throw new ApiError(400, "All fields required")
    }

    const updatedUser = await User.findByIdAndUpdate(
        userdecoded._id,
        {
            $set: { fullName, email }
        },
        { new: true }
    ).select("-password -refreshToken")

    await redisClient.del(`user:${updatedUser._id}`)

    return res
    .status(200)
    .json(new ApiResponse(200, updatedUser, "Updated successfully"))
})

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails
}