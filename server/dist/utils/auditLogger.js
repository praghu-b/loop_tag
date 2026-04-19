"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logAuditEvent = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const auditLogModel_1 = __importDefault(require("../models/auditLogModel"));
const toObjectId = (value) => {
    if (!value || !mongoose_1.default.Types.ObjectId.isValid(value)) {
        return undefined;
    }
    return new mongoose_1.default.Types.ObjectId(value);
};
const logAuditEvent = async ({ req, eventType, resourceType, resourceId, metadata, }) => {
    const actorUserId = toObjectId(req?.user?.userId);
    const parsedResourceId = toObjectId(resourceId);
    await auditLogModel_1.default.create({
        eventType,
        actorUserId,
        actorRole: req?.user?.role,
        resourceType,
        resourceId: parsedResourceId,
        metadata,
    });
};
exports.logAuditEvent = logAuditEvent;
//# sourceMappingURL=auditLogger.js.map