import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';
import { validate as uuidValidate } from 'uuid';
import logger from '../config/logger';

// =================== VALIDATION SCHEMAS ===================
export const loginSchema = Joi.object({
    username: Joi.string().required().messages({
        'string.username': 'Please provide a valid username address',
        'any.required': 'Username is required'
    }),
    password: Joi.string().min(6).required().messages({
        'string.min': 'Password must be at least 6 characters long',
        'any.required': 'Password is required'
    })
});

export const registerSchema = Joi.object({
    email: Joi.string().email().required().messages({
        'string.email': 'Please provide a valid email address',
        'any.required': 'Email is required'
    }),
    username: Joi.string()
        .trim()
        .pattern(/^(?=.{3,20}$)(?!.*[_.-]{2})[a-zA-Z0-9]+([._-]?[a-zA-Z0-9]+)*$/)
        .required()
        .messages({
            'string.pattern.base':
                'Username cannot start or end with special characters, and cannot have consecutive special characters.',
            'string.empty': 'Username is required.',
            'any.required': 'Username is required.'
        }),
    password: Joi.string().min(6).required().messages({
        'string.min': 'Password must be at least 6 characters long',
        'any.required': 'Password is required'
    }),
    firstName: Joi.string().trim().min(1).max(50).required().messages({
        'string.min': 'First name cannot be empty',
        'string.max': 'First name cannot exceed 50 characters',
        'any.required': 'First name is required'
    }),
    lastName: Joi.string().trim().min(1).max(50).required().messages({
        'string.min': 'Last name cannot be empty',
        'string.max': 'Last name cannot exceed 50 characters',
        'any.required': 'Last name is required'
    }),
    phone: Joi.string()
        .pattern(/^[\+]?[1-9][\d]{0,15}$/)
        .required()
        .messages({
            'string.pattern.base': 'Please provide a valid phone number',
            'any.required': 'Phone number is required'
        }),
    address: Joi.string().trim().min(1).max(200).required().messages({
        'string.min': 'Address cannot be empty',
        'string.max': 'Address cannot exceed 200 characters',
        'any.required': 'Address is required'
    }),
    dateOfBirth: Joi.string()
        .pattern(/^\d{4}-\d{2}-\d{2}$/)
        .required()
        .custom((value, helpers) => {
            const date = new Date(value);
            if (isNaN(date.getTime())) {
                return helpers.error('any.invalid', { value });
            }
            const now = new Date();
            if (date > now) {
                return helpers.error('date.max', { value });
            }
            return value;
        }, 'Date Validation')
        .messages({
            'string.pattern.base': 'Date must be in YYYY-MM-DD format',
            'any.required': 'Date is required',
            'any.invalid': 'Date is invalid',
            'date.max': 'Date cannot be in the future'
        })
});


export const createUserSchema = Joi.object({
    email: Joi.string().email().required().messages({
        'string.email': 'Please provide a valid email address',
        'any.required': 'Email is required'
    }),
    username: Joi.string()
        .trim()
        .pattern(/^(?=.{3,20}$)(?!.*[_.-]{2})[a-zA-Z0-9]+([._-]?[a-zA-Z0-9]+)*$/)
        .required()
        .messages({
            'string.pattern.base':
                'Username cannot start or end with special characters, and cannot have consecutive special characters.',
            'string.empty': 'Username is required.',
            'any.required': 'Username is required.'
        }),
    firstName: Joi.string().trim().min(1).max(50).required().messages({
        'string.min': 'First name cannot be empty',
        'string.max': 'First name cannot exceed 50 characters',
        'any.required': 'First name is required'
    }),
    lastName: Joi.string().trim().min(1).max(50).required().messages({
        'string.min': 'Last name cannot be empty',
        'string.max': 'Last name cannot exceed 50 characters',
        'any.required': 'Last name is required'
    }),
    password: Joi.string().min(6).optional().messages({
        'string.min': 'Password must be at least 6 characters long'
    }),
    role: Joi.string().valid('customer', 'admin', 'shop_owner').optional().default('customer').messages({
        'any.only': 'Role must be either customer, shop_owner or admin'
    }),
    status: Joi.string().valid('active', 'inactive').optional().default('active').messages({
        'any.only': 'Status must be either active or inactive'
    }),
    phone: Joi.string()
        .pattern(/^[\+]?[1-9][\d]{0,15}$/)
        .optional()
        .messages({
            'string.pattern.base': 'Please provide a valid phone number'
        }),
    address: Joi.string().trim().min(1).max(200).optional().messages({
        'string.min': 'Address cannot be empty',
        'string.max': 'Address cannot exceed 200 characters'
    }),
    dateOfBirth: Joi.string()
        .pattern(/^\d{4}-\d{2}-\d{2}$/)
        .required()
        .custom((value, helpers) => {
            const date = new Date(value);
            if (isNaN(date.getTime())) {
                return helpers.error('any.invalid', { value });
            }
            const now = new Date();
            if (date > now) {
                return helpers.error('date.max', { value });
            }
            return value;
        }, 'Date Validation')
        .messages({
            'string.pattern.base': 'Date must be in YYYY-MM-DD format',
            'any.required': 'Date is required',
            'any.invalid': 'Date is invalid',
            'date.max': 'Date cannot be in the future'
        })
});

export const updateUserSchema = Joi.object({
    firstName: Joi.string().trim().min(1).max(50).optional().messages({
        'string.min': 'First name cannot be empty',
        'string.max': 'First name cannot exceed 50 characters'
    }),
    lastName: Joi.string().trim().min(1).max(50).optional().messages({
        'string.min': 'Last name cannot be empty',
        'string.max': 'Last name cannot exceed 50 characters'
    }),
    email: Joi.string().email().optional().messages({
        'string.email': 'Please provide a valid email address'
    }),
    password: Joi.string().min(6).optional().messages({
        'string.min': 'Password must be at least 6 characters long'
    }),
    role: Joi.string().valid('customer', 'admin', 'shop_owner').optional().messages({
        'any.only': 'Role must be either customer, shop_owner or admin'
    }),
    status: Joi.string().valid('active', 'inactive').optional().messages({
        'any.only': 'Status must be either active or inactive'
    }),
    phone: Joi.string()
        .pattern(/^[\+]?[1-9][\d]{0,15}$/)
        .optional()
        .messages({
            'string.pattern.base': 'Please provide a valid phone number'
        }),
    address: Joi.string().trim().min(1).max(200).optional().messages({
        'string.min': 'Address cannot be empty',
        'string.max': 'Address cannot exceed 200 characters'
    }),
    dateOfBirth: Joi.string()
        .pattern(/^\d{4}-\d{2}-\d{2}$/)
        .optional()
        .custom((value, helpers) => {
            const date = new Date(value);
            if (isNaN(date.getTime())) {
                return helpers.error('any.invalid', { value });
            }
            const now = new Date();
            if (date > now) {
                return helpers.error('date.max', { value });
            }
            return value;
        }, 'Date Validation')
        .messages({
            'string.pattern.base': 'Date must be in YYYY-MM-DD format',
            'any.invalid': 'Date is invalid',
            'date.max': 'Date cannot be in the future'
        })

});


export const tokenVerifySchema = Joi.object({
    token: Joi.string().required().messages({
        'any.required': 'Token is required'
    })
});

/**
 * Query parameter schema for user listing
 */
export const userQuerySchema = Joi.object({
    page: Joi.number().integer().min(1).default(1).messages({
        'number.min': 'Page must be at least 1'
    }),
    limit: Joi.number().integer().min(1).max(100).default(10).messages({
        'number.min': 'Limit must be at least 1',
        'number.max': 'Limit cannot exceed 100'
    }),
    status: Joi.string().valid('active', 'inactive').optional().messages({
        'any.only': 'Status must be either active or inactive'
    }),
    role: Joi.string().valid('customer', 'admin', 'shop_owner').optional().messages({
        'any.only': 'Role must be either customer, admin, or shop_owner'
    }),
    search: Joi.string().trim().max(100).optional().messages({
        'string.max': 'Search term cannot exceed 100 characters'
    }),
    sortBy: Joi.string().valid('createdAt', 'email', 'username', 'firstName', 'lastName').default('createdAt').messages({
        'any.only': 'Sort by must be one of: createdAt, email, username, firstName, lastName'
    }),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc').messages({
        'any.only': 'Sort order must be either asc or desc'
    })
});

export const batchUsersSchema = Joi.object({
    userIds: Joi.array()
        .items(Joi.string().custom((value, helpers) => {
            if (!isValidUUID(value)) {
                return helpers.error('any.invalid');
            }
            return value;
        }).messages({
            'any.invalid': 'Each user ID must be a valid UUID'
        }))
        .min(1)
        .max(100)
        .required()
        .messages({
            'array.min': 'At least one user ID is required',
            'array.max': 'Cannot process more than 100 user IDs at once',
            'any.required': 'User IDs array is required'
        })
});

// =================== UUID VALIDATION UTILITIES ===================
/**
 * Check if a string is a valid UUID
 */
export const isValidUUID = (uuid: string): boolean => {
    return uuidValidate(uuid);
};

/**
 * Middleware to validate UUID parameters
 */
export const validateUUID = (paramName: string) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        const uuid = req.params[paramName];

        if (!uuid) {
            res.status(400).json({
                success: false,
                error: `${paramName} parameter is required`
            });
            return;
        }

        if (!isValidUUID(uuid)) {
            logger.warn(`Invalid UUID provided for ${paramName}: ${uuid}`, {
                ip: req.ip,
                userAgent: req.get('User-Agent'),
                path: req.path
            });

            res.status(400).json({
                success: false,
                error: `Invalid ${paramName}. Must be a valid UUID`
            });
            return;
        }

        next();
    };
};

/**
 * Middleware to validate request body against a Joi schema
 */
export const validateRequestBody = (schema: Joi.ObjectSchema) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        const { error, value } = schema.validate(req.body, {
            abortEarly: false,
            stripUnknown: true,
            convert: true
        });

        if (error) {
            const errorMessages = error.details.map(detail => ({
                field: detail.path.join('.'),
                message: detail.message
            }));

            logger.warn('Validation error:', {
                errors: errorMessages,
                body: req.body,
                path: req.path,
                method: req.method
            });

            res.status(400).json({
                success: false,
                error: 'Validation failed',
                details: errorMessages
            });
            return;
        }

        // Replace req.body with validated and sanitized data
        req.body = value;
        next();
    };
};

/**
 * Middleware to validate query parameters
 */
export const validateQueryParams = (schema: Joi.ObjectSchema) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        const { error, value } = schema.validate(req.query, {
            abortEarly: false,
            stripUnknown: true,
            convert: true
        });

        if (error) {
            const errorMessages = error.details.map(detail => ({
                field: detail.path.join('.'),
                message: detail.message
            }));

            logger.warn('Query validation error:', {
                errors: errorMessages,
                query: req.query,
                path: req.path
            });

            res.status(400).json({
                success: false,
                error: 'Query parameter validation failed',
                details: errorMessages
            });
            return;
        }

        // Replace req.query with validated data
        req.query = value;
        next();
    };
};

/**
 * Middleware to ensure UUID for user IDs in request body
 */
export const validateUserIdsInBody = (req: Request, res: Response, next: NextFunction): void => {
    const { userIds } = req.body;

    if (!userIds || !Array.isArray(userIds)) {
        res.status(400).json({
            success: false,
            error: 'userIds must be an array'
        });
        return;
    }

    const invalidIds = userIds.filter((id: any) => !isValidUUID(id));

    if (invalidIds.length > 0) {
        logger.warn('Invalid UUIDs in request body:', {
            invalidIds,
            path: req.path,
            method: req.method
        });

        res.status(400).json({
            success: false,
            error: 'All user IDs must be valid UUID',
            invalidIds
        });
        return;
    }

    next();
};
