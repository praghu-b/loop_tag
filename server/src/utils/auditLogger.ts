import mongoose from "mongoose";
import AuditLog, { AuditEventType } from "../models/auditLogModel";
import { AuthRequest } from "../middleware/authMiddleware";

interface LogAuditEventParams {
  req?: AuthRequest;
  eventType: AuditEventType;
  resourceType?: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
}

const toObjectId = (value?: string): mongoose.Types.ObjectId | undefined => {
  if (!value || !mongoose.Types.ObjectId.isValid(value)) {
    return undefined;
  }

  return new mongoose.Types.ObjectId(value);
};

export const logAuditEvent = async ({
  req,
  eventType,
  resourceType,
  resourceId,
  metadata,
}: LogAuditEventParams): Promise<void> => {
  const actorUserId = toObjectId(req?.user?.userId);
  const parsedResourceId = toObjectId(resourceId);

  await AuditLog.create({
    eventType,
    actorUserId,
    actorRole: req?.user?.role,
    resourceType,
    resourceId: parsedResourceId,
    metadata,
  });
};
