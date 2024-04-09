const Tournament = require('../models/tourneyModels');
const Team = require('../models/teamModels');
const User = require('../models/userModel');
const jwt = require('jsonwebtoken');
const generateAndAddUsersToTournament = require('./tester');

// Create a new tournament
const createTournament = async (req, res) => {
  const { UUID, host, title, type, category, startDate, endDate, entryFee, maxCapacity, accessibility } = req.body;

  try {
    const newTournament = await Tournament.create({
      UUID,
      host,
      title,
      type,
      category,
      startDate,
      endDate,
      enrolledUsers: [],
      entryFee,
      earnings: {}, // Initialize as empty; adjust according to your logic
      maxCapacity,
      accessibility
    });
    res.status(200).json(newTournament);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const newTournament = new Tournament({
  _id: "89b72cfe-0b87-4395-8230-8e8e1f571cb7",
  UUID: "89b72cfe-0b87-4395-8230-8e8e1f571cb7",
  host: "9410f264-0bef-4516-b3ea-661c575490f2",
  title: "Fortnite Duo Cup",
  teamSize: 2,
  description: "Enter the description of the tournament here. The length must be limited to 200 characters on the backend.",
  type: "battle royale",
  category: "fortnite",
  startDate: new Date("2024-02-29T10:01:31.474Z"),
  endDate: new Date("2024-02-29T10:02:10.959Z"),
  hasStarted: false,
  hasEnded: false,
  enrolledUsers: ["f61bc24d-bebc-4391-acbb-2928b6ad74a4", "f976aa28-133d-4a9c-a295-cc55a2198435", "141002f8-f9da-4ad4-a86d-eef1bf4b9c3a"],
  entryFee: 5.5,
  earnings: {
    "1": 200,
    "2": 100,
    "3": 75
  },
  maxCapacity: 100,
  accessibility: "application required",
  updates: [{
      date: new Date("2024-02-29T10:01:31.474Z"),
      content: "Tournament Started"
    },
    {
      date: new Date("2024-02-29T10:02:10.959Z"),
      content: "First Round Complete"
    }
  ],
  application: [
    {
      name: "Name"
    },
    {
      name: "Age"
    },
    {
      name: "Epic Games Username"
    }
  ],
  acceptedUsers: [],
  applications: []
});

// Get all tournaments
const getAllTournaments = async (req, res) => {
  const tournaments = await Tournament.find().sort({ createdAt: -1 });
  
  res.status(200).json(tournaments);
};

// Get a single tournament by ID
const getTournamentById = async (req, res) => {
  const { id } = req.params;

  const tournament = await Tournament.findById(id);
  if (!tournament) {
    return res.status(404).json({ error: 'No such tournament' });
  }

  res.status(200).json(tournament);
};

// Update a tournament
const updateTournament = async (req, res) => {
  const { id } = req.params;

  try {
    const tournament = await Tournament.findByIdAndUpdate(id, { ...req.body }, { new: true });
    if (!tournament) {
      return res.status(404).json({ error: 'No such tournament' });
    }
    res.status(200).json(tournament);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Delete a tournament
const deleteTournament = async (req, res) => {
  const { id } = req.params;

  try {
    const tournament = await Tournament.findByIdAndDelete(id);
    if (!tournament) {
      return res.status(404).json({ error: 'No such tournament' });
    }
    res.status(200).json({ message: 'Tournament deleted successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// get tournament data for the tournament page
const getTournamentDisplayData = async (req, res) => {

  // delete all tournaments
  // await Tournament.deleteMany({})
  // .then(result => {
  //   console.log(`${result.deletedCount} tournaments deleted successfully.`);
  // })
  // .catch(error => {
  //   console.error('Error deleting tournaments:', error);
  // });

  // create new tournament
  // await newTournament.save()
  // .then(savedTournament => {
  //   console.log('Tournament saved successfully:', savedTournament);
  // })
  // .catch(error => {
  //   console.error('Error saving tournament:', error);
  // });
  
  // print all tournaments
  // Tournament.find({}).exec()
  // .then(tournaments => {
  //   tournaments.forEach(tournament => {
  //     console.log(tournament);
  //     console.log("Type of id: ", typeof(tournament._id))
  //   });
  // })
  // .catch(error => {
  //   console.error('Error fetching tournaments:', error);
  // });

  // Tournament.updateOne(
  //   { _id: req.query.UUID }, // Filter for the tournament by its ID
  //   { $set: { acceptedUsers: [], applications: [] } } // Set acceptedUsers and applications arrays to empty arrays
  // )
  // .then(result => {
  //   if (result.nModified === 0) {
  //     console.log('No tournament was updated'); // Tournament not found or no changes applied
  //   } else {
  //     console.log('AcceptedUsers and applications arrays cleared successfully');
  //   }
  // })
  // .catch(error => {
  //   console.error('Error updating tournament:', error);
  // });
    
  try {
    const UUID = req.query.UUID;
    if (!UUID) {
      return res.status(400).json({ error: 'UUID parameter is missing' });
    }

    const userUUID = req.user;

    const tournament = await Tournament.findById(UUID);
    if (!tournament) {
      return res.status(404).json({ error: 'Tournament not found' });
    }

    const isHost = (tournament.host == userUUID)

    // await generateAndAddUsersToTournament(UUID, 20);

    const enrolledUserDetails = await Promise.all(
      tournament.enrolledUsers.map(async (userId) => {
        const user = await User.findById(userId);
        if (!user) {
          return null;
        }
        // Simulated elimination status and score
        const eliminated = Math.random() < 0.5; // Random elimination status
        const score = eliminated ? 0 : Math.floor(Math.random() * 1000); // Random score if not eliminated
        return { userName: user.userName, eliminated, score };
      })
    );

    // Filter out any null values (users not found)
    const validEnrolledUserDetails = enrolledUserDetails.filter((user) => user !== null);

    validEnrolledUserDetails.sort((a, b) => b.score - a.score);


    res.status(200).json({
      hasStarted: tournament.hasStarted,
      accessibility: tournament.accessibility,
      title: tournament.title,
      description: tournament.description,
      category: tournament.category,
      type: tournament.type,
      teamSize: tournament.teamSize,
      entryFee: tournament.entryFee,
      maxCapacity: tournament.maxCapacity,
      earnings: tournament.earnings,
      host: tournament.host,
      isAccepted: tournament.acceptedUsers.includes(userUUID),
      updates: tournament.updates,
      isHost: isHost,
      application: tournament.application,
      hasApplied: ((tournament.applications).map(app => app.user)).includes(userUUID),
      data: {
        users: validEnrolledUserDetails,
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
}

const handleApplicationSubmission = async (req, res) => {

  console.log('Handling application submission')

  const tournament = await Tournament.findById(req.body.tournament);
  if (!tournament) {
    return res.status(404).json({ error: 'No such tournament' });
  }

  const userUUID = req.user;

  let dbApplication = tournament.application
  let dbApplicationArray = Array.from(dbApplication)

  let userApplication = req.body.application
  let userApplicationArray = Array.from(userApplication)

  // match application form length
  if(dbApplicationArray.length != userApplicationArray.length) {
    return res.status(400).json({ error: 'Invalid application form' })
  }

  // match fields
  // fields must not be empty
  for(let i = 0; i < dbApplicationArray.length; i++) {
    if(dbApplicationArray[i].name != userApplicationArray[i].label) {
      return res.status(400).json({ error: 'Invalid application form' })
    }
    if(!userApplicationArray[i].input) {
      return res.status(400).json({ error: 'Invalid application form' })
    }
  }

  // check if user already applied
  let alreadyApplied = false
  tournament.applications.forEach(app => {
    if(app.user == userUUID) {
      alreadyApplied = true
    }
  })
  if(alreadyApplied) {
    return res.status(400).json({ error: 'User already applied' })
  }

  // tournament must have capacity available
  if (tournament.enrolledUsers.length + 1 > tournament.maxCapacity) {
    return res.status(404).json({ error: 'Invalid request' })
  }

  // tournament must not have started
  if (tournament.hasStarted) {
    return res.status(404).json({ error: 'Invalid request' })
  }

  // user must not already be part of tournament
  if (tournament.enrolledUsers.includes(userUUID)) {
    return res.status(404).json({ error: 'Invalid request' })
  }

  // user must not be host
  if (tournament.host == userUUID) {
    return res.status(404).json({ error: 'Invalid request' })
  }

  // add application to applications
  Tournament.updateOne(
    { _id: req.body.tournament },
    { $push: { applications: {user: userUUID, application: userApplication} } }
  )
  .then(result => {
    if (result.nModified === 0) {
      console.log('No tournament was updated');
    } else {
      console.log('Application added to applications array successfully');
    }
  })
  .catch(error => {
    console.error('Error updating tournament:', error);
  });

  // redirect to view tournament page
  res.send({'Location': 'http://localhost:5173/tournament/?UUID=' + tournament.UUID})
  return res.end()
}

const handleJoinAsSolo = async (req, res) => {
  console.log('Handling join as solo')

  const tournament = await Tournament.findById(req.body.tournament);
  if (!tournament) {
    return res.status(404).json({ error: 'No such tournament' });
  }

  const userUUID = req.user;

  // tournament must be solo
  if (tournament.teamSize != 1) {
    return res.status(404).json({ error: 'Invalid request' })
  }

  // tournament must have capacity available
  if (tournament.enrolledUsers.length + 1 > tournament.maxCapacity) {
    return res.status(404).json({ error: 'Invalid request' })
  }

  // tournament must not have started
  if (tournament.hasStarted) {
    return res.status(404).json({ error: 'Invalid request' })
  }

  // user must not already be part of tournament
  if (tournament.enrolledUsers.includes(userUUID)) {
    return res.status(404).json({ error: 'Invalid request' })
  }

  // user must not be host
  if (tournament.host == userUUID) {
    return res.status(404).json({ error: 'Invalid request' })
  }

  // Add user to enrolled users
  Tournament.updateOne(
    { _id: req.body.tournament },
    { $push: { enrolledUsers: userUUID } }
  )
  .then(result => {
    if (result.nModified === 0) {
      console.log('No tournament was updated');
    } else {
      console.log('User added to enrolledUsers array successfully');
    }
  })
  .catch(error => {
    console.error('Error updating tournament:', error);
  });

  // redirect to view tournament page
  res.writeHead(302, {'Location': 'http://localhost:5173/tournament/?UUID=' + tournament.UUID})
  return res.end()
}

const handleJoinAsTeam = async (req, res) => {
  console.log('Handling join as team')
  const tournament = await Tournament.findById(req.body.tournament);
  if (!tournament) {
    return res.status(404).json({ error: 'No such tournament' });
  }

  const team = await Team.findById(req.body.team);
  if (!team) {
    return res.status(404).json({ error: 'No such team' });
  }

  const userUUID = req.user;

  // required team size must match provided team size
  if (tournament.teamSize != team.members.length) {
    return res.status(404).json({ error: 'Invalid request' })
  }

  // tournament must have capacity available
  if ((tournament.enrolledUsers.length + tournament.teamSize) > tournament.maxCapacity) {
    return res.status(404).json({ error: 'Invalid request' })
  }

  // tournament must not have started
  if (tournament.hasStarted) {
    return res.status(404).json({ error: 'Invalid request' })
  }

  // team members must not already be part of tournament
  function isTeamMemberEnrolled(team, enrolledTeams) {
    for (let member of team.members) {
      for (let enrolledTeam of enrolledTeams) {
        if (enrolledTeam.members.includes(member)) {
          return true;
        }
      }
    }
    return false;
  }
  if (isTeamMemberEnrolled(team, tournament.enrolledTeams)) {
    return res.status(404).json({ error: 'One of the team members is already enrolled in the tournament' })
  }

  // team members must not be host
  if (team.members.includes(tournament.host)) {
    return res.status(404).json({ error: 'Tournament host cannot join tournament' })
  }

  // Add team to enrolledTeams
  Tournament.updateOne(
    { _id: req.body.tournament },
    { $push: { enrolledTeams: team } }
  )
  .then(result => {
    if (result.nModified === 0) {
      console.log('No tournament was updated');
    } else {
      console.log('Team added to enrolledTeams array successfully');
    }
  })
  .catch(error => {
    console.error('Error updating tournament:', error);
  });

  // redirect to view tournament page
  res.writeHead(302, {'Location': 'http://localhost:5173/tournament/?UUID=' + tournament.UUID})
  return res.end()
}

module.exports = {
  createTournament,
  getTournamentById,
  getAllTournaments,
  updateTournament,
  deleteTournament,
  getTournamentDisplayData,
  handleApplicationSubmission,
  handleJoinAsSolo,
  handleJoinAsTeam
};

  