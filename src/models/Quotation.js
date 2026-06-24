import mongoose from 'mongoose';

const ItemSchema = new mongoose.Schema({
  productId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  productName: { type: String, required: true },
  size:        { qty: Number, unit: { type: String, default: 'L' }, price: { type: Number, default: 0 } },
  quantity:    { type: Number, required: true, min: 1 },
  totalLitres: { type: Number, default: 0 },
  colourHex:   { type: String, default: '' },
  amount:      { type: Number, default: 0 },
}, { _id: false });

const RoomSchema    = new mongoose.Schema({ name: String, length: Number, width: Number, height: Number }, { _id: false });
const DeductSchema  = new mongoose.Schema({ size: String, count: Number }, { _id: false });

const InteriorCalcSchema = new mongoose.Schema({
  rooms: { type: [RoomSchema], default: [] }, doors: { type: [DeductSchema], default: [] }, windows: { type: [DeductSchema], default: [] },
  unit: { type: String, default: 'ft' }, primerCoats: { type: Number, default: 1 }, interiorCoats: { type: Number, default: 2 }, ceilingCoats: { type: Number, default: 1 },
  totalWallArea: Number, totalCeilingArea: Number, deduction: Number, netWallArea: Number,
  primerLitres: Number, interiorLitres: Number, ceilingLitres: Number, savedAt: { type: Date, default: Date.now },
}, { _id: false });

const ExteriorCalcSchema = new mongoose.Schema({
  length: Number, width: Number, height: Number, unit: { type: String, default: 'ft' }, openArea: { type: Number, default: 0 },
  primerCoats: { type: Number, default: 1 }, paintCoats: { type: Number, default: 2 }, terraceCoats: { type: Number, default: 1 },
  grossArea: Number, terraceArea: Number, netArea: Number,
  primerLitres: Number, paintLitres: Number, terraceLitres: Number, savedAt: { type: Date, default: Date.now },
}, { _id: false });

/* ── Embedded release order ── */
const ReleaseOrderSchema = new mongoose.Schema({
  orderNumber: { type: String, required: true },
  releasedAt:  { type: Date, default: Date.now },
  notes:       { type: String, default: '' },
}, { _id: false });

const QuotationSchema = new mongoose.Schema({
  userId:          { type: mongoose.Schema.Types.ObjectId, ref: 'User',   required: true, index: true },
  clientId:        { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true, index: true },
  quotationNumber: { type: String, required: true },
  status:          { type: String, enum: ['draft', 'saved'], default: 'draft' },
  items:           { type: [ItemSchema], default: [] },
  interiorCalc:    { type: InteriorCalcSchema, default: null },
  exteriorCalc:    { type: ExteriorCalcSchema, default: null },
  notes:           { type: String, default: '' },
  /* Discount */
  discountType:    { type: String, enum: ['percent', 'flat'], default: 'flat' },
  discountValue:   { type: Number, default: 0 },
  discountAmount:  { type: Number, default: 0 },
  /* Totals */
  totalAmount:     { type: Number, default: 0 },
  grandTotal:      { type: Number, default: 0 },
  /* Release order (embedded when converted) */
  releaseOrder:    { type: ReleaseOrderSchema, default: null },
}, { timestamps: true });

export default mongoose.models.Quotation || mongoose.model('Quotation', QuotationSchema);
