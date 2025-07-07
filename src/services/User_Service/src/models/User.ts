import mongoose, { Schema, Document } from 'mongoose';
import { IUser } from '../types';
import { v5 as uuidv5 } from 'uuid';

const UUID_NAMESPACE = '3f96061a-3a25-4f89-9ae9-abc012345678';

const userSchema = new Schema<IUser>({
    _id: {
        type: String,
        default: function () {
            if (!this.username) {
                throw new Error('username is required for UUIDv5 generation');
            }
            return uuidv5(this.username, UUID_NAMESPACE);
        },
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        minlength: 3,
        maxlength: 20
    },
    phone: {
        type: String,
        required: true,
        trim: true,
        // Example valid phone data: "+84901234567", "+12025550123", "84901234567"
        validate: {
            validator: function (v: string) {
                // phone regex: allows +, country code, and 8-15 digits
                return /^\+?[1-9]\d{7,14}$/.test(v);
            },
            message: 'Phone number is not valid'
        }
    },
    address: {
        type: String,
        required: true,
        trim: true,
        minlength: 1
    },
    dateOfBirth: {
        type: Date,
        required: true,
        validate: {
            validator: function (v: Date) {
                // No future dates allowed
                return v <= new Date();
            },
            message: 'Date of birth cannot be in the future'
        }
    }, password: {
        type: String,
        required: true,
        minlength: 6
    },
    firstName: {
        type: String,
        required: true,
        trim: true,
        minlength: 1
    },
    lastName: {
        type: String,
        required: true,
        trim: true,
        minlength: 1
    },
    role: {
        type: String,
        enum: ['customer', 'admin', 'shop_owner'],
        default: 'customer',
        required: true
    },
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active',
        required: true
    }
}, {
    _id: false, // Disable automatic _id generation since we're using custom string IDs
    timestamps: true,
    versionKey: false
});

// Indexes for better query performance
userSchema.index({ status: 1 });
userSchema.index({ role: 1 });
userSchema.index({ createdAt: -1 });

// Compound indexes for common query patterns (optional optimizations)
userSchema.index({ status: 1, role: 1 }); // For filtering by both status and role
userSchema.index({ role: 1, createdAt: -1 }); // For role-based queries with sorting

// Remove password from JSON output
userSchema.methods.toJSON = function () {
    const userObject = this.toObject();
    delete userObject.password;
    return userObject;
};

export default mongoose.model<IUser>('User', userSchema);