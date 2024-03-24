const express = require('express');
const {createTournament, getTournamentById, getAllTournaments, updateTournament, deleteTournament, getTournamentDisplayData} = require('../controller/tourneyController');
const router = express();

//tournaments
router.get('/', getAllTournaments);

//new tourney
router.post('/', createTournament);

router.get('/tournament', getTournamentDisplayData)

//delete
router.delete('/',deleteTournament);

//update
router.patch('/',updateTournament);

module.exports = router;