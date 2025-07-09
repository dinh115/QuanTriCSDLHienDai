import User from '../models/User';
import {
  IUser,
  CreateUserRequest,
  UpdateUserRequest,
  FindUsersOptions,
  FindUsersResult,
  UserStatusResult
} from '../types';
import logger from '../config/logger';
import { cacheService } from './cacheService';
import bcrypt from 'bcryptjs';

export class UserService {

  async getAllUsers(includeInactive: boolean = false): Promise<IUser[]> {
    try {
      const filter = includeInactive ? {} : { status: 'active' };
      const users = await User.find(filter).sort({ createdAt: -1 });
      return users;
    } catch (error) {
      logger.error('Get all users error:', error);
      throw error;
    }
  }


  /**
   * Find users with pagination, filtering, and search
   */
  async findUsers(options: FindUsersOptions): Promise<FindUsersResult> {
    const {
      page,
      limit,
      status,
      role,
      search,
      sortBy,
      sortOrder
    } = options;

    // Build query filters
    const query: any = {};

    // Filter by status if provided
    if (status) query.status = status;

    // Filter by role if provided
    if (role) query.role = role;

    // Add search functionality
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { firstName: searchRegex },
        { lastName: searchRegex },
        { email: searchRegex }
      ];
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Build sort object
    const sortObj: any = {};
    sortObj[sortBy] = sortOrder === 'asc' ? 1 : -1;

    try {
      // Execute queries in parallel
      const [users, totalCount] = await Promise.all([
        User.find(query)
          .sort(sortObj)
          .skip(skip)
          .limit(limit)
          .lean(), // Use lean() for better performance
        User.countDocuments(query)
      ]);

      // Calculate pagination metadata
      const totalPages = Math.ceil(totalCount / limit);
      const hasNextPage = page < totalPages;
      const hasPrevPage = page > 1;

      return {
        users: users as IUser[],
        totalCount,
        totalPages,
        currentPage: page,
        hasNextPage,
        hasPrevPage
      };
    } catch (error) {
      logger.error('Error finding users:', error);
      throw new Error('Failed to fetch users');
    }
  }

  async getUserById(id: string): Promise<IUser | null> {
    try {
      // Try cache first
      // const cachedUser = await cacheService.getCachedUser(id);
      // if (cachedUser) {
      //   return cachedUser;
      // }

      // Fetch from database
      const user = await User.findById(id);
      if (user) {
        // Cache for 5 minutes
        //await cacheService.cacheUser(id, user.toJSON(), 300);
      }

      return user;
    } catch (error) {
      logger.error('Get user by ID error:', error);
      throw error;
    }
  }

  async getUsersByIds(userIds: string[]): Promise<IUser[]> {
    try {
      const users = await User.find({ _id: { $in: userIds } });
      return users;
    } catch (error) {
      logger.error('Get users by IDs error:', error);
      throw error;
    }
  }

  async createUser(userData: CreateUserRequest): Promise<IUser> {
    try {
      // Check if user already exists
      const existingUsername = await User.findOne({
        email: userData.username.toLowerCase()
      });
      if (existingUsername) {
        throw new Error('User with this username already exists');
      }
      const existingUser = await User.findOne({
        email: userData.email.toLowerCase()
      });

      if (existingUser) {
        throw new Error('User with this email already exists');
      }

      // Generate default password if not provided somehow
      const password = userData.password || 'defaultPassword123';
      const hashedPassword = await bcrypt.hash(password, 12);

      const user = new User({
        email: userData.email.toLowerCase(),
        username: userData.username,
        password: hashedPassword,
        firstName: userData.firstName.trim(),
        lastName: userData.lastName.trim(),
        role: userData.role || 'customer',
        status: userData.status || 'active',
        phone: userData.phone || '',
        dateOfBirth: userData.dateOfBirth || '',
        address: userData.address || ''
      });

      await user.save();

      // Cache the new user
      //await cacheService.cacheUser(user.id, user.toJSON());

      return user;
    } catch (error) {
      logger.error('Create user error:', error);
      throw error;
    }
  }

  async updateUser(id: string, userData: UpdateUserRequest): Promise<IUser | null> {
    try {
      const user = await User.findById(id);
      if (!user) {
        return null;
      }

      // Update fields
      if (userData.firstName !== undefined) user.firstName = userData.firstName.trim();
      if (userData.lastName !== undefined) user.lastName = userData.lastName.trim();
      if (userData.email !== undefined) user.email = userData.email.toLowerCase();
      if (userData.password !== undefined) user.password = await bcrypt.hash(userData.password, 12);;
      if (userData.role !== undefined) user.role = userData.role;
      if (userData.status !== undefined) user.status = userData.status;
      if (userData.phone !== undefined) user.phone = userData.phone.trim();
      if (userData.address !== undefined) user.address = userData.address.trim();
      if (userData.dateOfBirth !== undefined) user.dateOfBirth = userData.dateOfBirth;



      await user.save();

      // Update cache
      //await cacheService.cacheUser(id, user.toJSON());

      return user;
    } catch (error) {
      logger.error('Update user error:', error);
      throw error;
    }
  }

  async deleteUser(id: string): Promise<boolean> {
    try {
      const result = await User.findByIdAndDelete(id);

      if (result) {
        // Remove from cache
        //await cacheService.invalidateUserCache(id);
        return true;
      }

      return false;
    } catch (error) {
      logger.error('Delete user error:', error);
      throw error;
    }
  }

  /**
 * Check user status by ID
 */
  async checkUserStatus(userId: string): Promise<UserStatusResult> {
    try {
      // Find user by ID
      const user = await User.findById(userId).lean();

      if (!user) {
        return {
          exists: false,
          active: false,
          user: null,
          role: undefined
        };
      }

      // Determine if user is active
      const isActive = user.status === 'active';

      return {
        exists: true,
        active: isActive,
        user: user as IUser,
        role: user.role
      };
    } catch (error) {
      logger.error('Error checking user status:', error);
      throw new Error('Failed to check user status');
    }
  }

  async verifyUsers(userIds: string[]): Promise<Array<{
    userId: string;
    exists: boolean;
    active: boolean;
    role?: string;
  }>> {
    try {
      const users = await this.getUsersByIds(userIds);

      return userIds.map(userId => {
        const user = users.find(u => u._id?.toString() === userId);
        return {
          userId,
          exists: !!user,
          active: user?.status === 'active',
          role: user?.role
        };
      });
    } catch (error) {
      logger.error('Verify users error:', error);
      throw error;
    }
  }

  sanitizeUser(user: IUser) {
    const userObj = user.toJSON();
    delete userObj.password;
    return userObj;
  }
}

export const userService = new UserService();
export default userService;