const e = require("express");
const Team = require("../models/teamModels"); // Path to your Team model
const User = require("../models/userModel"); // Path to your User model
const { default: mongoose } = require("mongoose");

const getTeams = async (req, res) => {
  try {
    // get all teams in the db - require auth later
    const teams = await Team.find();
    res.status(200).json(teams);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createTeam = async (req, res) => {
  // leader and createdBy are object IDs
  const { name, members, leader, createdBy } = req.body;
  try {
    const team = await Team.create({
      name,
      members,
      leader,
      dateCreated: new Date(),
      createdBy,
    });
    res.status(201).json(team);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getTeam = async (req, res) => {
  try {
    const team = await Team.findOne({ _id: req.params.id }).populate(
      "members",
      "userName email"
    );
    res.status(200).json(team);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getTeamMembers = async (req, res) => {
  try {
    const team = await Team.findOne({ _id: req.params.id }).populate(
      "members",
      "userName email"
    );
    res.status(200).json(team.members);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const joinTeam = async (req, res) => {
  try {
    const team = await Team.findOne({ _id: req.params.id }).populate(
      "members",
      "userName email"
    );
    if (team.members.length === 5) {
      return res.status(400).json({ message: "Team is full" });
    }
    if (team.members.includes(req.user._id)) {
      return res.status(400).json({ message: "User is already a member" });
    }
    team.members.push(req.user._id);
    await team.save();
    res.status(200).json(team);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const changeLeader = async (req, res) => {
  const { newLeader } = req.body;
  try {
    const team = await Team.findOne({ _id: req.params.id })
      .populate("leader", "userName email")
      .populate("members", "userName email");
    if (!team.members.includes(req.user._id)) {
      return res.status(400).json({ message: "User is not a member" });
    }
    if (team.leader._id !== req.user._id) {
      return res.status(400).json({ message: "User is not the leader" });
    }
    if (!team.members.includes(newLeader)) {
      return res.status(400).json({ message: "New leader is not a member" });
    }
    team.leader = newLeader;
    await team.save();
    res.status(200).json(team);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const kickMember = async (req, res) => {
  const { member } = req.body;
  try {
    const team = await Team.findOne({ _id: req.params.id }).populate(
      "members",
      "userName email"
    );
    if (!team.members.includes(req.user._id)) {
      return res.status(400).json({ message: "User is not a member" });
    }
    if (team.leader._id !== req.user._id) {
      return res.status(400).json({ message: "User is not the leader" });
    }
    if (!team.members.includes(member)) {
      return res.status(400).json({ message: "Member is not in the team" });
    }
    team.members = team.members.filter((m) => m._id !== member);
    await team.save();
    res.status(200).json(team);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteTeam = async (req, res) => {
  try {
    const team = await Team.findOne({ _id: req.params.id });
    if (team.leader._id !== req.user._id) {
      return res.status(400).json({ message: "User is not the leader" });
    }
    await team.remove();
    res.status(200).json({ message: "Team deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const leaveTeam = async (req, res) => {
  try {
    const team = await Team.findOne({ _id: req.params.id })
      .populate("leader", "userName email")
      .populate("members", "userName email");
    if (!team.members.includes(req.user._id)) {
      return res.status(400).json({ message: "User is not a member" });
    }
    if (team.leader._id === req.user._id) {
      return res.status(400).json({ message: "Leader cannot leave team" });
    }
    team.members = team.members.filter((m) => m._id !== req.user._id);
    await team.save();
    res.status(200).json({ message: "Team left successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getTeams,
  createTeam,
  getTeam,
  getTeamMembers,
  joinTeam,
  changeLeader,
  kickMember,
  deleteTeam,
  leaveTeam,
};

