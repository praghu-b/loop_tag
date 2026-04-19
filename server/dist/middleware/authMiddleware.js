"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorizeRoles = exports.authenticateAdminJWT = exports.authenticateJWT = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const verifyTokenWithSecret = (token, secret) => {
    if (!secret) {
        return null;
    }
    try {
        return jsonwebtoken_1.default.verify(token, secret);
    }
    catch (_error) {
        return null;
    }
};
const getBearerToken = (req) => {
    const authHeader = req.headers.authorization || req.headers.Authorization;
    if (typeof authHeader !== "string" || !authHeader.startsWith("Bearer ")) {
        return null;
    }
    return authHeader.split(" ")[1] ?? null;
};
const authenticateJWT = (req, res, next) => {
    const token = getBearerToken(req);
    if (!token) {
        res.status(401).json({ error: "Not an authorized user" });
        return;
    }
    const user = verifyTokenWithSecret(token, process.env.JWT_SECRET) ??
        verifyTokenWithSecret(token, process.env.JWT_SECRET_ADMIN);
    if (!user) {
        res.status(401).json({ error: "Invalid or expired token" });
        return;
    }
    req.user = user;
    next();
};
exports.authenticateJWT = authenticateJWT;
const authenticateAdminJWT = (req, res, next) => {
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
exports.authenticateAdminJWT = authenticateAdminJWT;
const authorizeRoles = (...roles) => {
    return (req, res, next) => {
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
exports.authorizeRoles = authorizeRoles;
//# sourceMappingURL=authMiddleware.js.map