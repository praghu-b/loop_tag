import mongoose, { Document, Model, Schema } from "mongoose";

export type ShipmentState =
  | "CREATED"
  | "TAG_WRITTEN"
  | "PICKED_UP"
  | "IN_TRANSIT"
  | "DELIVERED"
  | "HANDOVER_COMPLETE";

export interface ShipmentDocument extends Document {
  productId: mongoose.Types.ObjectId;
  manufacturerId: mongoose.Types.ObjectId;
  sellerPickupId?: mongoose.Types.ObjectId;
  destination?: string;
  currentState: ShipmentState;
}

const shipmentSchema = new Schema<ShipmentDocument>(
  {
    productId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "Product",
      index: true,
    },
    manufacturerId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "User",
      index: true,
    },
    sellerPickupId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    destination: {
      type: String,
    },
    currentState: {
      type: String,
      required: true,
      default: "CREATED",
      enum: [
        "CREATED",
        "TAG_WRITTEN",
        "PICKED_UP",
        "IN_TRANSIT",
        "DELIVERED",
        "HANDOVER_COMPLETE",
      ],
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

const Shipment: Model<ShipmentDocument> =
  mongoose.models.Shipment ||
  mongoose.model<ShipmentDocument>("Shipment", shipmentSchema);

export default Shipment;
