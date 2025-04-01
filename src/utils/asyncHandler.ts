import { NextFunction, Request, Response } from "express";

type ExpressRouteHander<T extends Request = Request> = (req: T, res: Response, next: NextFunction) => Promise<any>
export const asyncHandler = <T extends Request>(fn: ExpressRouteHander<T>) => {
    return async (req: T, res: Response, next: NextFunction): Promise<any> => {
        try {
            await fn(req, res, next);
        } catch (error) {
            next(error)
        }
    }
}