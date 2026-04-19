import mongoose, { Document, Schema } from 'mongoose';
import { UserRole } from '../middleware/authMiddleware';

// Define the User interface
interface IUser extends Document {
    email: string;
    password: string;
    role: UserRole;
    createdAt?: Date;
    updatedAt?: Date;
}

// Define the user schema
const userSchema = new Schema<IUser>(
    {
        email: {
            type: String,
            required: [true, 'Email ID is missing'],
            unique: true, // Ensures uniqueness
        },
        password: {
            type: String,
            required: true, // Ensures password is mandatory
        },
        role: {
            type: String,
            enum: ['admin', 'manufacturer', 'seller_pickup'],
            default: 'seller_pickup',
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

// Check if the model already exists to prevent redefining
const User = mongoose.models.User || mongoose.model<IUser>('User', userSchema);

export default User;
