import crypto from "crypto";

export interface SignedNfcPayload {
  shipmentId: string;
  productId: string;
  issuerUserId: string;
  issuedAt: string;
  nonce: string;
  version: number;
}

const getSigningSecret = (): string => {
  const secret = process.env.NFC_SIGNING_SECRET || process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("NFC_SIGNING_SECRET or JWT_SECRET must be configured.");
  }

  return secret;
};

export const serializePayload = (payload: SignedNfcPayload): string => {
  return JSON.stringify(payload);
};

export const signSerializedPayload = (serializedPayload: string): string => {
  return crypto
    .createHmac("sha256", getSigningSecret())
    .update(serializedPayload)
    .digest("hex");
};

export const verifySerializedPayload = (
  serializedPayload: string,
  signature: string,
): boolean => {
  const expected = signSerializedPayload(serializedPayload);
  const expectedBuffer = Buffer.from(expected, "hex");
  const providedBuffer = Buffer.from(signature, "hex");

  if (expectedBuffer.length !== providedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(expectedBuffer, providedBuffer);
};

export const generateNonce = (): string => {
  return crypto.randomBytes(12).toString("hex");
};
