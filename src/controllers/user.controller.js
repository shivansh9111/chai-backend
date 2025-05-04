import {asynchandler} from "../utils/asynchandler.js"
import {apierror} from "../utils/apierror.js"
import { User } from "../models/user.models.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { apiResponse } from "../utils/apiresponse.js"
import jwt from  "jsonwebtoken"
import mongoose from "mongoose"

const generateAccessAndRefreshTokens= async (userId)=>{
try {
   const user = await User.findById(userId)
  const accessToken =  user.generateAccessToken()
  const refreshToken =  user.generateRefreshToken()

  user.refreshToken=refreshToken
 await user.save({validateBeforeSave:false})

 return {accessToken,refreshToken}
  
} catch (error) {
  throw new apierror(500,"something went wrong while generating access and refresh token")
}



}


const registerUser = asynchandler( async (req,res)=> {

  // res.status(200).json({
  //   message: "shivansh dwivedi"
  // })

  //get user details from frontend
  //validation not- empty
  //check if user already exixts:username,email
  //check for images check for avatar
  // upload them to cloudinary avatar
  // create user object -- create entry in database
  // remove password and refresh token field from response
  // check for user creation
  // return response

  const {username,fullName,email,password} =req.body
  //console.log("email:",email);

  // if(fullName === ""){
  //   throw new apierror(400,"fullname is required")
  // }
// this is production based code or you can do it like above one ex one by one
  if(
    [
      username,fullName,email,password
    ].some((field) => field?.trim() === "")
  )
  {throw new apierror(400, "all fields are required")}


 const existedUser= await User.findOne({
   $or:[{username},{email}]
  })
  if(existedUser){
    throw new apierror(409,"username or email is already exists")
  }

 const avatarLocalPath = req.files?.avatar[0]?.path
// const coverImageLocalPath = req.files?.coverImage[0]?.path

let coverImageLocalPath ;
if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.Length>0){
  coverImageLocalPath = req.files.coverImage[0].path
}

 if(!avatarLocalPath){
  throw new apierror(400,"avatar file is required")
 }
 

const avatar = await uploadOnCloudinary (avatarLocalPath)
const coverImage = await uploadOnCloudinary(coverImageLocalPath)

if(!avatar){
  throw new apierror(400,"avatar file is required")
}

const user = await User.create({
  fullName,
  avatar:avatar.url,
  coverImage:coverImage?.url || "",
  email,
  password,
  username:username.toLowerCase()
})
const createdUser = await User.findById(user._id).select("-password -refreshToken")

if(!createdUser){
  throw new apierror(500,"something went wrong while registering the user")
}

return  res.status(201).json(
  new apiResponse(200, createdUser ,"user registered succesfully")
)
})

const loginUser = asynchandler(async (req,res) => {
//req body data
// username or email
// find the user
// password check
// access or refresh token
// send cookie

const {email, username , password} = req.body

if(!username && !email){
  throw new apierror(400,"atleast one field is required")
}

    // Here is an alternative of above code based on logic discussed in video:
    // if (!(username || email)) {
    //     throw new ApiError(400, "username or email is required")
        
    // }

const user =await User.findOne({
  $or:[{username},{email}]
  
})
if (!user){
  throw new apierror(404,"user does not exist")
}


const isPasswordValid = await user.isPasswordCorrect(password)

if(!isPasswordValid){
  throw new apierror(401,"incorrect password")
}

const {accessToken,refreshToken}=await generateAccessAndRefreshTokens(user._id)

const loggedInUser=await User.findById(user._id).select("-password -refreshToken")

const options = {
  httponly:true,
  secure:true
}

return res.status(200)
.cookie("accessToken",accessToken,options)
.cookie('refreshToken',refreshToken,options)
.json(
  new apiResponse(200,{
    user:loggedInUser,accessToken,refreshToken
  },"user logged in successfully")
)
})

const logoutUser = (async (req,res)=>{
User.findByIdAndUpdate(req.user._id,
  {$set:{refreshToken:undefined}},
  {new:true}
)
const options = {
  httponly:true,
  secure:true
}
return res.status(200)
.clearCookie("accessToken", options)
.clearCookie("refreshToken",options)
.json(new apiResponse(200,{},"User LoggedOut Successfully"))
}) 


const refreshAccessToken= asynchandler(async(req,res) => {
 const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

 if(!incomingRefreshToken){
  throw new apierror(401,"unauthorised request")
 }

try {
   const decodedToken = jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET)
  
   const user = await User.findById(decodedToken?._id) 
   if (!user){
    throw new apierror(401,"invalid refresh token")
   }
  
   if(incomingRefreshToken!==user?.refreshToken){
    throw new apierror(401,"refresh token is expired")
   }
  
   const options ={
    httpOnly:true,
    secure:true
   }
   const {accessToken,newrefreshToken}=await generateAccessAndRefreshTokens(user._id)
  
   return res
   .status(200)
   .cookie("accessToken",accessToken,options)
   .cookie("refershToken",newrefreshToken,options)
  .json(
    new apiResponse(
      200,
      {accessToken,refreshToken:newrefreshToken},
      "access token refreshed successfully"
    )
  )
} catch (error) {
  throw new apierror(401,error?.message || "invalid refresh token")
}
})


const changeCurrentPassword = asynchandler(async (req,res) => {

  const {oldPassword,newPassword} = req.body

  const user = await User.findById(req.user?._id)

 const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

 if(!isPasswordCorrect){
  throw new apierror(400,"invalid password")
 }
 user.password=newPassword
await user.save({validateBeforeSave:false})

return res.status(200)
.json(new apiResponse(200,{}, "password changed succesfully"))
})


const getCurrentUser = asynchandler(async () => {
  return res
  .status(200)
  .json(new apiResponse (200,req.user, "current user fetched successfully"))
})



const updateAccountDetails = asynchandler(async (req,res) => {

const {fullName,email} = req.body

if(!fullName || !email){
  throw new apierror(402,"all fields are required")
}
const user = await User.findByIdAndUpdate(
  req.user?._id,
  {
    $set:{
      fullName,
      email:email
    }
  },
  {new:true}
).select("-password")   // by doing this select password will not anywhere

return res
.status(200)
.json(new apiResponse (200,user,"account details updated successfully"))
})



const updateUserAvatar = asynchandler(async (req,res) => {
const avatarLocalPath = req.file?.path
 if(!avatarLocalPath){
  throw new apierror(401,"avatar file is missing")
 }
 const avatar = await uploadOnCloudinary(avatarLocalPath)

 if(!avatar){
  throw new apierror(400,"error while uploading an avatar")
 }

const user = await User.findByIdAndUpdate(req.user?._id,
{
  $set:{
    avatar:avatar.url
  }
},
{new:true}
 ).select("-password")

 return res
 .status(200)
 .json(new apiResponse(200,user,"avatar updated successfully"))
})


const updateCoverImage = asynchandler(async()=> {
  const coverImageLocalPath = req.file?.path

  if(!coverImageLocalPath){
    throw new apierror(401,"cover image file is missing")
  }
  const coverImage = uploadOnCloudinary(coverImageLocalPath)

  if(!coverImage){
    throw new apierror(401,"error while ulpoading the coverimage")
  }

  const user = User.findByIdAndUpdate(req.user?._id,
  {
    $set:{
      coverImage:coverImage.url
    }
  },
  {new : true}
  ).select("-password")

  return res
  .status(200)
  .json(new apiResponse (200, user , "cover image uploaded successfully"))
})


const getUserChannelProfile = asynchandler(async (req,res) => {
const {username} = req.params

if(!username?.trim()){
  throw new apierror(400,"username is missing")
}

const channel =await User.aggregate([
  {
    $match:{
      username: username?.toLowerCase()
    }
  },
  {
    $lookup:{
     from:"subscriptions",
     localField:"_id",
     foreignField:"channel",
     as:"subscribers"
    }
  },
  {
   $lookup:{
    from:"subscriptions",
     localField:"_id",
     foreignField:"subscriber",
     as:"subscribeTo"
   }
  },
  {
    $addFields:{
      subscriberCount:{
        $size:"$subscribers"
      },

      channelSubscribedToCount:{
        $size:"subscribedTo"
      },

      isSubscribed:{
        $cond:{
          if:{$in:[req.user?._id, "$subscribers.subscriber"] },
          then: true,
          else:false
        }
      }
    }
  },

{
  $project:{
    username:1,
    fullName:1,
    subscriberCount:1,
    channelSubscribedToCount:1,
    isSubscribed:1,
    avatar:1,
    coverImage:1,
    email:1,
    createdAt:1,
  }
}

])

if(!channel?.length){
  throw new apierror(401,"channel does not exist")
}

return res
.status(200)
.json(
   new apiResponse(200, channel[0], "User Channel Fetched Successfully")
)

})


const getWatchHistory = asynchandler(async (req,res) => {
const user = await User.aggregate([
    {
    $match:{
       _id: new mongoose.Types.ObjectId(req.user._id)
    }
    },
    {
      $lookup:{
        from:"videos",
        localField:"watchHistory",
        foreignField:"_id",
        as:"watchHistory",
        pipeline:[
          {
            $lookup:{
              from:"users",
              localField:"owner",
              foreignField:-_id,
              as:"owner",
              pipeline:[
                {
                  $project:{
                    fullName:1,
                    username:1,
                    avatar:1,
                  }
                }
              ]
            }
          },
          {
            $addFields:{
              owner:{
               $first:"$owner" 
              }
            }
          }
        ]
      }
    }
])

return res
.status(200)
.json(
  new apiResponse(200, user[0].watchHistory, "watch history fetched successfully")
)
})



export {registerUser,loginUser,logoutUser,refreshAccessToken,changeCurrentPassword,getCurrentUser,updateAccountDetails,updateUserAvatar,updateCoverImage,getUserChannelProfile,getWatchHistory}