const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const tournamentSchema = new Schema({
  UUID: { type: String, required: true, unique: true },
  host: { type: String, required: true },
  title: { type: String, required: true },
  type: { type: String, required: true },
  category: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  enrolledUsers: [{ type: String }],
  entryFee: { type: Number, required: true },
  earnings: {
    1: { type: Number },
    2: { type: Number },
    3: { type: Number }
  },
  maxCapacity: { type: Number, required: true },
  accessibility: { type: String, required: true }
}, { timestamps: true });

const Tournament = mongoose.model('Tournament', tournamentSchema);

module.exports = Tournament;
