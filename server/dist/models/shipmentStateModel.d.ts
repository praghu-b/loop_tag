import mongoose, { Document, Model } from "mongoose";
import { ShipmentState } from "./shipmentModel";
export interface ShipmentStateHistoryDocument extends Document {
    shipmentId: mongoose.Types.ObjectId;
    fromState?: ShipmentState;
    toState: ShipmentState;
    transitionedByUserId?: mongoose.Types.ObjectId;
    note?: string;
    createdAt: Date;
}
declare const ShipmentStateHistory: Model<ShipmentStateHistoryDocument>;
export default ShipmentStateHistory;
