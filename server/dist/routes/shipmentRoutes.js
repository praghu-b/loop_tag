"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const shipmentController_1 = require("../controllers/shipmentController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = express_1.default.Router();
router.use(authMiddleware_1.authenticateJWT);
router.get("/", shipmentController_1.listShipments);
router.get("/:id", shipmentController_1.getShipmentById);
router.post("/", (0, authMiddleware_1.authorizeRoles)("admin", "manufacturer"), shipmentController_1.createShipment);
router.patch("/:id/transition", shipmentController_1.transitionShipment);
exports.default = router;
//# sourceMappingURL=shipmentRoutes.js.map