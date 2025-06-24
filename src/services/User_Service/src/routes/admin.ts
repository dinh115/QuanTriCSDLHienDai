import express from 'express';
import Joi from 'joi';
import userController from '../controllers/userController';
import { authMiddleware, requireAdmin } from '../middlewares/auth';
import {
    validateUUID,
    validateRequestBody,
    updateUserSchema
} from '../middlewares/validation';


const router = express.Router();

// =================== ADMIN ROUTES ===================
/**
 * @route   PUT /api/admin/users/:id/status
 * @desc    Update user status (activate/deactivate)
 * @access  Private (Admin only)
 */
router.put('/users/:id/status',
    authMiddleware,
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
router.put('/users/:id/role',
    authMiddleware,
    requireAdmin,
    validateUUID('id'),
    validateRequestBody(Joi.object({
        role: Joi.string().valid('customer', 'admin', 'shop_owner').required()
    })),
    userController.updateUser
);

/**
 * @route   PUT /api/admin/users/:id
 * @desc    Update user by ID
 * @access  Private (Admin or own profile)
 */
// router.put('/users/:id',
//     authMiddleware,
//     validateUUID('id'),
//     validateRequestBody(updateUserSchema),
//     userController.updateUser
// );

/**
 * @route   DELETE /api/admin/users/:id
 * @desc    Delete user by ID
 * @access  Private (Admin only)
 */
// router.delete('/users/:id',
//     requireAdmin,
//     validateUUID('id'),
//     userController.deleteUser
// );

export default router;