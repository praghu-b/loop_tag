"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const productController_1 = require("../controllers/productController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = express_1.default.Router();
const storage = multer_1.default.memoryStorage();
const upload = (0, multer_1.default)({ storage });
router.get('/', authMiddleware_1.authenticateJWT, (0, authMiddleware_1.authorizeRoles)('admin', 'manufacturer'), productController_1.getAllProducts);
router.get('/:id', authMiddleware_1.authenticateJWT, (0, authMiddleware_1.authorizeRoles)('admin', 'manufacturer', 'seller_pickup'), productController_1.getProductById);
router.post('/', authMiddleware_1.authenticateJWT, (0, authMiddleware_1.authorizeRoles)('admin', 'manufacturer'), upload.array('photos', 5), productController_1.addProduct);
exports.default = router;
//# sourceMappingURL=productRoutes.js.map