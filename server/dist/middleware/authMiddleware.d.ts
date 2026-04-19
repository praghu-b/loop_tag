import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
interface AuthRequest extends Request {
    user?: AuthTokenPayload;
}
export type UserRole = "admin" | "manufacturer" | "seller_pickup";
export interface AuthTokenPayload extends jwt.JwtPayload {
    userId: string;
    email: string;
    role: UserRole;
}
declare const authenticateJWT: (req: AuthRequest, res: Response, next: NextFunction) => void;
declare const authenticateAdminJWT: (req: AuthRequest, res: Response, next: NextFunction) => void;
declare const authorizeRoles: (...roles: UserRole[]) => (req: AuthRequest, res: Response, next: NextFunction) => void;
export { authenticateJWT, authenticateAdminJWT, authorizeRoles };
export type { AuthRequest };
