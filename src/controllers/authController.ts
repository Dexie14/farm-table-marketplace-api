import { PrismaClient, User } from "@prisma/client";
import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import AppError from "../errors/AppError";
import { generateToken } from "../utils/jwt";
import { AuthResponse } from "../utils/types";
import { asyncHandler } from "../utils/asyncHandler";

const prisma = new PrismaClient()

type RegisterRequestInput = {
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    role: string,
}


type LoginRequestInput = {
    email: string,
    password: string
}

enum UserRole {
  FARMER = "FARMER",
  BUYER = "BUYER"
}


const getAuthResponse = (user: User, message?: string): AuthResponse => {
    const { password: _, ...userWithoutPassword } = user;
    const token = generateToken(user.id);
    const response: AuthResponse = {
        success: true,
        message: message || "Request Successful",
        data: { user: userWithoutPassword, token }
    };
    return response;
}

const register = asyncHandler(async (req: Request, res: Response): Promise<any> => {
    const { email, password, firstName, lastName, role }: RegisterRequestInput = req.body;

    if (!email || !password || !firstName || !lastName || !role) {
        throw new AppError("Please input all required fields", 400);
    }

    // Validate role
    if (!Object.values(UserRole).includes(role as UserRole)) {
        throw new AppError("Invalid role type. Role must be either 'FARMER' or 'BUYER'", 400);
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
        throw new AppError("Email address already exists", 409);
    }

    // Hash Password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Save User
    const user = await prisma.user.create({
        data: {
            firstName,
            lastName,
            email: email.toLowerCase(),
            password: hashedPassword,
            role: role as UserRole, // Explicitly cast role to UserRole
        }
    });

    const response = getAuthResponse(user, "User Registration Successful");
    return res.status(201).json(response);
});

const login = asyncHandler(async (req: Request, res: Response): Promise<any> => {
    const { email, password }: LoginRequestInput = req.body;

    if (!email || !password) {
        throw new AppError("Please input required fields", 400);
    }

    //Check if user exists
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
        throw new AppError("Email address not registered", 401);
    }

    //Check if password is correct
    const passwordIsValid = await bcrypt.compare(password, user.password)
    if (!passwordIsValid) {
        throw new AppError("Password is incorrect", 401);
    }

    const response = getAuthResponse(user, "User Login Successful")
    return res.status(200).json(response);
})

export default {
    register, login
}