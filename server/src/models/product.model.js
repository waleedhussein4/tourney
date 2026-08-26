import mongoose from 'mongoose'

const { Schema } = mongoose

/**
 * A credit package on the demo checkout.
 *
 * The slug is the `_id`, so a package is addressed by the name it is sold under
 * and cannot exist twice. `price` is in whole US dollars and is never charged —
 * see `credits.service.js`.
 */
const productSchema = new Schema(
  {
    _id: { type: String, required: true },
    name: { type: String, required: true },
    credits: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 },
  },
  { timestamps: true }
)

productSchema.methods.toPublicJSON = function toPublicJSON() {
  return { id: this._id, name: this.name, credits: this.credits, price: this.price }
}

export default mongoose.model('Product', productSchema)
