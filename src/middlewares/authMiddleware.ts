import { NextFunction, Request, Response } from "express";
import AppError from "../errors/AppError";
import { verifyToken } from "../utils/jwt";
import { PrismaClient, User } from ".prisma/client";
import { ProtectedRequest } from "../utils/types";
import { asyncHandler } from "../utils/asyncHandler";

const prisma = new PrismaClient();

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
  return (req: ProtectedRequest, res: Response, next: NextFunction) => {
    if (!roles.includes(req.user!.role)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    next();
  };
};
