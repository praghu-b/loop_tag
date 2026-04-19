import { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/UserModel";
import { AuthRequest, UserRole } from "../middleware/authMiddleware";
import { logAuditEvent } from "../utils/auditLogger";

const isValidRole = (role: unknown): role is UserRole => {
    return role === "manufacturer" || role === "seller_pickup";
};

const createTokenPair = (userId: string, email: string, role: UserRole, admin = false) => {
    const secret = admin
        ? process.env.JWT_SECRET_ADMIN
        : process.env.JWT_SECRET;

    if (!secret) {
        throw new Error("JWT secret is not configured.");
    }

    const payload = { userId, email, role };
    const accessToken = jwt.sign(payload, secret, { expiresIn: "1d" });
    const refreshToken = jwt.sign(payload, secret, { expiresIn: "7d" });

    return { accessToken, refreshToken };
};

//@desc Register a user
//@route POST /users/register
//@access public
const registerUser = asyncHandler(async (req: Request, res: Response) => {
    const { email, password, role } = req.body;

    if ( !email || !password) {
        res.status(401).json({ message: "All fields are mandatory!" });
        return;
    }

    if (role && !isValidRole(role)) {
        res.status(400).json({ message: "Invalid role provided." });
        return;
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
        res.status(400).json({ message: "User already exists try logging in!" });
        return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
        email: email,
        password: hashedPassword,
        role: role ?? "seller_pickup",
    });

    if (user) {
        const tokens = createTokenPair(
            user._id.toString(),
            user.email,
            user.role,
        );

        res.status(201).json({
            ...tokens,
            role: user.role,
            isAdmin: false,
        });

        await logAuditEvent({
            eventType: "LOGIN",
            resourceType: "User",
            resourceId: user._id.toString(),
            metadata: {
                eventSource: "register",
                role: user.role,
            },
        });
    } else {
        res.status(501).json({ message: "Some error occurred while creating user, try again!" });
    }
});

//@desc Login user
//@route POST /users/login
//@access public
const loginUser = asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body;

    if (!email || !password) {
        res.status(401).json({ message: "All fields are mandatory!" });
        return;
    }

    const user = await User.findOne({ email });

    if (!user) {
        res.status(404).json({ message: "No user found try creating one!" });
        return;
    }

    if (user && (email === process.env.ADMIN_EMAIL as string && password === process.env.ADMIN_PASSWORD as string)) {
        const tokens = createTokenPair(
            user._id.toString(),
            user.email,
            "admin",
            true,
        );

        res.status(200).json({
            ...tokens,
            role: "admin",
            isAdmin: true,
        });

        await logAuditEvent({
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
    else if (user && (await bcrypt.compare(password, user.password))) {
        const tokens = createTokenPair(
            user._id.toString(),
            user.email,
            user.role,
        );

        res.status(200).json({
            ...tokens,
            role: user.role,
            isAdmin: false,
        });

        await logAuditEvent({
            eventType: "LOGIN",
            resourceType: "User",
            resourceId: user._id.toString(),
            metadata: {
                eventSource: "login",
                role: user.role,
            },
        });
    } else {
        res.status(401).json({ message: 'Incorrect credentials' });
    }
});

//@desc Current user info
//@route POST /users/current
//@access private
const currentUser = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user) {
        res.status(401).json({ message: "Unauthorized" });
        return;
    }

    const user = await User.findById(req.user.userId);

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

export { registerUser, loginUser, currentUser };

