import mongoose from "mongoose";
// import Friend from "../models/friend.model.js";
import User from "../models/user.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { ApiError } from "../utils/apiError.js";
// import Image from "../models/image.model.js";

const getUserInfo = asyncHandler(async (req, res) => {
  //get the user info  like name, friends, email,images
  console.log("getUser funtion");
  //to do
  //get user info
  //count the no. of doc in friend model with userId1 = searched userId
  //return user info + friendcount

  const { userId } = req.params;
  console.log(userId);
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res
      .status(400)
      .json(new ApiResponse(400, "Invalid userId format", {}));
  }
  try {
    const user = await User.findOne({
      _id: new mongoose.Types.ObjectId(userId),
      role: "admin",
    }).select("-password -refreshToken");
    if (user)
      return res
        .status(200)
        .json(new ApiResponse(200, " u cannot access another admin ", {}));


    const userInfo = await User.aggregate([
      // Match the specific user by ObjectId
      {
        $match: {
          _id: new mongoose.Types.ObjectId(userId),  
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
    
    

    return res.status(200).json(
      new ApiResponse(200, "user fetched successfully", {
        userInfo,
      })
    );
  } catch (error) {
    throw new ApiError(
      500,
      error.message || "Internal server error || getUsers route",
      error
    );
  }
});

// const searchUsers = asyncHandler(async (req, res) => {
//   //to do
//   //get search parms
//   //serch in User model for similar names
//   //return all matched names
//   console.log("searchUsers");

//   const { searchParams } = req.params;

//   try {
//     const result = await User.find({
//       username: {
//         $regex: searchParams,
//         $options: "i",
//       },
//     }).select("username ");

//     return res.status(200).json(new ApiResponse(200, "search success", result));
//   } catch (error) {
//     throw new ApiError(
//       500,
//       error.message || "Internal server error || searchUsers route",
//       error
//     );
//   }
// });

const getAdminDashboard = asyncHandler(async (req, res) => {
  //todo
  //get all the user list

  try {
    const users = await User.find({ role: "user" }).select(
      "-password -refreshToken"
    );
    return res
      .status(200)
      .json(new ApiResponse(200, "users fetched successfully", users));
  } catch (error) {
    throw new ApiError(
      500,
      error.message || "Internal server error || searchUsers route",
      error
    );
  }
});

export { getUserInfo,   getAdminDashboard };
