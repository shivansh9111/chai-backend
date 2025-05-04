import { Router } from "express";
import { changeCurrentPassword, getCurrentUser, getUserChannelProfile, getWatchHistory, loginUser, logoutUser, registerUser, updateAccountDetails, updateCoverImage, updateUserAvatar } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { refreshAccessToken } from "../controllers/user.controller.js";
const router = Router()

router.route("/register").post(
  upload.fields([
    {name:"avatar",
      maxCount:1
    },
    {
      name:"coverImage",
      maxCount:1
    }
  ]),
  registerUser)

  router.route("/Login").post(loginUser)

  //secured routes
  router.route("/logout").post(verifyJWT , logoutUser)
 router.route("/refresh-Token").post(refreshAccessToken)
 router.route("/change-password").post(verifyJWT, changeCurrentPassword)
 router.route("/current-user").get(verifyJWT,getCurrentUser)
 router.route("/update-details").patch(verifyJWT , updateAccountDetails)

 router.route("/update-avatar").patch(verifyJWT, upload.single("avatar"), updateUserAvatar)

router.route("/update-coverImage").patch(verifyJWT ,upload.single("coverImage"), updateCoverImage)
router.route("/c/:username").get(verifyJWT, getUserChannelProfile)
router.route("/getwatch-history").get(verifyJWT,getWatchHistory)

export  default router 