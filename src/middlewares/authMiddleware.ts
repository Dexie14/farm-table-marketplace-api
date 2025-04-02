import { NextFunction, Request, Response } from "express";
import AppError from "../errors/AppError";
import { verifyToken } from "../utils/jwt";
import { PrismaClient , Prisma} from "@prisma/client";
import { ProtectedRequest } from "../utils/types";
import { asyncHandler } from "../utils/asyncHandler";
import type { User } from '@prisma/client';

const prisma = new PrismaClient();

//create a type for the user model
//type User = Prisma.UserGetPayload<{}>;

export const authMiddleware = asyncHandler(async (req: ProtectedRequest, res: Response, next: NextFunction) => {
    const authorization = req.headers.authorization;
    const token = authorization?.split(" ")[1];

    if (!token) throw new AppError("Token not found", 401);

    const decoded = verifyToken(token);
    if (!decoded) throw new AppError("Invalid Authorization Token", 401)

    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    if (!user) throw new AppError("User not found", 401);

    const { password, ...userWithoutPassword } = user
    req.user = userWithoutPassword as User;
    next();
});

export const authorizeRoles = (...roles: string[]) => {
    return (req: ProtectedRequest, res: Response, next: NextFunction): void => {
       if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }
     
      if (!roles.includes(req.user!.role)) {
        res.status(403).json({ error: 'Access denied' });
        return;
      }
      
      next();
    };
  };