import mongoose from 'mongoose';

const AddressSchema = new mongoose.Schema(
  {
    line1:      { type: String, trim: true, default: '' },
    line2:      { type: String, trim: true, default: '' },
    pincode:    { type: String, trim: true, default: '' },
    city:       { type: String, trim: true, default: '' },
    district:   { type: String, trim: true, default: '' },
    state:      { type: String, trim: true, default: '' },
  },
  { _id: false }
);

const ClientSchema = new mongoose.Schema(
  {
    userId:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name:       { type: String, required: true, trim: true },
    mobile:     { type: String, required: true, trim: true },
    email:      { type: String, trim: true, default: '' },
    company:    { type: String, trim: true, default: '' },
    gstNumber:  { type: String, trim: true, default: '' },
    clientType: { type: String, enum: ['individual', 'business', 'contractor'], default: 'individual' },
    status:     { type: String, enum: ['active', 'inactive'], default: 'active' },
    address:    { type: AddressSchema, default: () => ({}) },
  },
  { timestamps: true }
);

export default mongoose.models.Client || mongoose.model('Client', ClientSchema);
