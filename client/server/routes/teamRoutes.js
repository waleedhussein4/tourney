const express = require("express");
const router = express.Router();
const {
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
router.post("/create", requireAuth, createTeam); // Create a new team
router.get('/user' ,  requireAuth, getTeamsByUser);
router.get("/view/:UUID", requireAuth, getTeam); // Get specific team info, checks membership
router.get("/view/:UUID/members", requireAuth, getTeamMembers); // Get list of team members, checks membership
router.post("/join/:teamId", requireAuth, joinTeam); // Join a team by ID
router.post("/changeLeader", requireAuth, changeLeader); // Change team leader, checks membership
router.post("/kick", requireAuth, kickMember); // Kick a member from the team, checks membership
router.delete("/delete/:UUID", requireAuth, deleteTeam); // Delete a team, checks membership
router.delete("/leave", requireAuth, leaveTeam); // Leave a team

module.exports = router;
