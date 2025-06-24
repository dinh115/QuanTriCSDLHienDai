import { Request } from 'express';
import { Document } from 'mongoose';

export interface IUser extends Document {
    _id: string;
    email: string;
    username: string;
    password: string;
    firstName: string;
    lastName: string;
    role: 'customer' | 'admin' | 'shop_owner';
    status: 'active' | 'inactive';
    createdAt: Date;
    updatedAt: Date;
}

export interface JWTPayload {
    userId: string;
    email: string;
    username: string;
    role: string;
    status: string;
}

export interface AuthenticatedRequest extends Request {
    user?: JWTPayload;
}

export interface LoginRequest {
    username: string;
    password: string;
}

export interface RegisterRequest {
    email: string;
    username: string;
    password: string;
    firstName: string;
    lastName: string;
}

export interface CreateUserRequest {
    email: string;
    username: string;
    firstName: string;
    lastName: string;
    password?: string;
    role?: 'customer' | 'admin' | 'shop_owner';
    status?: 'active' | 'inactive';
}

export interface UpdateUserRequest {
    firstName?: string;
    lastName?: string;
    email?: string;
    password?: string;
    role?: 'customer' | 'admin' | 'shop_owner';
    status?: 'active' | 'inactive';
}

export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}

export interface UserQueryOptions {
    page?: number;
    limit?: number;
    status?: string;
    role?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

export interface FindUsersOptions {
    page: number;
    limit: number;
    status?: string;
    role?: string;
    search?: string;
    sortBy: string;
    sortOrder: 'asc' | 'desc';
}

export interface FindUsersResult {
    users: IUser[];
    totalCount: number;
    totalPages: number;
    currentPage: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
}

export interface UserStatusResult {
    exists: boolean;
    active: boolean;
    user?: IUser | null;
    role?: string;
}