import { NextFunction, Request, Response } from "express";
import AppError from "../errors/AppError";

export const errorHandler = (err: AppError, req: Request, res: Response, next: NextFunction): any => {
    const response = {
        success: false,
        message: err.message || "Internal Server Error"
    };

    return res.status(err.statusCode || 500).json(response);
}