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

const verifyTokenWithSecret = (
    token: string,
    secret?: string,
): AuthTokenPayload | null => {
    if (!secret) {
        return null;
    }

    try {
        return jwt.verify(token, secret) as AuthTokenPayload;
    } catch (_error) {
        return null;
    }
};

const getBearerToken = (req: Request): string | null => {
    const authHeader = req.headers.authorization || req.headers.Authorization;
    if (typeof authHeader !== "string" || !authHeader.startsWith("Bearer ")) {
        return null;
    }

    return authHeader.split(" ")[1] ?? null;
};

const authenticateJWT = (req: AuthRequest, res: Response, next: NextFunction) => {
    const token = getBearerToken(req);
    if (!token) {
        res.status(401).json({ error: "Not an authorized user" });
        return;
    }

    const user =
        verifyTokenWithSecret(token, process.env.JWT_SECRET) ??
        verifyTokenWithSecret(token, process.env.JWT_SECRET_ADMIN);

    if (!user) {
        res.status(401).json({ error: "Invalid or expired token" });
        return;
    }

    req.user = user;
    next();
};

const authenticateAdminJWT = (req: AuthRequest, res: Response, next: NextFunction) => {
    const token = getBearerToken(req);
    if (!token) {
        res.status(401).json({ error: "Not an authorized user" });
        return;
    }

    const user = verifyTokenWithSecret(token, process.env.JWT_SECRET_ADMIN);
    if (!user || user.role !== "admin") {
        res.status(403).json({ error: "Admin access required" });
        return;
    }

    req.user = user;
    next();
};

const authorizeRoles = (...roles: UserRole[]) => {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        if (!req.user) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }

        if (!roles.includes(req.user.role)) {
            res.status(403).json({
                error: "Insufficient permissions",
                allowedRoles: roles,
                currentRole: req.user.role,
            });
            return;
        }

        next();
    };
};

export { authenticateJWT, authenticateAdminJWT, authorizeRoles };
export type { AuthRequest };
