import express from 'express'
import { createTournaments, deleteAllTournaments } from '../scripts/generateTestTournaments.js'
import { createUsers, deleteUsers } from '../scripts/generateTestUsers.js'
const router = express();
import { admin } from '../middleware/requireAuth.js'


// create test touranments
router.post('/createTournaments', admin, createTournaments);

// delete all tournaments
router.delete('/deleteAllTournaments', admin, deleteAllTournaments);

// create test users
router.post('/createUsers', admin, createUsers);

// delete users
router.delete('/deleteUsers', admin, deleteUsers);

export default router
