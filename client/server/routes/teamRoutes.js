const express = require("express");
const router = express.Router();
const {
  getTeams,
  createTeam,
  getTeam,
  getTeamMembers,
  joinTeam,
  changeLeader,
  kickMember,
  deleteTeam,
  leaveTeam,
  getTeamsByUser,
} = require("../controller/teamController"); // Adjust the path as necessary
const requireAuth = require("../middleware/requireAuth"); // Path to your authentication middleware
const checkTeamMembership = require("../middleware/checkMember");

// router.use(requireAuth);

// Routes
router.get("/", getTeams); // Get list of teams for logged-in user
router.post("/team", createTeam); // Create a new team
router.get('/user',requireAuth, getTeamsByUser);
router.get("/team/view/:UUID", checkTeamMembership, getTeam); // Get specific team info, checks membership
router.get("/team/view/:UUID/members", checkTeamMembership, getTeamMembers); // Get list of team members, checks membership
router.post("/team/join", joinTeam); // Join a team by ID
router.post("/team/changeLeader", checkTeamMembership, changeLeader); // Change team leader, checks membership
router.post("/team/kick", checkTeamMembership, kickMember); // Kick a member from the team, checks membership
router.delete("/team/:UUID", checkTeamMembership, deleteTeam); // Delete a team, checks membership
router.delete("/team/leave", leaveTeam); // Leave a team

module.exports = router;
