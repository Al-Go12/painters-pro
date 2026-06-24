import mongoose from 'mongoose';

const SizeSchema = new mongoose.Schema(
  {
    qty:   { type: Number, required: true },
    unit:  { type: String, enum: ['L', 'Kg', 'Gal'], default: 'L' },
    price: { type: Number, default: 0 },
  },
  { _id: false }
);

const ProductSchema = new mongoose.Schema(
  {
    userId:         { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name:           { type: String, required: true, trim: true },
    classification: { type: String, required: true, enum: ['interior', 'exterior', 'both'], default: 'interior' },
    productType:    { type: String, required: true, enum: ['primer', 'wall emulsion', 'ceiling paint', 'waterproof', 'putty', 'texture', 'enamel', 'distemper'], default: 'wall emulsion' },
    sizes:          { type: [SizeSchema], default: [] },
  },
  { timestamps: true }
);

export default mongoose.models.Product || mongoose.model('Product', ProductSchema);
