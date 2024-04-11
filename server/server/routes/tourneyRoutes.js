const express = require('express');
const {createTournament, getTournamentById, getAllTournaments, updateTournament, deleteTournament, getTournamentDisplayData, handleApplicationSubmission, handleJoinAsSolo, handleJoinAsTeam} = require('../controller/tourneyController');
const router = express();
const auth = require("../middleware/requireAuth")

//tournaments
router.get('/', auth, getAllTournaments);

//new tourney
router.post('/', auth, createTournament);

router.get('/tournament', getTournamentDisplayData)

router.post('/tournament/submitApplication', auth, handleApplicationSubmission)

router.post('/tournament/joinAsSolo', auth, handleJoinAsSolo)

router.post('/tournament/joinAsTeam', auth, handleJoinAsTeam)

//delete
router.delete('/',deleteTournament);

//update
router.patch('/',updateTournament);

module.exports = router;