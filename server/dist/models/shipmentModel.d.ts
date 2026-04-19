import mongoose, { Document, Model } from "mongoose";
export type ShipmentState = "CREATED" | "TAG_WRITTEN" | "PICKED_UP" | "IN_TRANSIT" | "DELIVERED" | "HANDOVER_COMPLETE";
export interface ShipmentDocument extends Document {
    productId: mongoose.Types.ObjectId;
    manufacturerId: mongoose.Types.ObjectId;
    sellerPickupId?: mongoose.Types.ObjectId;
    destination?: string;
    currentState: ShipmentState;
}
declare const Shipment: Model<ShipmentDocument>;
export default Shipment;
