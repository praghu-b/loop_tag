"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateNonce = exports.verifySerializedPayload = exports.signSerializedPayload = exports.serializePayload = void 0;
const crypto_1 = __importDefault(require("crypto"));
const getSigningSecret = () => {
    const secret = process.env.NFC_SIGNING_SECRET || process.env.JWT_SECRET;
    if (!secret) {
        throw new Error("NFC_SIGNING_SECRET or JWT_SECRET must be configured.");
    }
    return secret;
};
const serializePayload = (payload) => {
    return JSON.stringify(payload);
};
exports.serializePayload = serializePayload;
const signSerializedPayload = (serializedPayload) => {
    return crypto_1.default
        .createHmac("sha256", getSigningSecret())
        .update(serializedPayload)
        .digest("hex");
};
exports.signSerializedPayload = signSerializedPayload;
const verifySerializedPayload = (serializedPayload, signature) => {
    const expected = (0, exports.signSerializedPayload)(serializedPayload);
    const expectedBuffer = Buffer.from(expected, "hex");
    const providedBuffer = Buffer.from(signature, "hex");
    if (expectedBuffer.length !== providedBuffer.length) {
        return false;
    }
    return crypto_1.default.timingSafeEqual(expectedBuffer, providedBuffer);
};
exports.verifySerializedPayload = verifySerializedPayload;
const generateNonce = () => {
    return crypto_1.default.randomBytes(12).toString("hex");
};
exports.generateNonce = generateNonce;
//# sourceMappingURL=signatureService.js.map