const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const teamSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  members: [
    {
      type: Schema.Types.ObjectId, // Assuming members' UUIDs are MongoDB Object IDs
      ref: "User", // Assuming you have a User model defined elsewhere
      required: true,
    },
  ],
  leader: {
    type: Schema.Types.ObjectId, // Assuming the leader's UUID is a MongoDB Object ID
    ref: "User", // Reference to the User model
    required: true,
  },

  dateCreated: {
    type: Date,
    default: Date.now,
    required: true,
  },
  createdBy: {
    type: Schema.Types.ObjectId, // Assuming the creator's UUID is a MongoDB Object ID
    ref: "User", // Reference to the User model
    required: true,
  },
});

const Team = mongoose.model("Team", teamSchema);

module.exports = Team;
