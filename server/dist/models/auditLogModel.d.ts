import mongoose, { Document, Model } from "mongoose";
export type AuditEventType = "LOGIN" | "SHIPMENT_CREATED" | "SHIPMENT_TRANSITION" | "NFC_PAYLOAD_ISSUED" | "NFC_PAYLOAD_VERIFIED" | "NFC_PAYLOAD_VERIFY_FAILED";
export interface AuditLogDocument extends Document {
    eventType: AuditEventType;
    actorUserId?: mongoose.Types.ObjectId;
    actorRole?: string;
    resourceType?: string;
    resourceId?: mongoose.Types.ObjectId;
    metadata?: Record<string, unknown>;
    createdAt: Date;
}
declare const AuditLog: Model<AuditLogDocument>;
export default AuditLog;
