import { AuditEventType } from "../models/auditLogModel";
import { AuthRequest } from "../middleware/authMiddleware";
interface LogAuditEventParams {
    req?: AuthRequest;
    eventType: AuditEventType;
    resourceType?: string;
    resourceId?: string;
    metadata?: Record<string, unknown>;
}
export declare const logAuditEvent: ({ req, eventType, resourceType, resourceId, metadata, }: LogAuditEventParams) => Promise<void>;
export {};
