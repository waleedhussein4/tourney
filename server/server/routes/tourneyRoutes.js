const express = require('express');
const {createTournament, getTournamentById, getAllTournaments, updateTournament, deleteTournament, getTournamentDisplayData, handleApplicationSubmission, handleJoinAsSolo, handleJoinAsTeam} = require('../controller/tourneyController');
const router = express();

//tournaments
router.get('/', getAllTournaments);

//new tourney
router.post('/', createTournament);

router.get('/tournament', getTournamentDisplayData)

router.post('/tournament/submitApplication', handleApplicationSubmission)

router.post('/tournament/joinAsSolo', handleJoinAsSolo)

router.post('/tournament/joinAsTeam', handleJoinAsTeam)

//delete
router.delete('/',deleteTournament);

//update
router.patch('/',updateTournament);

module.exports = router;