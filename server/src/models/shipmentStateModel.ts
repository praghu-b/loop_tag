import mongoose, { Document, Model, Schema } from "mongoose";
import { ShipmentState } from "./shipmentModel";

export interface ShipmentStateHistoryDocument extends Document {
  shipmentId: mongoose.Types.ObjectId;
  fromState?: ShipmentState;
  toState: ShipmentState;
  transitionedByUserId?: mongoose.Types.ObjectId;
  note?: string;
  createdAt: Date;
}

const shipmentStateHistorySchema = new Schema<ShipmentStateHistoryDocument>(
  {
    shipmentId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "Shipment",
      index: true,
    },
    fromState: {
      type: String,
      enum: [
        "CREATED",
        "TAG_WRITTEN",
        "PICKED_UP",
        "IN_TRANSIT",
        "DELIVERED",
        "HANDOVER_COMPLETE",
      ],
    },
    toState: {
      type: String,
      required: true,
      enum: [
        "CREATED",
        "TAG_WRITTEN",
        "PICKED_UP",
        "IN_TRANSIT",
        "DELIVERED",
        "HANDOVER_COMPLETE",
      ],
    },
    transitionedByUserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    note: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    versionKey: false,
    collection: "shipment_state_history",
  },
);

const ShipmentStateHistory: Model<ShipmentStateHistoryDocument> =
  mongoose.models.ShipmentStateHistory ||
  mongoose.model<ShipmentStateHistoryDocument>(
    "ShipmentStateHistory",
    shipmentStateHistorySchema,
  );

export default ShipmentStateHistory;
