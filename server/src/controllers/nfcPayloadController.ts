import asyncHandler from "express-async-handler";
import { Response } from "express";
import mongoose from "mongoose";
import { AuthRequest } from "../middleware/authMiddleware";
import Shipment from "../models/shipmentModel";
import {
  generateNonce,
  serializePayload,
  signSerializedPayload,
  verifySerializedPayload,
  SignedNfcPayload,
} from "../utils/signatureService";
import { logAuditEvent } from "../utils/auditLogger";

const issueSignedPayload = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { shipmentId, productId } = req.body;

  if (!req.user) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  if (!shipmentId || !mongoose.Types.ObjectId.isValid(shipmentId)) {
    res.status(400).json({ message: "A valid shipmentId is required." });
    return;
  }

  if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
    res.status(400).json({ message: "A valid productId is required." });
    return;
  }

  const shipment = await Shipment.findById(shipmentId);
  if (!shipment) {
    res.status(404).json({ message: "Shipment not found." });
    return;
  }

  if (shipment.productId.toString() !== productId) {
    res.status(400).json({ message: "Shipment/product mismatch." });
    return;
  }

  const payload: SignedNfcPayload = {
    shipmentId,
    productId,
    issuerUserId: req.user.userId,
    issuedAt: new Date().toISOString(),
    nonce: generateNonce(),
    version: 1,
  };

  const serializedPayload = serializePayload(payload);
  const signature = signSerializedPayload(serializedPayload);

  await logAuditEvent({
    req,
    eventType: "NFC_PAYLOAD_ISSUED",
    resourceType: "Shipment",
    resourceId: shipmentId,
    metadata: {
      productId,
      nonce: payload.nonce,
      issuedAt: payload.issuedAt,
    },
  });

  res.status(200).json({
    payload,
    signature,
    serializedPayload,
  });
});

const verifySignedPayload = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { serializedPayload, signature } = req.body;

  if (!serializedPayload || typeof serializedPayload !== "string") {
    res.status(400).json({ message: "serializedPayload is required." });
    return;
  }

  if (!signature || typeof signature !== "string") {
    res.status(400).json({ message: "signature is required." });
    return;
  }

  const validSignature = verifySerializedPayload(serializedPayload, signature);
  if (!validSignature) {
    await logAuditEvent({
      req,
      eventType: "NFC_PAYLOAD_VERIFY_FAILED",
      resourceType: "NfcPayload",
      metadata: {
        reason: "Signature mismatch",
      },
    });

    res.status(401).json({
      valid: false,
      message: "Invalid signature.",
    });
    return;
  }

  let parsedPayload: SignedNfcPayload;
  try {
    parsedPayload = JSON.parse(serializedPayload) as SignedNfcPayload;
  } catch (_error) {
    res.status(400).json({ valid: false, message: "Invalid payload format." });
    return;
  }

  if (
    !parsedPayload.shipmentId ||
    !parsedPayload.productId ||
    !mongoose.Types.ObjectId.isValid(parsedPayload.shipmentId) ||
    !mongoose.Types.ObjectId.isValid(parsedPayload.productId)
  ) {
    res.status(400).json({ valid: false, message: "Payload has invalid identifiers." });
    return;
  }

  const shipment = await Shipment.findById(parsedPayload.shipmentId);
  if (!shipment) {
    res.status(404).json({ valid: false, message: "Shipment not found." });
    return;
  }

  if (shipment.productId.toString() !== parsedPayload.productId) {
    res.status(400).json({ valid: false, message: "Payload product mismatch." });
    return;
  }

  await logAuditEvent({
    req,
    eventType: "NFC_PAYLOAD_VERIFIED",
    resourceType: "Shipment",
    resourceId: parsedPayload.shipmentId,
    metadata: {
      productId: parsedPayload.productId,
      nonce: parsedPayload.nonce,
      currentState: shipment.currentState,
    },
  });

  res.status(200).json({
    valid: true,
    payload: parsedPayload,
    shipmentState: shipment.currentState,
  });
});

export { issueSignedPayload, verifySignedPayload };
