const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const creditSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  totalCredits: {
    type: Number,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  dateCreated: {
    type: Date,
    default: Date.now,
    required: true,
  },
});

const Credit = mongoose.model("Credit", creditSchema);

module.exports = Credit;
