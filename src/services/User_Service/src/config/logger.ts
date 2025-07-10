import fs from 'fs';
import path from 'path';
import winston from 'winston';
import { config } from './environments';

const logDir = path.resolve('logs');

if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
}

const { combine, timestamp, errors, json, printf, colorize } = winston.format;

const consoleFormat = printf(({ level, message, timestamp, stack }) => {
    return `${timestamp} [${level}]: ${stack || message}`;
});

const logger = winston.createLogger({
    level: config.LOG_LEVEL,
    format: combine(
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        errors({ stack: true }),
        json()
    ),
    defaultMeta: {
        service: 'user-management-service',
        environment: config.NODE_ENV
    },
    transports: [
        new winston.transports.Console({
            format: combine(
                colorize(),
                timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
                consoleFormat
            )
        }),
    ],
});

if (config.NODE_ENV === 'production') {
    logger.add(new winston.transports.File({
        filename: path.join(logDir, 'error.log'),
        level: 'error',
        maxsize: 5242880,
        maxFiles: 5,
    }));

    logger.add(new winston.transports.File({
        filename: path.join(logDir, 'combined.log'),
        maxsize: 5242880,
        maxFiles: 5,
    }));
}

export default logger;
