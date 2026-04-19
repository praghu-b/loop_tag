import asyncHandler from "express-async-handler";
import { Response } from "express";
import mongoose from "mongoose";
import Product from "../models/productModel";
import Shipment, { ShipmentState } from "../models/shipmentModel";
import ShipmentStateHistory from "../models/shipmentStateModel";
import { AuthRequest } from "../middleware/authMiddleware";
import { logAuditEvent } from "../utils/auditLogger";

const allowedTransitions: Record<ShipmentState, ShipmentState[]> = {
  CREATED: ["TAG_WRITTEN"],
  TAG_WRITTEN: ["PICKED_UP"],
  PICKED_UP: ["IN_TRANSIT"],
  IN_TRANSIT: ["DELIVERED"],
  DELIVERED: ["HANDOVER_COMPLETE"],
  HANDOVER_COMPLETE: [],
};

const canRoleApplyState = (role: string, nextState: ShipmentState): boolean => {
  if (role === "admin") {
    return true;
  }

  if (nextState === "TAG_WRITTEN") {
    return role === "manufacturer";
  }

  return role === "seller_pickup";
};

const createShipment = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { productId, destination, sellerPickupId } = req.body;

  if (!req.user) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
    res.status(400).json({ message: "A valid productId is required." });
    return;
  }

  const product = await Product.findById(productId);
  if (!product) {
    res.status(404).json({ message: "Product not found." });
    return;
  }

  const shipment = await Shipment.create({
    productId,
    manufacturerId: req.user.userId,
    sellerPickupId:
      sellerPickupId && mongoose.Types.ObjectId.isValid(sellerPickupId)
        ? sellerPickupId
        : undefined,
    destination,
    currentState: "CREATED",
  });

  await ShipmentStateHistory.create({
    shipmentId: shipment._id,
    toState: "CREATED",
    transitionedByUserId: req.user.userId,
    note: "Shipment created",
  });

  await logAuditEvent({
    req,
    eventType: "SHIPMENT_CREATED",
    resourceType: "Shipment",
    resourceId: shipment.id,
    metadata: {
      productId,
      destination,
    },
  });

  res.status(201).json(shipment);
});

const listShipments = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  if (req.user.role === "manufacturer" || req.user.role === "admin") {
    const shipments = await Shipment.find({}).sort({ createdAt: -1 });
    res.status(200).json(shipments);
    return;
  }

  const shipments = await Shipment.find({
    $or: [{ sellerPickupId: req.user.userId }, { currentState: "TAG_WRITTEN" }],
  }).sort({ createdAt: -1 });

  res.status(200).json(shipments);
});

const getShipmentById = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400).json({ message: "Invalid shipment id." });
    return;
  }

  const shipment = await Shipment.findById(id);
  if (!shipment) {
    res.status(404).json({ message: "Shipment not found." });
    return;
  }

  const history = await ShipmentStateHistory.find({ shipmentId: id }).sort({
    createdAt: 1,
  });

  res.status(200).json({ shipment, history });
});

const transitionShipment = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { nextState, note } = req.body as { nextState?: ShipmentState; note?: string };

  if (!req.user) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  if (!nextState) {
    res.status(400).json({ message: "nextState is required." });
    return;
  }

  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400).json({ message: "Invalid shipment id." });
    return;
  }

  const shipment = await Shipment.findById(id);
  if (!shipment) {
    res.status(404).json({ message: "Shipment not found." });
    return;
  }

  if (!canRoleApplyState(req.user.role, nextState)) {
    res.status(403).json({
      message: `Role ${req.user.role} cannot transition shipment to ${nextState}.`,
    });
    return;
  }

  const possibleStates = allowedTransitions[shipment.currentState];
  if (!possibleStates.includes(nextState)) {
    res.status(409).json({
      message: `Invalid transition from ${shipment.currentState} to ${nextState}.`,
      allowedNextStates: possibleStates,
    });
    return;
  }

  const previousState = shipment.currentState;
  shipment.currentState = nextState;

  if (req.user.role === "seller_pickup" && !shipment.sellerPickupId) {
    shipment.sellerPickupId = new mongoose.Types.ObjectId(req.user.userId);
  }

  await shipment.save();

  await ShipmentStateHistory.create({
    shipmentId: shipment._id,
    fromState: previousState,
    toState: nextState,
    transitionedByUserId: req.user.userId,
    note,
  });

  await logAuditEvent({
    req,
    eventType: "SHIPMENT_TRANSITION",
    resourceType: "Shipment",
    resourceId: shipment.id,
    metadata: {
      fromState: previousState,
      toState: nextState,
      note,
    },
  });

  res.status(200).json(shipment);
});

export {
  createShipment,
  getShipmentById,
  listShipments,
  transitionShipment,
};
