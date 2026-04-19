import express from "express";
import {
  createShipment,
  getShipmentById,
  listShipments,
  transitionShipment,
} from "../controllers/shipmentController";
import {
  authenticateJWT,
  authorizeRoles,
} from "../middleware/authMiddleware";

const router = express.Router();

router.use(authenticateJWT);
router.get("/", listShipments);
router.get("/:id", getShipmentById);
router.post("/", authorizeRoles("admin", "manufacturer"), createShipment);
router.patch("/:id/transition", transitionShipment);

export default router;
