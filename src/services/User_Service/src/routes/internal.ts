import express from 'express';
import userController from '../controllers/userController';
import { authenticateService, } from '../middlewares/auth';
import {
    validateUUID,
    validateRequestBody,
    batchUsersSchema
} from '../middlewares/validation';

const router = express.Router();

// =================== INTERNAL SERVICE ROUTES ===================
/**
 * @route   GET /api/internal/users
 * @desc    Get users for internal service communication
 * @access  Service-to-Service
 */
router.get('/users',
    authenticateService,
    userController.getUsers
);

/**
 * @route   GET /api/internal/users/:id
 * @desc    Get user by ID for internal service communication
 * @access  Service-to-Service
 */
router.get('/users/:id',
    authenticateService,
    validateUUID('id'),
    userController.getUserInternal
);

/**
 * @route   POST /api/internal/users/batch
 * @desc    Get multiple users by IDs
 * @access  Service-to-Service
 */
router.post('/users/batch',
    authenticateService,
    validateRequestBody(batchUsersSchema),
    userController.batchGetUsers
);

/**
 * @route   GET /api/internal/users/:id/status
 * @desc    Check user status
 * @access  Service-to-Service
 */
router.get('/users/:id/status',
    authenticateService,
    validateUUID('id'),
    userController.checkUserStatus
);

/**
 * @route   POST /api/internal/users/verify
 * @desc    Verify multiple users exist and are active
 * @access  Service-to-Service
 */
router.post('/users/verify',
    authenticateService,
    validateRequestBody(batchUsersSchema),
    userController.verifyUsers
);

export default router;