import { asyncHandler } from "../utils/asyncHandler.js";
import User from "../models/user.model.js";
import { ApiError } from "../utils/apiError.js";
import {ApiResponse} from "../utils/apiResponse.js"
import jwt from "jsonwebtoken"
import Image from "../models/image.model.js";
import mongoose from "mongoose";

const generateAccessAndRefreshToken = async (userId,req) => {
  console.log(req.originalUrl || " nonoenoeno")
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    // console.log(error);
    throw new ApiError(500, "Failed to generate access and refresh token");
  }
};

const signup = asyncHandler(async (req, res) => {
  //to do
  //get user credentials and validate
  //check for existing user
  //create user
  //genrate access and refresh token
  //return the new created user with the tokens
  const { username, email, password,role,socialHandleName } = req.body; 
  // console.log(username,email,password)

  if (!username || !email || !password)
    return res.status(400).json({ message: "All fields are required" });

  if(password.length < 6)
    return res.status(400).json({ message: "Password must be at least 6 characters" });

 try {
   const existingUser = await User.findOne({
     $or: [{ email }, { username }],
   });
   if (existingUser)
     return res.status(400).json({ message: "User already exists" });
 
   const user = await User.create({ username, email, password,role: role || 'user' ,socialHandleName}) 
 
   if (!user) throw new ApiError(500, "Failed to create user");
 
   const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
     user._id,
     req
   );
 
   return res
     .status(201)
     .cookie("refreshToken", refreshToken, {
       httpOnly: true,
       secure: true,
       sameSite: "strict",
     })
     .cookie("accessToken", accessToken, {
       httpOnly: true,
       secure: true,
       sameSite: "strict",
     })
     .json(
       new ApiResponse(201, "User created successfully", {
         accessToken,
         refreshToken,
         user,
       })
     );
 } catch (error) {
  throw new ApiError(500, error.message || " Internal server error || SignUp route",error)
 }
});

const login = asyncHandler(async (req, res) => {
  //to do 
  //get user credentils and validate
  //compare password
  //return logged user data except password and refreshtoken
  const { username, password } = req.body;

  // Validate input fields
  if (!username || !password)
    return res.status(400).json({ message: "All fields are required" });
  
  // Find the user by username
  const user = await User.findOne({ username });
  if (!user) {
    return res.status(400).json({ message: "User does not exist" });
  }
  
  // Compare the entered password with the stored hashed password
  const isPasswordCorrect = await user.comparePassword(password);
  if (!isPasswordCorrect) {
    return res.status(400).json({ message: "Wrong password" });
  }
  
  // Generate access and refresh tokens
  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id, req);
  
  // Select the fields to return, excluding password and refreshToken
  const loggedInUser = await User.findById(user._id).select("-password -refreshToken");
  
  // Set cookies to store the tokens and role
  return res
    .status(200)
    .cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: true,  // Ensure secure cookies in production
      sameSite: "strict",
    })
    .cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: true,  // Ensure secure cookies in production
      sameSite: "strict",
    })
    .cookie("role", user.role, {  // Store the role in a cookie
      httpOnly: true,
      secure: true,  // Ensure secure cookies in production
      sameSite: "strict",
    })
    .json(
      new ApiResponse(200, "Login successful", { loggedInUser, accessToken, refreshToken })
    );
  
});

const getProfile = asyncHandler(async (req, res) => {
  //to do
  //get current user 
  //fetch user data from DB 
  //count no. of friends and request
  //return profile
   
  const userInfo = await User.aggregate([
    // Match the specific user by ObjectId
    {
      $match: {
        _id: new mongoose.Types.ObjectId(req.user._id),  
      },
    },
    // Perform a lookup to join the "image" collection
    {
      $lookup: {
        from: "images", 
        localField: "_id",  
        foreignField: "userId",  
        as: "images",  
      },
    }, 
    {
      $addFields:{
        images:"$images.images"
      }
    },
    {
      $unwind:{
        path:"$images",
        preserveNullAndEmptyArrays: true,
      }
    },
    // Optionally, project specific fields from the User and Image collections
    {
      $project: {
        _id: 1,  
        username: 1,  
        email: 1, 
        socialHandleName: 1, 
        role: 1, 
        images: 1, 
      },
    },
  ]);
  
  

  return res
  .status(200)
  .json(new ApiResponse(200,"Profile fetched successfully",{userInfo}));
});

const getAdminProfile= asyncHandler(async (req, res) => {
  
  const userInfo = await User.findOne(req.user._id)
  
  

  return res
  .status(200)
  .json(new ApiResponse(200,"Admin Profile fetched successfully",{userInfo}));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  console.log("in refersh token");
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;
    // console.log("icoming referesh token ---->",incomingRefreshToken)
  if (!incomingRefreshToken) {
    return res.status(401).json({ message: "Unauthorized request" });

  }
  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_SECRET
    );
  //  console.log("docodes token ---->",decodedToken)
    const user = await User.findById(decodedToken._id);
    // console.log("userInfo ---->",user)

    if (!user) {
      // console.log("invalid user")
      return res.status(401).json({ message: "Invalid refresh token" });
}
// console.log("check user done")

    if (incomingRefreshToken !== user.refreshToken) {
      return res.status(401).json({ message: "Refresh token is expired or used" });

    }

    // console.log("check user2 done")

    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
      user._id,
      req
    );

    console.log(
      accessToken,
      refreshToken
    )
    res
      .status(200)
      .cookie("accessToken", accessToken, { httpOnly: true, secure: true })
      .cookie("refreshToken", refreshToken, { httpOnly: true, secure: true })
      .json(
        new ApiResponse(
          200,
          "Access token refreshed",
          { accessToken, refreshToken },
        )
      );
  } catch (error) {
    throw new ApiError(
      401,
      error.message || "Invalid or expired refresh token",
      error
    );
  }
});

export { signup, login, getProfile, getAdminProfile,refreshAccessToken };
