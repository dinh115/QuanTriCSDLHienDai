import express from 'express';
import Joi from 'joi';
import userController from '../controllers/userController';
import {
    authMiddleware,
    authenticateService,
    requireAdmin
} from '../middlewares/auth';
import {
    validateUUID,
    validateRequestBody,
    loginSchema,
    registerSchema,
    createUserSchema,
    updateUserSchema,
    tokenVerifySchema,
    batchUsersSchema
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
    userController.updateUser
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

// =================== USER MANAGEMENT ROUTES ===================
/**
 * @route   GET /api/users
 * @desc    Get all users with pagination and filtering
 * @access  Private (Admin for full access, Users for limited access)
 */
router.get('/users',
    authMiddleware,
    userController.getUsers
);

/**
 * @route   GET /api/users/:id
 * @desc    Get user by ID
 * @access  Private (Admin or own profile)
 */
router.get('/users/:id',
    authMiddleware,
    validateUUID('id'),
    userController.getUser
);

/**
 * @route   POST /api/users
 * @desc    Create new user
 * @access  Private (Admin only)
 */
router.post('/users',
    requireAdmin,
    validateRequestBody(createUserSchema),
    userController.createUser
);

/**
 * @route   PUT /api/users/:id
 * @desc    Update user by ID
 * @access  Private (Admin or own profile)
 */
router.put('/users/:id',
    authMiddleware,
    validateUUID('id'),
    validateRequestBody(updateUserSchema),
    userController.updateUser
);

/**
 * @route   DELETE /api/users/:id
 * @desc    Delete user by ID
 * @access  Private (Admin only)
 */
router.delete('/users/:id',
    requireAdmin,
    validateUUID('id'),
    userController.deleteUser
);

// =================== INTERNAL SERVICE ROUTES ===================
/**
 * @route   GET /api/internal/users
 * @desc    Get users for internal service communication
 * @access  Service-to-Service
 */
router.get('/internal/users',
    authenticateService,
    userController.getUsers
);

/**
 * @route   GET /api/internal/users/:id
 * @desc    Get user by ID for internal service communication
 * @access  Service-to-Service
 */
router.get('/internal/users/:id',
    authenticateService,
    validateUUID('id'),
    userController.getUser
);

/**
 * @route   POST /api/internal/users/batch
 * @desc    Get multiple users by IDs
 * @access  Service-to-Service
 */
router.post('/internal/users/batch',
    authenticateService,
    validateRequestBody(batchUsersSchema),
    userController.batchGetUsers
);

/**
 * @route   GET /api/internal/users/:id/status
 * @desc    Check user status
 * @access  Service-to-Service
 */
router.get('/internal/users/:id/status',
    authenticateService,
    validateUUID('id'),
    userController.checkUserStatus
);

/**
 * @route   POST /api/internal/users/verify
 * @desc    Verify multiple users exist and are active
 * @access  Service-to-Service
 */
router.post('/internal/users/verify',
    authenticateService,
    validateRequestBody(batchUsersSchema),
    userController.verifyUsers
);

// =================== ADMIN ROUTES ===================
/**
 * @route   PUT /api/admin/users/:id/status
 * @desc    Update user status (activate/deactivate)
 * @access  Private (Admin only)
 */
router.put('/admin/users/:id/status',
    requireAdmin,
    validateUUID('id'),
    validateRequestBody(Joi.object({
        status: Joi.string().valid('active', 'inactive').required()
    })),
    userController.updateUser
);

/**
 * @route   PUT /api/admin/users/:id/role
 * @desc    Update user role
 * @access  Private (Admin only)
 */
router.put('/admin/users/:id/role',
    requireAdmin,
    validateUUID('id'),
    validateRequestBody(Joi.object({
        role: Joi.string().valid('customer', 'admin').required()
    })),
    userController.updateUser
);

// =================== ERROR HANDLING FOR INVALID ROUTES ===================
/**
 * Handle invalid routes within the user service
 */
router.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        error: `Route ${req.method} ${req.originalUrl} not found in user service`
    });
});

export default router;