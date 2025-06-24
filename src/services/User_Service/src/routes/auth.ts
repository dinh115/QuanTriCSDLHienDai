import express from 'express';
import userController from '../controllers/userController';
import {
    authMiddleware,
} from '../middlewares/auth';
import {
    validateRequestBody,
    loginSchema,
    registerSchema,
    updateUserSchema,
    tokenVerifySchema
} from '../middlewares/validation';

const router = express.Router();

// =================== PUBLIC ROUTES ===================
/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login',
    validateRequestBody(loginSchema),
    userController.login
);

/**
 * @route   POST /api/auth/register
 * @desc    Register new user
 * @access  Public
 */
router.post('/register',
    validateRequestBody(registerSchema),
    userController.register
);

/**
 * @route   POST /api/auth/verify-token
 * @desc    Verify JWT token
 * @access  Public
 */
router.post('/verify-token',
    validateRequestBody(tokenVerifySchema),
    userController.verifyToken
);

// =================== AUTHENTICATED ROUTES ===================
/**
 * @route   GET /api/auth/profile
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/profile',
    authMiddleware,
    userController.getProfile
);

/**
 * @route   PUT /api/auth/profile
 * @desc    Update current user profile
 * @access  Private
 */
router.put('/profile',
    authMiddleware,
    validateRequestBody(updateUserSchema),
    userController.updateProfile
);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user
 * @access  Private
 */
router.post('/logout',
    authMiddleware,
    userController.logout
);

export default router;