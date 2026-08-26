import express from 'express'
const router = express.Router();
import { createTeam, getTeam, getTeamMembers, joinTeam, changeLeader, kickMember, deleteTeam, leaveTeam, getTeamsByUser, getTeamByCode, getTournamentDisplayTeams } from '../controller/teamController.js'
import { auth, getAuth } from '../middleware/requireAuth.js'
import checkTeamMembership from '../middleware/checkMember.js'

// Routes
router.post("/create", auth, createTeam); // Create a new team
router.get('/user' ,  auth, getTeamsByUser);
router.get('/user/teamsList', auth, getTournamentDisplayTeams);
router.get("/view/:UUID", auth, getTeam); // Get specific team info, checks membership
router.get("/view/code/:teamCode", auth, getTeamByCode); // Get specific team info by team code
router.get("/view/:UUID/members", auth, getTeamMembers); // Get list of team members, checks membership
router.post("/join/:teamId", auth, joinTeam); // Join a team by ID
router.post("/changeLeader/:UUID", auth, changeLeader); // Change team leader, checks membership
router.post("/kick/:UUID", auth, kickMember); // Kick a member from the team, checks membership
router.delete("/delete/:UUID", auth, deleteTeam); // Delete a team, checks membership
router.post("/leave/:UUID", auth, leaveTeam); // Leave a team

export default router
