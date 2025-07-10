import mongoose from 'mongoose';
import { v5 as uuidv5 } from 'uuid';


const productSchema = new mongoose.Schema({
    id: {
        type: String,
        required: true,
        unique: true,
        default: function () {
            return uuidv5(`${this.name}_${this.shopId}`, NAMESPACE);
        }
    },
    shopId: {
        type: String,
        required: true,
        index: true
    },
    name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 200
    },
    description: {
        type: String,
        trim: true,
        maxlength: 2000
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    stock: {
        type: Number,
        default: 0,
        min: 0
    },
    category: {
        type: String,
        required: true,
        trim: true
    },
    subcategory: {
        type: String,
        trim: true
    },
    brand: {
        type: String,
        trim: true
    },
    image: {
        type: String,
        trim: true,
        default: ''
    },
    images: [{
        type: String,
        trim: true
    }],
    status: {
        type: String,
        enum: ['active', 'inactive', 'draft', 'out_of_stock'],
        default: 'draft'
    },
    rating: {
        type: Number,
        min: 0,
        max: 5,
        default: 0
    },
    reviewCount: {
        type: Number,
        default: 0,
        min: 0
    },
    tags: [{
        type: String,
        trim: true
    }],
    specifications: {
        type: Map,
        of: String
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});
// Index for better performance
productSchema.index({ shopId: 1, status: 1 });
productSchema.index({ category: 1, subcategory: 1 });
productSchema.index({ name: 'text', description: 'text' });

// Pre-save middleware to update updatedAt
productSchema.pre('save', function (next) {
    this.updatedAt = new Date();
    next();
});

export default mongoose.model('Product', productSchema);