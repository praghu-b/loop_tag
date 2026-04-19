import express from "express";
import multer from "multer";
import {
    getAllProducts,
    addProduct,
    getProductById
} from "../controllers/productController";
import {
    authenticateJWT,
    authorizeRoles,
} from "../middleware/authMiddleware";

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ storage });

router.get(
    '/',
    authenticateJWT,
    authorizeRoles('admin', 'manufacturer'),
    getAllProducts,
);
router.get(
    '/:id',
    authenticateJWT,
    authorizeRoles('admin', 'manufacturer', 'seller_pickup'),
    getProductById,
);
router.post(
    '/',
    authenticateJWT,
    authorizeRoles('admin', 'manufacturer'),
    upload.array('photos', 5),
    addProduct,
);

export default router;
