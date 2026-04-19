import express from "express";
import {
  issueSignedPayload,
  verifySignedPayload,
} from "../controllers/nfcPayloadController";
import {
  authenticateJWT,
  authorizeRoles,
} from "../middleware/authMiddleware";

const router = express.Router();

router.use(authenticateJWT);
router.post(
  "/issue",
  authorizeRoles("admin", "manufacturer"),
  issueSignedPayload,
);
router.post(
  "/verify",
  authorizeRoles("admin", "manufacturer", "seller_pickup"),
  verifySignedPayload,
);

export default router;
