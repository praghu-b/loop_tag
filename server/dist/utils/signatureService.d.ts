export interface SignedNfcPayload {
    shipmentId: string;
    productId: string;
    issuerUserId: string;
    issuedAt: string;
    nonce: string;
    version: number;
}
export declare const serializePayload: (payload: SignedNfcPayload) => string;
export declare const signSerializedPayload: (serializedPayload: string) => string;
export declare const verifySerializedPayload: (serializedPayload: string, signature: string) => boolean;
export declare const generateNonce: () => string;
