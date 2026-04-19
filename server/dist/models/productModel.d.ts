import { Document, Model } from "mongoose";
export interface ProductDocument extends Document {
    productName: string;
    price: number;
    tax?: number;
    description: string;
    category: string;
    imageUrls: string[];
}
declare const Product: Model<ProductDocument>;
export default Product;
