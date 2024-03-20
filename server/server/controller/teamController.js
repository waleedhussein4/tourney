const Team = require('../models/teamModels'); // Path to your Team model
const User = require('../models/userModel'); // Path to your User model

// Send list of teams to the frontend
const getTeams = async (req, res) => {
    try {
        const teams = await Team.find({ members: req.user._id });
        res.json(teams);
    } catch (error) {
        res.status(500).send({ message: 'Server error' });
    }
};

// Send team JSON to the frontend
const getTeam = (req, res) => {
    res.json(req.team);
};

// Send team member list
const getTeamMembers = async (req, res) => {
    try {
        const team = await Team.findOne({ UUID: req.params.UUID }).populate('members');
        if (!team) {
            return res.status(404).send({ message: 'Team not found' });
        }
        res.json(team.members);
    } catch (error) {
        res.status(500).send({ message: 'Server error' });
    }
};

const createTeam = async (req, res) => {
    try {
        // Create a new team object using data from request body and the authenticated user
        const newTeam = new Team({
            ...req.body, // Include other team properties from the request body
            UUID: req.body.UUID || req.user.UUID, // Set the team UUID from the request body or user object
            id: req.body.id, // Use the ID from the request body or generate a new one
            leader: req.user._id, // Set the current user as the team leader
            members: [req.user._id], // Initialize the members array with the current user
            createdBy: req.user._id // Set the current user as the creator of the team
        });

        // Save the new team to the database
        await newTeam.save();

        // Send the newly created team back to the client
        res.status(201).send(newTeam);
    } catch (error) {
        // If there's an error, send back a 500 server error response
        res.status(500).send({ message: 'Server error' });
    }
};


// Handle team join by ID
const joinTeam = async (req, res) => {
    try {
        const team = await Team.findOne({ id: req.body.teamID });
        if (!team) {
            return res.status(404).send({ message: 'Team not found' });
        }
        if (!team.members.includes(req.user._id)) {
            team.members.push(req.user._id);
            await team.save();
            res.send({ message: 'Joined the team successfully' });
        } else {
            res.status(400).send({ message: 'Already a member of the team' });
        }
    } catch (error) {
        res.status(500).send({ message: 'Server error' });
    }
};

// Handle change leader request
const changeLeader = async (req, res) => {
    const { teamUUID, newLeaderId } = req.body;
    try {
        const team = await Team.findOne({ UUID: teamUUID });
        if (!team) {
            return res.status(404).send({ message: 'Team not found' });
        }
        if (team.leader.toString() !== req.user._id.toString()) {
            return res.status(403).send({ message: 'Only the team leader can change the leader' });
        }
        if (!team.members.includes(newLeaderId)) {
            return res.status(400).send({ message: 'New leader must be a team member' });
        }
        team.leader = newLeaderId;
        await team.save();
        res.send({ message: 'Team leader changed successfully' });
    } catch (error) {
        res.status(500).send({ message: 'Server error' });
    }
};

module.exports = {
    getTeams,
    createTeam,
    getTeam,
    getTeamMembers,
    joinTeam,
    changeLeader,
};

