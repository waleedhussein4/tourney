const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const productSchema = new Schema({
  _id: { type: Object },
  id: { type: String, required: true},
  name: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
}, { timestamps: true });

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
