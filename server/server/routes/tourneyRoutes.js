const express = require('express');
const {createTournament, getTournamentById, getAllTournaments, updateTournament, deleteTournament, getTournamentDisplayData, handleApplicationSubmission, handleJoinAsSolo, handleJoinAsTeam, editTitle, editDescription, editStartDate, editEndDate, getManageTournamentDisplayData} = require('../controller/tourneyController');
const router = express();
const { auth, getAuth } = require("../middleware/requireAuth")

//tournaments
router.get('/', auth, getAllTournaments);

//new tourney
router.post('/', auth, createTournament);

router.get('/tournament', getAuth, getTournamentDisplayData)

router.get('/tournament/manage', auth, getManageTournamentDisplayData)

router.post('/tournament/submitApplication', auth, handleApplicationSubmission)

router.post('/tournament/joinAsSolo', auth, handleJoinAsSolo)

router.post('/tournament/joinAsTeam', auth, handleJoinAsTeam)

router.post('/tournament/editTitle', auth, editTitle)

router.post('/tournament/editDescription', auth, editDescription)

router.post('/tournament/editStartDate', auth, editStartDate)

router.post('/tournament/editEndDate', auth, editEndDate)

//delete
router.delete('/',deleteTournament);

//update
router.patch('/',updateTournament);

module.exports = router;