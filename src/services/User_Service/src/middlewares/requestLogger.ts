import { Request, Response, NextFunction } from 'express';
import logger from '../config/logger';

interface RequestLogData {
    method: string;
    url: string;
    ip: string;
    userAgent?: string;
    userId?: string;
    timestamp: string;
    requestId: string;
    body?: any;
    query?: any;
    params?: any;
}

interface ResponseLogData extends RequestLogData {
    statusCode: number;
    responseTime: number;
    contentLength?: string;
    error?: string;
}

// Generate unique request ID
const generateRequestId = (): string => {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Sanitize sensitive data from request body
const sanitizeBody = (body: any): any => {
    if (!body || typeof body !== 'object') return body;

    const sensitiveFields = ['password', 'token', 'authorization', 'secret', 'key'];
    const sanitized = { ...body };

    Object.keys(sanitized).forEach(key => {
        if (sensitiveFields.some(field => key.toLowerCase().includes(field.toLowerCase()))) {
            sanitized[key] = '[REDACTED]';
        }
    });

    return sanitized;
};

// Get client IP address
const getClientIp = (req: Request): string => {
    return (
        req.headers['x-forwarded-for'] as string ||
        req.headers['x-real-ip'] as string ||
        req.connection.remoteAddress ||
        req.socket.remoteAddress ||
        (req.connection as any)?.socket?.remoteAddress ||
        'unknown'
    );
};

// Extract user ID from authenticated request
const getUserId = (req: any): string | undefined => {
    return req.user?.userId || req.user?.id;
};

// Check if route should be logged (skip health checks, static files, etc.)
const shouldLogRoute = (url: string): boolean => {
    const skipRoutes = ['/health', '/favicon.ico', '/robots.txt'];
    const skipPatterns = [/\.(css|js|png|jpg|gif|ico|svg|woff|woff2|ttf|eot)$/i];

    if (skipRoutes.includes(url)) return false;
    if (skipPatterns.some(pattern => pattern.test(url))) return false;

    return true;
};

// Determine log level based on status code
const getLogLevel = (statusCode: number): string => {
    if (statusCode >= 500) return 'error';
    if (statusCode >= 400) return 'warn';
    if (statusCode >= 300) return 'info';
    return 'info';
};

export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
    const startTime = Date.now();
    const requestId = generateRequestId();
    const timestamp = new Date().toISOString();

    // Add request ID to request object for use in other middlewares
    (req as any).requestId = requestId;

    // Skip logging for certain routes
    if (!shouldLogRoute(req.url)) {
        return next();
    }

    // Prepare request log data
    const requestLogData: RequestLogData = {
        method: req.method,
        url: req.url,
        ip: getClientIp(req),
        userAgent: req.headers['user-agent'],
        userId: getUserId(req),
        timestamp,
        requestId,
        query: Object.keys(req.query).length > 0 ? req.query : undefined,
        params: Object.keys(req.params).length > 0 ? req.params : undefined,
        body: req.method !== 'GET' && req.body ? sanitizeBody(req.body) : undefined
    };

    // Log incoming request
    logger.info('Incoming request', {
        type: 'request',
        ...requestLogData
    });

    // Store original end function
    const originalEnd = res.end;
    const originalSend = res.send;

    let responseBody: any;
    let isResponseLogged = false;

    // Override res.send to capture response body
    res.send = function (body: any) {
        if (!isResponseLogged) {
            responseBody = body;
        }
        return originalSend.call(this, body);
    };

    // Override res.end to log response
    res.end = function (chunk: any, encoding?: any) {
        if (!isResponseLogged) {
            const endTime = Date.now();
            const responseTime = endTime - startTime;

            // Prepare response log data
            const responseLogData: ResponseLogData = {
                ...requestLogData,
                statusCode: res.statusCode,
                responseTime,
                contentLength: res.get('content-length'),
            };

            // Add error information for error responses
            if (res.statusCode >= 400) {
                let errorMessage = 'Unknown error';

                if (responseBody) {
                    try {
                        const parsed = typeof responseBody === 'string' ? JSON.parse(responseBody) : responseBody;
                        errorMessage = parsed.error || parsed.message || errorMessage;
                    } catch (e) {
                        errorMessage = typeof responseBody === 'string' ? responseBody : 'Parse error';
                    }
                }

                responseLogData.error = errorMessage;
            }

            // Determine log level and log response
            const logLevel = getLogLevel(res.statusCode);
            const logMessage = `${req.method} ${req.url} - ${res.statusCode} - ${responseTime}ms`;

            logger[logLevel as keyof typeof logger](logMessage, {
                type: 'response',
                ...responseLogData
            });

            // Log slow requests (> 1 second)
            if (responseTime > 1000) {
                logger.warn('Slow request detected', {
                    type: 'performance',
                    ...responseLogData,
                    threshold: '1000ms'
                });
            }

            isResponseLogged = true;
        }

        return originalEnd.call(this, chunk, encoding);
    };

    // Handle response finish event as backup
    res.on('finish', () => {
        if (!isResponseLogged) {
            const endTime = Date.now();
            const responseTime = endTime - startTime;

            const responseLogData: ResponseLogData = {
                ...requestLogData,
                statusCode: res.statusCode,
                responseTime,
                contentLength: res.get('content-length'),
            };

            const logLevel = getLogLevel(res.statusCode);
            const logMessage = `${req.method} ${req.url} - ${res.statusCode} - ${responseTime}ms`;

            logger[logLevel as keyof typeof logger](logMessage, {
                type: 'response',
                ...responseLogData
            });

            isResponseLogged = true;
        }
    });

    next();
};

// Enhanced request logger with additional features
export const enhancedRequestLogger = (options: {
    skipRoutes?: string[];
    skipPatterns?: RegExp[];
    logRequestBody?: boolean;
    logResponseBody?: boolean;
    slowRequestThreshold?: number;
} = {}) => {
    const {
        skipRoutes = ['/health', '/favicon.ico', '/robots.txt'],
        skipPatterns = [/\.(css|js|png|jpg|gif|ico|svg|woff|woff2|ttf|eot)$/i],
        logRequestBody = true,
        logResponseBody = false,
        slowRequestThreshold = 1000
    } = options;

    const shouldSkipRoute = (url: string): boolean => {
        if (skipRoutes.includes(url)) return true;
        if (skipPatterns.some(pattern => pattern.test(url))) return true;
        return false;
    };

    return (req: Request, res: Response, next: NextFunction): void => {
        if (shouldSkipRoute(req.url)) {
            return next();
        }

        const startTime = Date.now();
        const requestId = generateRequestId();

        (req as any).requestId = requestId;

        const requestData = {
            requestId,
            method: req.method,
            url: req.url,
            ip: getClientIp(req),
            userAgent: req.headers['user-agent'],
            userId: getUserId(req),
            timestamp: new Date().toISOString(),
            query: Object.keys(req.query).length > 0 ? req.query : undefined,
            params: Object.keys(req.params).length > 0 ? req.params : undefined,
            body: logRequestBody && req.method !== 'GET' && req.body ? sanitizeBody(req.body) : undefined
        };

        logger.info('Request started', { type: 'request_start', ...requestData });

        const originalSend = res.send;
        let responseData: any;

        if (logResponseBody) {
            res.send = function (body: any) {
                responseData = body;
                return originalSend.call(this, body);
            };
        }

        res.on('finish', () => {
            const endTime = Date.now();
            const responseTime = endTime - startTime;

            const responseLogData = {
                ...requestData,
                statusCode: res.statusCode,
                responseTime,
                contentLength: res.get('content-length'),
                responseBody: logResponseBody && responseData ? sanitizeBody(responseData) : undefined
            };

            const logLevel = getLogLevel(res.statusCode);
            const message = `${req.method} ${req.url} - ${res.statusCode} - ${responseTime}ms`;

            logger[logLevel as keyof typeof logger](message, {
                type: 'request_complete',
                ...responseLogData
            });

            if (responseTime > slowRequestThreshold) {
                logger.warn('Slow request detected', {
                    type: 'slow_request',
                    ...responseLogData,
                    threshold: `${slowRequestThreshold}ms`
                });
            }
        });

        next();
    };
};

export default requestLogger;