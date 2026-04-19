"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const nfcPayloadController_1 = require("../controllers/nfcPayloadController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = express_1.default.Router();
router.use(authMiddleware_1.authenticateJWT);
router.post("/issue", (0, authMiddleware_1.authorizeRoles)("admin", "manufacturer"), nfcPayloadController_1.issueSignedPayload);
router.post("/verify", (0, authMiddleware_1.authorizeRoles)("admin", "manufacturer", "seller_pickup"), nfcPayloadController_1.verifySignedPayload);
exports.default = router;
//# sourceMappingURL=nfcPayloadRoutes.js.map