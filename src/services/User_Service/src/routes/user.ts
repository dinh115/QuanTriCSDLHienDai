import express from 'express';
import userController from '../controllers/userController';
import {
    authMiddleware,
    requireAdmin
} from '../middlewares/auth';
import {
    validateUUID,
    validateRequestBody,
    createUserSchema,
    updateUserSchema,
} from '../middlewares/validation';

const router = express.Router();


// =================== USER MANAGEMENT ROUTES ===================
/**
 * @route   GET /api/users
 * @desc    Get all users with pagination and filtering
 * @access  Private (Admin for full access, Users for limited access)
 */
router.get('/',
    authMiddleware,
    userController.getUsers
);

/**
 * @route   GET /api/users/:id
 * @desc    Get user by ID
 * @access  Private (Admin or own profile)
 */
router.get('/:id',
    authMiddleware,
    validateUUID('id'),
    userController.getUser
);

/**
 * @route   POST /api/users
 * @desc    Create new user
 * @access  Private (Admin only)
 */
router.post('/',
    authMiddleware,
    requireAdmin,
    validateRequestBody(createUserSchema),
    userController.createUser
);
/**
 * @route   PUT /api/users/:id
 * @desc    Update user by ID
 * @access  Private (Admin or own profile)
 */
router.put('/:id',
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
router.delete('/:id',
    authMiddleware,
    requireAdmin,
    validateUUID('id'),
    userController.deleteUser
);


export default router;