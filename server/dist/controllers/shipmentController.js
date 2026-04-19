"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.transitionShipment = exports.listShipments = exports.getShipmentById = exports.createShipment = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const mongoose_1 = __importDefault(require("mongoose"));
const productModel_1 = __importDefault(require("../models/productModel"));
const shipmentModel_1 = __importDefault(require("../models/shipmentModel"));
const shipmentStateModel_1 = __importDefault(require("../models/shipmentStateModel"));
const auditLogger_1 = require("../utils/auditLogger");
const allowedTransitions = {
    CREATED: ["TAG_WRITTEN"],
    TAG_WRITTEN: ["PICKED_UP"],
    PICKED_UP: ["IN_TRANSIT"],
    IN_TRANSIT: ["DELIVERED"],
    DELIVERED: ["HANDOVER_COMPLETE"],
    HANDOVER_COMPLETE: [],
};
const canRoleApplyState = (role, nextState) => {
    if (role === "admin") {
        return true;
    }
    if (nextState === "TAG_WRITTEN") {
        return role === "manufacturer";
    }
    return role === "seller_pickup";
};
const createShipment = (0, express_async_handler_1.default)(async (req, res) => {
    const { productId, destination, sellerPickupId } = req.body;
    if (!req.user) {
        res.status(401).json({ message: "Unauthorized" });
        return;
    }
    if (!productId || !mongoose_1.default.Types.ObjectId.isValid(productId)) {
        res.status(400).json({ message: "A valid productId is required." });
        return;
    }
    const product = await productModel_1.default.findById(productId);
    if (!product) {
        res.status(404).json({ message: "Product not found." });
        return;
    }
    const shipment = await shipmentModel_1.default.create({
        productId,
        manufacturerId: req.user.userId,
        sellerPickupId: sellerPickupId && mongoose_1.default.Types.ObjectId.isValid(sellerPickupId)
            ? sellerPickupId
            : undefined,
        destination,
        currentState: "CREATED",
    });
    await shipmentStateModel_1.default.create({
        shipmentId: shipment._id,
        toState: "CREATED",
        transitionedByUserId: req.user.userId,
        note: "Shipment created",
    });
    await (0, auditLogger_1.logAuditEvent)({
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
exports.createShipment = createShipment;
const listShipments = (0, express_async_handler_1.default)(async (req, res) => {
    if (!req.user) {
        res.status(401).json({ message: "Unauthorized" });
        return;
    }
    if (req.user.role === "manufacturer" || req.user.role === "admin") {
        const shipments = await shipmentModel_1.default.find({}).sort({ createdAt: -1 });
        res.status(200).json(shipments);
        return;
    }
    const shipments = await shipmentModel_1.default.find({
        $or: [{ sellerPickupId: req.user.userId }, { currentState: "TAG_WRITTEN" }],
    }).sort({ createdAt: -1 });
    res.status(200).json(shipments);
});
exports.listShipments = listShipments;
const getShipmentById = (0, express_async_handler_1.default)(async (req, res) => {
    const { id } = req.params;
    if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
        res.status(400).json({ message: "Invalid shipment id." });
        return;
    }
    const shipment = await shipmentModel_1.default.findById(id);
    if (!shipment) {
        res.status(404).json({ message: "Shipment not found." });
        return;
    }
    const history = await shipmentStateModel_1.default.find({ shipmentId: id }).sort({
        createdAt: 1,
    });
    res.status(200).json({ shipment, history });
});
exports.getShipmentById = getShipmentById;
const transitionShipment = (0, express_async_handler_1.default)(async (req, res) => {
    const { id } = req.params;
    const { nextState, note } = req.body;
    if (!req.user) {
        res.status(401).json({ message: "Unauthorized" });
        return;
    }
    if (!nextState) {
        res.status(400).json({ message: "nextState is required." });
        return;
    }
    if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
        res.status(400).json({ message: "Invalid shipment id." });
        return;
    }
    const shipment = await shipmentModel_1.default.findById(id);
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
        shipment.sellerPickupId = new mongoose_1.default.Types.ObjectId(req.user.userId);
    }
    await shipment.save();
    await shipmentStateModel_1.default.create({
        shipmentId: shipment._id,
        fromState: previousState,
        toState: nextState,
        transitionedByUserId: req.user.userId,
        note,
    });
    await (0, auditLogger_1.logAuditEvent)({
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
exports.transitionShipment = transitionShipment;
//# sourceMappingURL=shipmentController.js.map