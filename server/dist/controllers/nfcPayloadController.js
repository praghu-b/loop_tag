"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifySignedPayload = exports.issueSignedPayload = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const mongoose_1 = __importDefault(require("mongoose"));
const shipmentModel_1 = __importDefault(require("../models/shipmentModel"));
const signatureService_1 = require("../utils/signatureService");
const auditLogger_1 = require("../utils/auditLogger");
const issueSignedPayload = (0, express_async_handler_1.default)(async (req, res) => {
    const { shipmentId, productId } = req.body;
    if (!req.user) {
        res.status(401).json({ message: "Unauthorized" });
        return;
    }
    if (!shipmentId || !mongoose_1.default.Types.ObjectId.isValid(shipmentId)) {
        res.status(400).json({ message: "A valid shipmentId is required." });
        return;
    }
    if (!productId || !mongoose_1.default.Types.ObjectId.isValid(productId)) {
        res.status(400).json({ message: "A valid productId is required." });
        return;
    }
    const shipment = await shipmentModel_1.default.findById(shipmentId);
    if (!shipment) {
        res.status(404).json({ message: "Shipment not found." });
        return;
    }
    if (shipment.productId.toString() !== productId) {
        res.status(400).json({ message: "Shipment/product mismatch." });
        return;
    }
    const payload = {
        shipmentId,
        productId,
        issuerUserId: req.user.userId,
        issuedAt: new Date().toISOString(),
        nonce: (0, signatureService_1.generateNonce)(),
        version: 1,
    };
    const serializedPayload = (0, signatureService_1.serializePayload)(payload);
    const signature = (0, signatureService_1.signSerializedPayload)(serializedPayload);
    await (0, auditLogger_1.logAuditEvent)({
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
exports.issueSignedPayload = issueSignedPayload;
const verifySignedPayload = (0, express_async_handler_1.default)(async (req, res) => {
    const { serializedPayload, signature } = req.body;
    if (!serializedPayload || typeof serializedPayload !== "string") {
        res.status(400).json({ message: "serializedPayload is required." });
        return;
    }
    if (!signature || typeof signature !== "string") {
        res.status(400).json({ message: "signature is required." });
        return;
    }
    const validSignature = (0, signatureService_1.verifySerializedPayload)(serializedPayload, signature);
    if (!validSignature) {
        await (0, auditLogger_1.logAuditEvent)({
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
    let parsedPayload;
    try {
        parsedPayload = JSON.parse(serializedPayload);
    }
    catch (_error) {
        res.status(400).json({ valid: false, message: "Invalid payload format." });
        return;
    }
    if (!parsedPayload.shipmentId ||
        !parsedPayload.productId ||
        !mongoose_1.default.Types.ObjectId.isValid(parsedPayload.shipmentId) ||
        !mongoose_1.default.Types.ObjectId.isValid(parsedPayload.productId)) {
        res.status(400).json({ valid: false, message: "Payload has invalid identifiers." });
        return;
    }
    const shipment = await shipmentModel_1.default.findById(parsedPayload.shipmentId);
    if (!shipment) {
        res.status(404).json({ valid: false, message: "Shipment not found." });
        return;
    }
    if (shipment.productId.toString() !== parsedPayload.productId) {
        res.status(400).json({ valid: false, message: "Payload product mismatch." });
        return;
    }
    await (0, auditLogger_1.logAuditEvent)({
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
exports.verifySignedPayload = verifySignedPayload;
//# sourceMappingURL=nfcPayloadController.js.map