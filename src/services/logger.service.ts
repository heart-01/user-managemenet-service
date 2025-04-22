import type { Request } from 'express';
import winston from 'winston';
import { LOG_LEVEL } from '../config/dotenv';

const sanitize = (body: any) => {
  // check if body is empty
  if (Object.keys(body).length === 0) return '';
  // check if body is an error
  if (body.stack) return `\n${body.stack}`;
  // secure fields
  const fieldsToSanitize = ['apikey'];
  const sanitizedBody = { ...body };
  fieldsToSanitize.forEach((key) => {
    if (sanitizedBody[key]) sanitizedBody[key] = '***';
  });
  // return sanitized body
  return `\n${JSON.stringify(sanitizedBody)}`;
};

const consoleTransport = new winston.transports.Console({
  format: winston.format.combine(
    winston.format.timestamp(), // add info.timestamp for console
    winston.format.colorize(), // add colors format for console
    winston.format.printf(
      ({ timestamp, level, message, unixTimestamp, additionalInfo }) =>
        `${timestamp} ${level}: ${message} at ${unixTimestamp}${sanitize(additionalInfo)}`,
    ),
  ),
});

const logger = winston.createLogger({
  level: LOG_LEVEL,
  transports: [consoleTransport],
  format: winston.format.combine(
    winston.format.errors({ stack: true }), // add info.stack when error
    winston.format((info) => {
      // meta exclude level, message
      const { ...meta } = info;
      if (info.stack) meta.stack = info.stack; // add stack to meta
      // remove all keys except level and message (cannot use {level, message} because it cannot declare TransformableInfo)
      const clearInfo = { ...info };
      Object.keys(info).forEach((key) => {
        if (key !== 'level' && key !== 'message') delete clearInfo[key];
      });
      clearInfo.additionalInfo = meta; // Grouping all metadata (including error stack) together into additionalInfo
      clearInfo.unixTimestamp = new Date().getTime(); // insert unixTimestamp into info for monitoring of AWS CloudWatch
      return clearInfo;
    })(),
  ),
});

const start = (request: Request) => {
  logger.log('info', `Requesting ${request.method} ${request.originalUrl} started`, {
    tags: 'http',
    additionalInfo: {
      body: request.body,
      query: request.query,
    },
  });
  // log headers when debug
  logger.log('debug', `Headers of ${request.method} ${request.originalUrl}`, request.headers);
};

const end = (request: Request) => {
  logger.log('info', `Requesting ${request.method} ${request.originalUrl} ended`);
};

const info = (message: string) => {
  logger.log('info', message);
};

const debug = (message: string, data: any) => {
  logger.log('debug', message, data);
};

const error = (exception: any) => {
  logger.log('error', JSON.stringify(exception));
};

export default { start, end, error, info, debug };
