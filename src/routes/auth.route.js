 
import  {Router} from 'express';
import {signup,login,getProfile,refreshAccessToken,getAdminProfile} from '../controllers/auth.controller.js';
import { authenticateJWT, isAdmin } from '../middleware/auth.middleware.js';
const router =  Router();

router.route('/signup').post(signup);
router.route('/login').post(login);
router.route('/me').get(authenticateJWT, getProfile);
router.route('/admin/me').get(authenticateJWT,isAdmin ,getAdminProfile);
router.route('/refresh-token').post(refreshAccessToken)

export default router;
