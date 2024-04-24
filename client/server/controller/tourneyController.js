const Tournament = require('../models/tourneyModels');
const Team = require('../models/teamModels');
const User = require('../models/userModel');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const generateAndAddUsersToTournament = require('./tester');


// Create a new tournament
const createTournament = async (req, res) => {
  const { title, teamSize, description, type, category, entryFee, earnings, accessibility,maxCapacity} = req.body;
  console.log(req.body)
  const id = uuidv4();
  if(description.length > 200){
     res.status(400).send("Description is more than 200 chars")
  }

  if(teamSize ===0){
    res.status(400).send("Can't be an empty team")
  }
  try {
    if(type === "Bracket"){
    const newTournament = await Tournament.create({
            _id: id,
            UUID: id,
            host : req.user,
            title: title,
            teamSize : teamSize, 
            description: description,
            type: type,
            category: category,
            startDate: "2024-04-24T02:09:13.636+00:00",
            endDate: "2024-02-29T10:02:10.959+00:00",
            hasStarted: false,
            hasEnded: false,
            enrolledTeams: [],
            enrolledUsers:[],
            entryFee: entryFee,
            earnings: earnings,
            maxCapacity: maxCapacity,
            accessibility: accessibility,
            matches:[],
            updates: [],
            application: [],
            acceptedUsers: [],
            acceptedTeams:[],
            applications: []
    })};

    if(type === "Battle Royale"){
        if(teamSize === 1){
          const newTournament = await Tournament.create({
            _id: id,
            UUID: id,
            host : req.user,
            title: title,
            teamSize : teamSize, 
            description: description,
            type: type,
            category: category,
            startDate: "2024-04-24T02:09:13.636+00:00",
            endDate: "2024-02-29T10:02:10.959+00:00",
            hasStarted: false,
            hasEnded: false,
            enrolledUsers:[],
            entryFee: entryFee,
            earnings: earnings,
            maxCapacity: maxCapacity,
            accessibility: accessibility,
            matches:[],
            updates: [],
            application: [],
            acceptedUsers: [],
            applications: []
    })
        }
    if(teamSize >=2){
      const newTournament = await Tournament.create({
        _id: id,
        UUID: id,
        host : req.user,
        title: title,
        teamSize : teamSize, 
        description: description,
        type: type,
        category: category,
        startDate: "2024-04-24T02:09:13.636+00:00",
        endDate: "2024-02-29T10:02:10.959+00:00",
        hasStarted: false,
        hasEnded: false,
        enrolledTeams:[],
        entryFee: entryFee,
        earnings: earnings,
        maxCapacity: maxCapacity,
        accessibility: accessibility,
        matches:[],
        updates: [],
        application: [],
        acceptedTeams: [],
        applications: []
    })
    }}
    res.status(200).json(newTournament);
   }catch (error) {
    res.status(400).json({ error: error.message });
  }
};


const newTournament = new Tournament({
  _id: "89b72cfe-0b87-4395-8230-8e8e1f571cb7",
  UUID: "89b72cfe-0b87-4395-8230-8e8e1f571cb7",
  host: "07d3f741-38d0-4f19-891a-cdcf78c7ee8c", // waleed5
  title: "Fortnite Duo Cup",
  teamSize: 2,
  description: "Enter the description of the tournament here. The length must be limited to 200 characters on the backend.",
  type: "battle royale",
  category: "fortnite",
  startDate: new Date("2024-02-29T10:01:31.474Z"),
  endDate: new Date("2024-02-29T10:02:10.959Z"),
  hasStarted: false,
  hasEnded: false,
  enrolledTeams: [
    {
      teamName: "Team 1",
      players: [
        {
          UUID: "9410f264-0bef-4516-b3ea-661c575490f2",
        },
        {
          UUID: "9410f264-0bef-4516-b3ea-661c575492f2",
        }
      ],
      score: 0,
      eliminated: true
    },
    {
      teamName: "Team 2",
      players: [
        {
          UUID: "9410f264-0bef-4516-b3e4-661c575690f2",
        },
        {
          UUID: "9410f264-0bef-4516-b3e2-661c575692f2",
        }
      ],
      score: 0,
      eliminated: false
    }
  ],
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


  // // delete all tournaments
  // await Tournament.deleteMany({})
  //   .then(result => {
  //     console.log(`${result.deletedCount} tournaments deleted successfully.`);
  //   })
  //   .catch(error => {
  //     console.error('Error deleting tournaments:', error);
  //   });


  // Delete the tournament document with the specified ID
  // await Tournament.findByIdAndDelete('89b72cfe-0b87-4395-8230-8e8e1f571cb7')
  // .then(deletedTournament => {
  //   if (!deletedTournament) {
  //     console.log('Tournament not found');
  //   } else {
  //     console.log('Tournament deleted successfully:', deletedTournament);
  //   }
  // })
  // .catch(error => {
  //   console.error('Error deleting tournament:', error);
  // });


  // // create new tournament
  // await newTournament.save()
  //   .then(savedTournament => {
  //     console.log('Tournament saved successfully:', savedTournament);
  //   })
  //   .catch(error => {
  //     console.error('Error saving tournament:', error);
  //   });

  // print all tournaments
  Tournament.find({}).exec()
  .then(tournaments => {
    tournaments.forEach(tournament => {
      console.log(tournament);
      console.log("Type of id: ", typeof(tournament._id))
    });
  })
  .catch(error => {
    console.error('Error fetching tournaments:', error);
  });


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


  // print all users in the db
  // User.find({}).exec()
  // .then(users => {
  //   users.forEach(user => {
  //     console.log(user);
  //   });
  // })

  try {
    const UUID = req.query.UUID;
    console.log(UUID)
    if (!UUID) {
      return res.status(400).json({ error: 'UUID parameter is missing' });
    }

    const userUUID = req.user;


    const tournament = await Tournament.findById(UUID);
    if (!tournament) {
      return res.status(404).json({ error: 'Tournament not found' });
    }


    const isHost = (tournament.host == userUUID)


    // await generateAndAddUsersToTournament(UUID, 50);


    async function getUserByUsername(username) {
      try {
        // Find the user document by username
        const user = await User.findOne({ username });
        return user; // Return the user document
      } catch (error) {
        console.error('Error finding user by username:', error);
        throw error; // Throw the error for handling elsewhere
      }
    }


    const transformEnrolledUsers = await Promise.all(tournament.enrolledUsers.map(async (user) => {
      const userDoc = await User.findById(user.UUID);
      return {
        username: userDoc ? userDoc.username : null,
        score: user.score,
        eliminated: user.eliminated
      };
    }));

    // convert team schema object to teamName, players, score, eliminated
    async function transformEnrolledTeams(originalEnrolledTeams) {
      const transformedEnrolledTeams = await Promise.all(originalEnrolledTeams.map(async team => {
        const players = await Promise.all(team.players.map(async player => {
          const user = await User.findOne({ _id: player.UUID });
          return { username: 'x' }; // Assuming 'username' is the field in the user document containing the username
        }));
        return {
          teamName: team.teamName,
          players: players,
          score: team.score,
          eliminated: team.eliminated
        };
      }));
      return transformedEnrolledTeams;
    }
    const transformedEnrolledTeams = await transformEnrolledTeams(tournament.enrolledTeams);

    let checkHasAppliedSolo = async () => {
      // get all applications
      // iterate over applications and get userUUID
      // if userUUID matches return true

      const applications = tournament.applications
      for (let i = 0; i < applications.length; i++) {
        const appliedUser = applications[i].UUID
        if (userUUID == appliedUser) {
          return true
        }
      }
      return false
    }

    let checkHasAppliedTeam = async () => {
      // get all applications
      // iterate over applications and get team members
      // if team members include userUUID return true

      const applications = tournament.applications
      for (let i = 0; i < applications.length; i++) {
        const teamUUID = applications[i].UUID
        const team = await Team.findOne({ _id: teamUUID })
        if (team.leader != userUUID) {
          return false
        }
      }
      return false
    }
    const hasAppliedSolo = await checkHasAppliedSolo()
    const hasAppliedTeam = await checkHasAppliedTeam()
    const hasApplied = hasAppliedSolo || hasAppliedTeam

    let checkIsAcceptedSolo = async () => {
      return tournament.acceptedUsers.includes(userUUID)
    }

    let checkIsAcceptedTeam = async () => {
      // get all accepted teams
      // iterate over teams and get team leaders
      // if team leaders include userUUID return true

      const acceptedTeams = tournament.acceptedTeams
      for (let i = 0; i < acceptedTeams.length; i++) {
        console.log(acceptedTeams[i])
        const teamUUID = acceptedTeams[i]
        const team = await Team.findOne({ _id: teamUUID })
        if (team.leader == userUUID) {
          return true
        }
      }
      return false
    }
    const isAcceptedSolo = await checkIsAcceptedSolo()
    const isAcceptedTeam = await checkIsAcceptedTeam()
    const isAccepted = isAcceptedSolo || isAcceptedTeam

    let checkIsJoinedSolo = async () => {
      return tournament.enrolledUsers.some(user => user.UUID === userUUID)
    }

    let checkIsJoinedTeam = async () => {
      // get all enrolled teams
      // iterate over teams and get team members
      // if team members include userUUID return true

      const enrolledTeams = tournament.enrolledTeams
      console.log(enrolledTeams)
      for (let i = 0; i < enrolledTeams.length; i++) {
        const team = enrolledTeams[i]
        console.log(team)
        if ((team.players.map(player => player.UUID)).includes(userUUID)) {
          return true
        }
      }
      return false
    }
    const isJoinedSolo = await checkIsJoinedSolo()
    const isJoinedTeam = await checkIsJoinedTeam()
    console.log('isJoinedSolo', isJoinedSolo, 'isJoinedTeam', isJoinedTeam)
    const isJoined = isJoinedSolo || isJoinedTeam

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
      isAccepted: isAccepted,
      updates: tournament.updates,
      isHost: isHost,
      application: tournament.application,
      hasApplied: hasApplied,
      enrolledUsers: transformEnrolledUsers,
      enrolledTeams: transformedEnrolledTeams,
      hasStarted: tournament.hasStarted,
      startDate: tournament.startDate,
      endDate: tournament.endDate,
      isJoined: isJoined
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


  // find team by name (name is unique but its not the id. the UUID is unique so treat name like any other attribute)
  const team = await Team.findOne({ name: req.body.team });

  if (team.members.length != tournament.teamSize) {
    console.log(team.members, tournament.teamSize)
    return res.status(400).json({ error: 'Your chosen team must have exactly ' + tournament.teamSize + ' members.' })
  }


  const userUUID = req.user;


  let dbApplication = tournament.application
  let dbApplicationArray = Array.from(dbApplication)


  let userApplication = req.body.application
  let userApplicationArray = Array.from(userApplication)


  // match application form length
  if (dbApplicationArray.length != userApplicationArray.length) {
    return res.status(400).json({ error: 'Invalid application form' })
  }


  // match fields
  // fields must not be empty
  for (let i = 0; i < dbApplicationArray.length; i++) {
    if (dbApplicationArray[i].name != userApplicationArray[i].label) {
      return res.status(400).json({ error: 'Invalid application form' })
    }
    if (!userApplicationArray[i].input) {
      return res.status(400).json({ error: 'Invalid application form' })
    }
  }


  // check if already applied
  if (team) {
    // check if team already applied
    let alreadyApplied = false
    tournament.applications.forEach(app => {
      if (app.UUID == team._id) {
        alreadyApplied = true
      }
    })
    if (alreadyApplied) {
      return res.status(400).json({ error: 'Team already applied' })
    }
  }
  else {
    // check if user already applied
    let alreadyApplied = false
    tournament.applications.forEach(app => {
      if (app.UUID == userUUID) {
        alreadyApplied = true
      }
    })
    if (alreadyApplied) {
      return res.status(400).json({ error: 'User already applied' })
    }
  }


  // tournament must have capacity available
  if (team) {
    if (tournament.enrolledTeams.length + 1 > tournament.maxCapacity) {
      return res.status(404).json({ error: 'No capacity available' })
    }
  }
  else {
    if (tournament.enrolledUsers.length + 1 > tournament.maxCapacity) {
      return res.status(404).json({ error: 'No capacity available' })
    }
  }

  // tournament must not have started
  if (tournament.hasStarted) {
    return res.status(404).json({ error: 'Tournament has started' })
  }


  function isUserEnrolled(userUUID) {
    const userExists = tournament.enrolledUsers.some(participant => participant.UUID === userUUID);
    return userExists;
  }
  if (isUserEnrolled(userUUID)) {
    return res.status(404).json({ error: 'You are already enrolled in this tournament.' })
  }

  function isTeamMemberEnrolled(team) {
    for (let member of team.members) {
      for (let enrolledTeam of tournament.enrolledTeams) {
        if (enrolledTeam.players.includes(member)) {
          return true;
        }
      }
    }
    return false;
  }
  if (isTeamMemberEnrolled(team)) {
    return res.status(404).json({ error: 'One of the team members is already enrolled in the tournament' })
  }

  // must not be host
  function isTeamHost(userUUID) {
    if (userUUID == tournament.host) return true


    if (team) {
      team.members.forEach(member => {
        if (member == tournament.host) return true
      })
    }


    // If neither user nor team exists
    return false;
  }


  if (isTeamHost(userUUID)) {
    return res.status(404).json({ error: 'Hosts cannot join their own tournaments.' })
  }


  if (team) {
    // add team to applications
    Tournament.updateOne(
      {
        _id
          : req.body.tournament
      },
      { $push: { applications: { UUID: team._id, application: userApplication, team } } }
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
  }
  else {
    // add application to applications
    Tournament.updateOne(
      { _id: req.body.tournament },
      { $push: { applications: { UUID: userUUID, application: userApplication } } }
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
  }

  res.status(200).json({ message: 'Application submitted successfully' })
}


const handleJoinAsSolo = async (req, res) => {
  console.log('Handling join as solo')


  const tournament = await Tournament.findById(req.body.tournament);
  if (!tournament) {
    return res.status(404).json({ error: 'No such tournament' });
  }

  // tournament must be solo
  if (tournament.teamSize != 1) {
    return res.status(404).json({ error: 'Invalid request' })
  }


  // tournament must have capacity available
  if (tournament.enrolledUsers.length * tournament.teamSize + 1 > tournament.maxCapacity) {
    return res.status(404).json({ error: 'Invalid request' })
  }

  // tournament must not have started
  if (tournament.hasStarted) {
    return res.status(404).json({ error: 'Invalid request' })
  }


  // user must not already be part of tournament
  if ((tournament.enrolledUsers.map(user => user.UUID)).includes(userUUID)) {
    return res.status(404).json({ error: 'Invalid request' })
  }

  // user must not be host
  if (tournament.host == req.user) {
    return res.status(404).json({ error: 'Invalid request' })
  }

  const newUser = {
    UUID: req.user,
    score: 0,
    eliminated: false
  }

  // Add user to enrolled users
  Tournament.updateOne(
    { _id: req.body.tournament },
    { $push: { enrolledUsers: newUser } }
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

  res.status(200).json({ message: 'User joined tournament successfully' })
}


const handleJoinAsTeam = async (req, res) => {
  console.log('Handling join as team')
  const tournament = await Tournament.findById(req.body.tournament);
  if (!tournament) {
    return res.status(404).json({ error: 'No such tournament' });
  }

  console.log(req.body)
  const team = await Team.findById(req.body.team.uuid);
  if (!team) {
    return res.status(404).json({ error: 'No such team' });
  }

  // required team size must match provided team size
  if (tournament.teamSize != team.members.length) {
    return res.status(404).json({ error: 'Invalid request' })
  }


  // tournament must have capacity available
  if ((tournament.enrolledTeams.length + tournament.teamSize) > tournament.maxCapacity) {
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
        if (enrolledTeam.players.includes(member)) {
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

  const enrolledTeam = {
    teamName: team.name,
    players: team.members.map(member => ({ UUID: member })),
    score: 0, // Initial score
    eliminated: false, // Not eliminated initially
  };

  // Add team to enrolledTeams
  Tournament.updateOne(
    { _id: req.body.tournament },
    { $push: { enrolledTeams: enrolledTeam } }
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

  res.status(200).json({ message: 'Team joined tournament successfully' })
}


const editTitle = async (req, res) => {
  const { UUID, title } = req.body;


  // get tournament
  const tournament = await Tournament.findById(UUID);
  if (!tournament) {
    return res.status(404).json({ error: 'No such tournament' });
  }


  // ensure user is host
  if (tournament.host != req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }


  // ensure tournament hasnt started
  if (tournament.hasStarted) {
    return res.status(400).json({ error: 'Tournament has already started' });
  }


  try {
    const tournament = await Tournament.findByIdAndUpdate
      (UUID, { title }, { new: true });
    if (!tournament) {
      return res.status(404).json({ error: 'No such tournament' });
    }
    res.status(200).json(tournament);
  }
  catch (error) {
    res.status(400).json({ error: error.message });
  }
}


const editDescription = async (req, res) => {
  const { UUID, description } = req.body;


  // get tournament
  const tournament = await Tournament.findById(UUID);
  if (!tournament) {
    return res.status(404).json({ error: 'No such tournament' });
  }


  // ensure user is host
  if (tournament.host != req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }


  // ensure tournament hasnt started
  if (tournament.hasStarted) {
    return res.status(400).json({ error: 'Tournament has already started' });
  }


  // ensure description is no longer than 200 characters
  if (description.length > 200) {
    return res.status(400).json({ error: 'Description is too long' });
  }


  try {
    const tournament = await Tournament.findByIdAndUpdate
      (UUID, { description }, { new: true });
    if (!tournament) {
      return res.status(404).json({ error: 'No such tournament' });
    }
    res.status(200).json(tournament);
  }
  catch (error) {
    res.status(400).json({ error: error.message });
  }
}


const editStartDate = async (req, res) => {
  const { UUID, startDate } = req.body;


  // get tournament
  const tournament = await Tournament.findById(UUID);
  if (!tournament) {
    return res.status(404).json({ error: 'No such tournament' });
  }


  // ensure user is host
  if (tournament.host != req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }


  // ensure tournament hasnt started
  if (tournament.hasStarted) {
    return res.status(400).json({ error: 'Tournament has already started' });
  }


  // ensure start date is in the future
  if (startDate < new Date()) {
    return res.status(400).json({ error: 'Start date is in the past' });
  }


  // ensure start date is before end date
  if (startDate > tournament.endDate) {
    return res.status(400).json({ error: 'Start date is after end date' });
  }


  // validate date format in javascript
  if (isNaN(Date.parse(startDate))) {
    return res.status(400).json({ error: 'Invalid date format' });
  }


  try {
    const tournament = await Tournament.findByIdAndUpdate
      (UUID, { startDate }, { new: true });
    if (!tournament) {
      return res.status(404).json({ error: 'No such tournament' });
    }
    res.status(200).json(tournament);
  }
  catch (error) {
    res.status(400).json({ error: error.message });
  }
}


const editEndDate = async (req, res) => {
  const { UUID, endDate } = req.body;


  // get tournament
  const tournament = await Tournament.findById(UUID);
  if (!tournament) {
    return res.status(404).json({ error: 'No such tournament' });
  }


  // ensure user is host
  if (tournament.host != req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }


  // ensure tournament hasnt started
  if (tournament.hasStarted) {
    return res.status(400).json({ error: 'Tournament has already started' });
  }


  // ensure end date is in the future
  if (endDate < new Date()) {
    return res.status(400).json({ error: 'End date is in the past' });
  }


  // ensure end date is after start date
  if (endDate < tournament.startDate) {
    return res.status(400).json({ error: 'End date is before start date' });
  }


  // validate date format in javascript
  if (isNaN(Date.parse(endDate))) {
    return res.status(400).json({ error: 'Invalid date format' });
  }


  try {
    const tournament = await Tournament.findByIdAndUpdate
      (UUID, { endDate }, { new: true });
    if (!tournament) {
      return res.status(404).json({ error: 'No such tournament' });
    }
    res.status(200).json(tournament);
  }
  catch (error) {
    res.status(400).json({ error: error.message });
  }
}


const getManageTournamentDisplayData = async (req, res) => {

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

    // check if user is host
    if (tournament.host != req.user) {
      return res.status(401).send('Unauthorized');
    }


    const isHost = (tournament.host == userUUID)


    // await generateAndAddUsersToTournament(UUID, 50);


    async function getUserByUsername(username) {
      try {
        // Find the user document by username
        const user = await User.findOne({ username });
        return user; // Return the user document
      } catch (error) {
        console.error('Error finding user by username:', error);
        throw error; // Throw the error for handling elsewhere
      }
    }


    // Transform the data
    const transformedData = await Promise.all(tournament.enrolledTeams.map(async (participant) => {
      const players = await Promise.all(participant.players.map(async (player) => {
        const user = await getUserByUsername(player.UUID);
        return {
          username: user ? user.username : null,
          score: player.score,
          eliminated: player.eliminated
        };
      }));


      return {
        teamName: participant.teamName,
        players: players
      };
    }));


    async function getTeamNameAndApplications(applications) {
      try {

        const results = [];

        // Iterate through each application
        for (const application of applications) {
          // Query MongoDB for team information based on UUID
          const teamInfo = await Team.findOne({ _id: application.UUID });
          console.log(teamInfo)

          if (teamInfo) {
            // Format the result as an object containing team name and application details
            const result = {
              UUID: application.UUID,
              teamName: teamInfo.name,
              application: application.application
            };

            results.push(result);
          } else {
            // If no team information found for the provided UUID, add null teamName
            const result = {
              UUID: application.UUID,
              teamName: null,
              application: application.application
            };

            results.push(result);
          }
        }

        return results;
      } catch (err) {
        console.error('Error retrieving team information:', err);
        return [];
      }
    }


    const transformedApps = await getTeamNameAndApplications(tournament.applications);

    const transformEnrolledUsers = await Promise.all(tournament.enrolledUsers.map(async (user) => {
      const userDoc = await User.findById(user.UUID);
      return {
        username: userDoc ? userDoc.username : null,
        score: user.score,
        eliminated: user.eliminated
      };
    }));

    // convert team schema object to teamName, players, score, eliminated
    async function transformEnrolledTeams(originalEnrolledTeams) {
      const transformedEnrolledTeams = await Promise.all(originalEnrolledTeams.map(async team => {
        const players = await Promise.all(team.players.map(async player => {
          const user = await User.findOne({ _id: player.UUID });
          return { username: 'x' }; // Assuming 'username' is the field in the user document containing the username
        }));
        return {
          teamName: team.teamName,
          players: players,
          score: team.score,
          eliminated: team.eliminated
        };
      }));
      return transformedEnrolledTeams;
    }
    const transformedEnrolledTeams = await transformEnrolledTeams(tournament.enrolledTeams);

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
      enrolledUsers: transformEnrolledUsers,
      enrolledTeams: transformedEnrolledTeams,
      hasStarted: tournament.hasStarted,
      startDate: tournament.startDate,
      endDate: tournament.endDate,
      applications: transformedApps
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
}


const images = new Map();
images.set('fortnite', "https://m.media-amazon.com/images/M/MV5BOGY3ZjM3NWUtMWNiMi00OTcwLWIxN2UtMjNhMDhmZWRlNzRkXkEyXkFqcGdeQXVyNjMxNzQ2NTQ@._V1_.jpg")
images.set('counter strike', "https://static.displate.com/857x1200/displate/2023-06-12/6e217abc7f5bb5d0dc56e68752193a11_5c51574f5f2f216f9ef25a0d08fa6400.jpg")
images.set('tennis', "https://upload.wikimedia.org/wikipedia/commons/thumb/9/94/2013_Australian_Open_-_Guillaume_Rufin.jpg/800px-2013_Australian_Open_-_Guillaume_Rufin.jpg")
images.set('league of legends', "https://cdn1.epicgames.com/offer/24b9b5e323bc40eea252a10cdd3b2f10/EGS_LeagueofLegends_RiotGames_S2_1200x1600-905a96cea329205358868f5871393042")
images.set('football', "https://upload.wikimedia.org/wikipedia/commons/4/42/Football_in_Bloomington%2C_Indiana%2C_1995.jpg")
images.set('basketball', "https://static.owayo-cdn.com/newhp/img/magazin/basketballstatistikEN/basketball-statistics-670.jpg")
images.set('valorant', "https://m.media-amazon.com/images/M/MV5BNmNhM2NjMTgtNmIyZC00ZmVjLTk4YWItZmZjNGY2NThiNDhkXkEyXkFqcGdeQXVyODU4MDU1NjU@._V1_FMjpg_UX1000_.jpg")




const getRandomTournaments = (tournaments) => {
  // Shuffle array using Durstenfeld shuffle algorithm for randomization
  for (let i = tournaments.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = tournaments[i];
    tournaments[i] = tournaments[j];
    tournaments[j] = temp;
  }


  // Select the first 10 tournaments after shuffling
  const selectedTournaments = tournaments.slice(0, 10);


  // Format each tournament for the front end
  const formattedTournaments = selectedTournaments.map(tournament => ({
    UUID: tournament.UUID,
    title: tournament.title,
    description: tournament.description,
    image: images.get(tournament.category)
  }));




  return formattedTournaments;
};

const getTrendingTournaments = async (req, res) => {
  const tournaments = await Tournament.find({})
  const RandomTournaments = getRandomTournaments(tournaments)
  return res.json(RandomTournaments)
}

const getTournamentCategories = async (req, res) => {
  const categories = ["fortnite", "counter strike", "tennis", "league of legends", "football", "basketball", "valorant"]
  return res.json(categories)
}

const updateScores = async (req, res) => {
  const { tournamentUUID, teamName, playerUUID, newScore } = req.body;

  // check if user is host
  if (tournament.host != req.user) {
    return res.status(401).send('Unauthorized');
  }

  if (!tournamentUUID || !teamName || !playerUUID || newScore == null) {
    return res.status(400).send('Missing required fields.');
  }


  try {
    const result = await Tournament.findOneAndUpdate(
      {
        UUID: tournamentUUID,
        category: "Battle Royale",
        "enrolledParticipants.teamName": teamName,
        "enrolledParticipants.players.UUID": playerUUID
      },
      {
        $set: {
          "enrolledParticipants.$.players.$[elem].score": newScore
        }
      },
      {
        arrayFilters: [{ "elem.UUID": playerUUID }],
        new: true
      }
    );


    if (!result) {
      return res.status(404).send("No matching battle royale tournament, team, or player found, or tournament is not 'Battle Royale'.");
    }


    res.json({ message: 'Score updated successfully', updatedTournament: result });
  } catch (error) {
    console.error('Failed to update score:', error);
    res.status(500).send('Error updating player score.');
  }
}

const acceptApplication = async (req, res) => {
  const { tournamentUUID, applicationUUID } = req.body;

  const tournament = await Tournament.findOne({ UUID: tournamentUUID });
  if (!tournament) {
    return res.status(404).send('Tournament not found');
  }

  // check if user is host
  if (tournament.host != req.user) {
    return res.status(401).send('Unauthorized');
  }

  application = tournament.applications.find(app => app.UUID === applicationUUID);
  console.log(application)
  if (!application) {
    return res.status(404).send('Application not found');
  }

  // add team to acceptedTeams
  const team = await Team.findOne({ _id: application.UUID });
  if (team) {
    tournament.acceptedTeams.push(team._id);
  }
  // add user to acceptedUsers
  else {
    tournament.acceptedUsers.push(application.UUID);
  }

  // remove application from database
  tournament.applications = tournament.applications.filter(app => app.UUID !== applicationUUID);
  tournament.save();

  res.status(200).send('Application accepted');
}

const rejectApplication = async (req, res) => {
  const { tournamentUUID, applicationUUID } = req.body;

  const tournament = await Tournament.findOne({ UUID: tournamentUUID });
  if (!tournament) {
    return res.status(404).send('Tournament not found');
  }

  // check if user is host
  if (tournament.host != req.user) {
    return res.status(401).send('Unauthorized');
  }

  const application = tournament.applications.find(app => app.UUID === applicationUUID);
  if (!application) {
    return res.status(404).send('Application not found');
  }

  // remove application from database
  tournament.applications = tournament.applications.filter(app => app.UUID !== applicationUUID);
  tournament.save();

  res.status(200).send('Application rejected');
}

const postUpdate = async (req, res) => {
  const { UUID, update } = req.body;

  if (update.length < 1) {
    return res.status(400).send('You must enter an update');
  }

  const tournament = await Tournament.findOne({ _id: UUID });
  if (!tournament) {
    return res.status(404).send('Tournament not found');
  }

  const newUpdate = {
    date: new Date(),
    content: update,
  };

  tournament.updates.push(newUpdate);
  tournament.save();

  res.status(200).send('Update posted');
}

const editSoloParticipants = async (req, res) => {
}

const editTeamParticipants = async (req, res) => {
  const { UUID, participants } = req.body;
  console.log(UUID, participants)

  const tournament = await Tournament.findOne({ _id: UUID });
  if (!tournament) {
    return res.status(404).send('Tournament not found');
  }

  // check if user is host
  if (tournament.host != req.user) {
    return res.status(401).send('Unauthorized');
  }

  // ennsure tournament has started
  // if (!tournament.hasStarted) {
  //   return res.status(400).send('Tournament has not started');
  // }

  // ensure tournament is team based
  if (tournament.teamSize == 1) {
    return res.status(400).send('Tournament is not team based');
  }

  try {
    // Create an array of update operations for each team
    const updateOperations = participants.map(teamData => ({
      updateOne: {
        filter: { _id: UUID, "enrolledTeams.teamName": teamData.teamName },
        update: {
          $set: {
            "enrolledTeams.$.score": teamData.score,
            "enrolledTeams.$.eliminated": teamData.eliminated
          }
        }
      }
    }));

    // Execute all update operations in bulk
    const result = await Tournament.bulkWrite(updateOperations);

    console.log(`${result.modifiedCount} teams in tournament '${UUID}' updated successfully.`);
  } catch (error) {
    console.error(`Error updating teams in tournament '${UUID}':`, error);
  }

  res.status(200).send('Participants updated');
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
  handleJoinAsTeam,
  editTitle,
  editDescription,
  editStartDate,
  editEndDate,
  getManageTournamentDisplayData,
  getTrendingTournaments,
  getTournamentCategories,
  updateScores,
  acceptApplication,
  rejectApplication,
  postUpdate,
  editSoloParticipants,
  editTeamParticipants
};


