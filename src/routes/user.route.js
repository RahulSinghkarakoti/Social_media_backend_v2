import { Router } from "express";
import { authenticateJWT, isAdmin } from "../middleware/auth.middleware.js";
import {
  getUserInfo,
  getAdminDashboard,
} from "../controllers/user.controller.js";
const router = Router();

router
  .route("/admin/dashboard")
  .get(authenticateJWT, isAdmin, getAdminDashboard); // admin dashbaord
router
  .route("/admin/userinfo/:userId")
  .get(authenticateJWT, isAdmin, getUserInfo); // admin dashbaord

export default router;
