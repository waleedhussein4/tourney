const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const tournamentSchema = new Schema(
  {
    _id: { type: Object },
    UUID: { type: String, required: true, unique: true },
    host: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: { type: String, required: true },
    type: { type: String, required: true },
    category: { type: String, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    enrolledUsers: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    entryFee: { type: Number, required: true },
    earnings: {
      1: { type: Number },
      2: { type: Number },
      3: { type: Number },
    },
    maxCapacity: { type: Number, required: true },
    accessibility: { type: String, required: true },
    hasStarted: { type: Boolean },
    description: { type: String },
    teamSize: { type: Number },
    acceptedUsers: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    updates: [
      {
        date: { type: Date },
        content: { type: String },
      },
    ],
    isHost: { type: Boolean },
    application: [
      {
        name: { type: String },
      },
    ],
    applications: [
      {
        user: { type: String },
        application: [
          {
            label: { type: String },
            input: { type: String },
          },
        ],
      },
    ],
  },
  { timestamps: true }
);

const Tournament = mongoose.model("Tournament", tournamentSchema);

module.exports = Tournament;
