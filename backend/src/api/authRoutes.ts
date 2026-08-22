import { Router } from 'express';
import { AuthController } from '../controllers/authController.js';
import { asyncHandler } from '../middleware/errorHandler.js';

export const authRouter = Router();

authRouter.post('/google', asyncHandler(AuthController.googleAuth));
authRouter.post('/register', asyncHandler(AuthController.register));
authRouter.post('/login', asyncHandler(AuthController.login));
authRouter.post('/logout', asyncHandler(AuthController.logout));
