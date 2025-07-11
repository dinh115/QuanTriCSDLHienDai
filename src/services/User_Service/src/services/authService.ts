import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../models/User';
import { cacheService } from './cacheService';
import { config } from '../config/environments';
import logger from '../config/logger';
import { IUser, JWTPayload, LoginRequest, RegisterRequest } from '../types';

class AuthService {
  /**
   * Login user
   */
  async login(credentials: LoginRequest): Promise<{
    token: string;
    user: IUser;
  }> {
    try {
      const { username, password } = credentials;

      // Find user by username
      const user = await User.findOne({ username: username.toLowerCase() });
      if (!user) {
        throw new Error('Invalid credentials');
      }

      // Check if user is active
      if (user.status !== 'active') {
        throw new Error('Account is not active');
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        throw new Error('Invalid credentials');
      }

      // Generate token
      const token = this.createToken(user);

      // Store session in cache
      await cacheService.setSession(token);

      // Cache user data
      //await cacheService.cacheUser(user._id.toString(), user.toJSON());

      logger.info(`User logged in: ${user._id}`);

      return {
        token,
        user
      };
    } catch (error) {
      logger.error('Login error:', error);
      throw error;
    }
  }

  /**
   * Register new user
   */
  async register(userData: RegisterRequest): Promise<{
    token: string;
    user: IUser;
  }> {
    try {
      const { email, username, password, firstName, lastName, phone, address, dateOfBirth } = userData;

      // Check if user already exists
      const existingUsername = await User.findOne({ username: username.toLowerCase() });
      if (existingUsername) {
        throw new Error('User with this username already exists');
      }

      const existingUser = await User.findOne({ email: email.toLowerCase() });
      if (existingUser) {
        throw new Error('User with this email already exists');
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12);

      // Create new user
      const newUser = new User({
        email: email.toLowerCase(),
        username: username,
        password: hashedPassword,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        role: 'customer',
        status: 'active',
        phone: phone.trim(),
        address: address.trim(),
        dateOfBirth: dateOfBirth
      });

      const savedUser = await newUser.save();

      // Generate token
      const token = this.createToken(savedUser);

      // Store session in cache
      await cacheService.setSession(token);

      // Cache user data
      //await cacheService.cacheUser(savedUser._id.toString(), savedUser.toJSON());

      logger.info(`User registered: ${savedUser._id}`);

      return {
        token,
        user: savedUser
      };
    } catch (error) {
      logger.error('Registration error:', error);
      throw error;
    }
  }

  /**
   * Verify token and session
   */
  async verifySession(token: string): Promise<JWTPayload | null> {
    try {
      // Check if session exists in cache
      const session = await cacheService.getSession(token);
      if (!session) {
        return null;
      }

      // Verify JWT token
      const decoded = this.verifyToken(token);
      if (!decoded) {
        // Remove invalid session
        await cacheService.deleteSession(token);
        return null;
      }

      // Verify user still exists and is active
      const user = await User.findById(decoded.userId);
      if (!user || user.status !== 'active') {
        // Remove session for non-existent or inactive user
        await cacheService.deleteSession(token);
        //await cacheService.invalidateUserCache(decoded.userId);
        return null;
      }

      return decoded;
    } catch (error) {
      logger.error('Session verification error:', error);
      return null;
    }
  }

  /**
   * Logout user
   */
  async logout(token: string): Promise<void> {
    try {
      if (token) {
        await cacheService.deleteSession(token);
        logger.info('User logged out');
      }
    } catch (error) {
      logger.error('Logout error:', error);
    }
  }

  /**
   * Create JWT token
   */
  private createToken(user: IUser): string {
    const payload: JWTPayload = {
      userId: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      fullname: `${user.firstName} ${user.lastName}`,
      status: user.status,
      phone: user.phone,
      address: user.address,
      dateOfBirth: user.dateOfBirth
    };

    return jwt.sign(payload, config.JWT_SECRET as any, {
      expiresIn: config.JWT_EXPIRES_IN as any
    });
  }

  /**
   * Verify JWT token
   */
  private verifyToken(token: string): JWTPayload | null {
    try {
      return jwt.verify(token, config.JWT_SECRET) as JWTPayload;
    } catch (error) {
      logger.error('Token verification failed:', error);
      return null;
    }
  }

  /**
   * Refresh token (generate new token for existing session)
   */
  async refreshToken(oldToken: string): Promise<string | null> {
    try {
      const decoded = await this.verifySession(oldToken);
      if (!decoded) {
        return null;
      }

      const user = await User.findById(decoded.userId);
      if (!user || user.status !== 'active') {
        return null;
      }

      // Generate new token
      const newToken = this.createToken(user);

      // Replace old session with new one
      await cacheService.deleteSession(oldToken);
      await cacheService.setSession(newToken);

      logger.info(`Token refreshed for user: ${user._id}`);

      return newToken;
    } catch (error) {
      logger.error('Token refresh error:', error);
      return null;
    }
  }

  /**
   * Validate password strength
   */
  validatePassword(password: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (password.length < 6) {
      errors.push('Password must be at least 6 characters long');
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Generate secure random password
   */
  generatePassword(length: number = 12): string {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';

    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }

    return password;
  }

  /**
   * Logout all sessions for a user
   */
  async logoutAllSessions(userId: string): Promise<void> {
    try {
      // Remove all sessions for this user from cache
      await cacheService.deletePattern(`session:*`);

      // Invalidate user cache
      //await cacheService.invalidateUserCache(userId);

      logger.info(`All sessions logged out for user: ${userId}`);
    } catch (error) {
      logger.error('Logout all sessions error:', error);
    }
  }
}

export const authService = new AuthService();
export default authService;