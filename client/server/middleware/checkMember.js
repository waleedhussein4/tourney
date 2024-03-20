// Middleware to check if the user is part of the team
async function checkTeamMembership(req, res, next) {
    try {
        const team = await Team.findOne({ UUID: req.params.UUID });
        if (!team) {
            return res.status(404).send({ message: 'Team not found' });
        }
        if (!team.members.includes(req.user._id)) {
            return res.status(403).send({ message: 'User is not part of this team' });
        }
        req.team = team; // Store team for downstream use
        next();
    } catch (error) {
        res.status(500).send({ message: 'Server error' });
    }
}
