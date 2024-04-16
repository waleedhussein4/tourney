const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const teamSchema = new Schema({
  teamId: {
    type: String,
    required: true,
    unique: true  // Ensures that each team has a unique teamId
  },
  _id: { type: Object },
  name: {
    type: String,
    required: true,
  },
  members: [
    {
      type: Schema.Types.String, // Assuming members' UUIDs are MongoDB Object IDs
      ref: "User", // Assuming you have a User model defined elsewhere
      required: true,
    },
  ],
  leader: {
    type: Schema.Types.String, // Assuming the leader's UUID is a MongoDB Object ID
    ref: "User", // Reference to the User model
    required: true,
  },

  dateCreated: {
    type: Date,
    default: Date.now,
    required: true,
  },
  createdBy: {
    type: Schema.Types.String, // Assuming the creator's UUID is a MongoDB Object ID
    ref: "User", // Reference to the User model
    required: true,
  },
});

const Team = mongoose.model("Team", teamSchema);

module.exports = Team;
