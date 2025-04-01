import { User } from ".prisma/client"
import { Request } from "express"

export type AuthResponse = {
    success: boolean,
    message: string,
    data: {
        user: Partial<User>,
        token: string
    }
}

export interface ProtectedRequest extends Request{
    user?: User
}