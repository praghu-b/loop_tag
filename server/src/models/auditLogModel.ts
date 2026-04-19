import mongoose, { Document, Model, Schema } from "mongoose";

export type AuditEventType =
  | "LOGIN"
  | "SHIPMENT_CREATED"
  | "SHIPMENT_TRANSITION"
  | "NFC_PAYLOAD_ISSUED"
  | "NFC_PAYLOAD_VERIFIED"
  | "NFC_PAYLOAD_VERIFY_FAILED";

export interface AuditLogDocument extends Document {
  eventType: AuditEventType;
  actorUserId?: mongoose.Types.ObjectId;
  actorRole?: string;
  resourceType?: string;
  resourceId?: mongoose.Types.ObjectId;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

const auditLogSchema = new Schema<AuditLogDocument>(
  {
    eventType: {
      type: String,
      required: true,
      enum: [
        "LOGIN",
        "SHIPMENT_CREATED",
        "SHIPMENT_TRANSITION",
        "NFC_PAYLOAD_ISSUED",
        "NFC_PAYLOAD_VERIFIED",
        "NFC_PAYLOAD_VERIFY_FAILED",
      ],
    },
    actorUserId: { type: Schema.Types.ObjectId, ref: "User" },
    actorRole: { type: String },
    resourceType: { type: String },
    resourceId: { type: Schema.Types.ObjectId },
    metadata: { type: Schema.Types.Mixed },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    versionKey: false,
    collection: "audit_logs",
  },
);

// Enforce append-only behavior at model level.
auditLogSchema.pre("updateOne", function () {
  throw new Error("Audit logs are immutable and cannot be updated.");
});

auditLogSchema.pre("findOneAndUpdate", function () {
  throw new Error("Audit logs are immutable and cannot be updated.");
});

auditLogSchema.pre("deleteOne", function () {
  throw new Error("Audit logs are immutable and cannot be deleted.");
});

auditLogSchema.pre("findOneAndDelete", function () {
  throw new Error("Audit logs are immutable and cannot be deleted.");
});

const AuditLog: Model<AuditLogDocument> =
  mongoose.models.AuditLog ||
  mongoose.model<AuditLogDocument>("AuditLog", auditLogSchema);

export default AuditLog;
