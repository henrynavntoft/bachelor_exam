import { Request, Response, NextFunction } from 'express';

//////////////////////////////////////////////////////////////////////////////////
// Global error handler middleware
export function errorHandler(err: Error, req: Request, res: Response, next: NextFunction) {
    console.error('Error:', err.message);
    if (res.headersSent) return next(err);
    res.status(500).json({
        message: 'Internal Server Error',
        error: process.env.RTE === 'dev' ? err.message : undefined,
    });
}