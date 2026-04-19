"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.currentUser = exports.loginUser = exports.registerUser = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const UserModel_1 = __importDefault(require("../models/UserModel"));
const auditLogger_1 = require("../utils/auditLogger");
const isValidRole = (role) => {
    return role === "manufacturer" || role === "seller_pickup";
};
const createTokenPair = (userId, email, role, admin = false) => {
    const secret = admin
        ? process.env.JWT_SECRET_ADMIN
        : process.env.JWT_SECRET;
    if (!secret) {
        throw new Error("JWT secret is not configured.");
    }
    const payload = { userId, email, role };
    const accessToken = jsonwebtoken_1.default.sign(payload, secret, { expiresIn: "1d" });
    const refreshToken = jsonwebtoken_1.default.sign(payload, secret, { expiresIn: "7d" });
    return { accessToken, refreshToken };
};
//@desc Register a user
//@route POST /users/register
//@access public
const registerUser = (0, express_async_handler_1.default)(async (req, res) => {
    const { email, password, role } = req.body;
    if (!email || !password) {
        res.status(401).json({ message: "All fields are mandatory!" });
        return;
    }
    if (role && !isValidRole(role)) {
        res.status(400).json({ message: "Invalid role provided." });
        return;
    }
    const userExists = await UserModel_1.default.findOne({ email });
    if (userExists) {
        res.status(400).json({ message: "User already exists try logging in!" });
        return;
    }
    // Hash password
    const hashedPassword = await bcryptjs_1.default.hash(password, 10);
    const user = await UserModel_1.default.create({
        email: email,
        password: hashedPassword,
        role: role ?? "seller_pickup",
    });
    if (user) {
        const tokens = createTokenPair(user._id.toString(), user.email, user.role);
        res.status(201).json({
            ...tokens,
            role: user.role,
            isAdmin: false,
        });
        await (0, auditLogger_1.logAuditEvent)({
            eventType: "LOGIN",
            resourceType: "User",
            resourceId: user._id.toString(),
            metadata: {
                eventSource: "register",
                role: user.role,
            },
        });
    }
    else {
        res.status(501).json({ message: "Some error occurred while creating user, try again!" });
    }
});
exports.registerUser = registerUser;
//@desc Login user
//@route POST /users/login
//@access public
const loginUser = (0, express_async_handler_1.default)(async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        res.status(401).json({ message: "All fields are mandatory!" });
        return;
    }
    const user = await UserModel_1.default.findOne({ email });
    if (!user) {
        res.status(404).json({ message: "No user found try creating one!" });
        return;
    }
    if (user && (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD)) {
        const tokens = createTokenPair(user._id.toString(), user.email, "admin", true);
        res.status(200).json({
            ...tokens,
            role: "admin",
            isAdmin: true,
        });
        await (0, auditLogger_1.logAuditEvent)({
            eventType: "LOGIN",
            resourceType: "User",
            resourceId: user._id.toString(),
            metadata: {
                eventSource: "login",
                role: "admin",
            },
        });
    }
    // Compare password with hashed password
    else if (user && (await bcryptjs_1.default.compare(password, user.password))) {
        const tokens = createTokenPair(user._id.toString(), user.email, user.role);
        res.status(200).json({
            ...tokens,
            role: user.role,
            isAdmin: false,
        });
        await (0, auditLogger_1.logAuditEvent)({
            eventType: "LOGIN",
            resourceType: "User",
            resourceId: user._id.toString(),
            metadata: {
                eventSource: "login",
                role: user.role,
            },
        });
    }
    else {
        res.status(401).json({ message: 'Incorrect credentials' });
    }
});
exports.loginUser = loginUser;
//@desc Current user info
//@route POST /users/current
//@access private
const currentUser = (0, express_async_handler_1.default)(async (req, res) => {
    if (!req.user) {
        res.status(401).json({ message: "Unauthorized" });
        return;
    }
    const user = await UserModel_1.default.findById(req.user.userId);
    if (!user) {
        res.status(404).json({ message: "User not found" });
        return;
    }
    res.status(200).json({
        message: 'User success',
        user: {
            _id: user._id,
            email: user.email,
            role: user.role,
        },
    });
});
exports.currentUser = currentUser;
//# sourceMappingURL=UserController.js.map