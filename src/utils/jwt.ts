import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET as string;
export const generateToken = (userId: number): string => {
    return jwt.sign({ userId }, SECRET, { expiresIn: "1h" })
}

export const verifyToken = (token: string) => {
    try {
        return jwt.verify(token, SECRET) as { userId: number };
    } catch (error) {
        return null;
    }
}