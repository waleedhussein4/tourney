const Tournament = require('../models/tourneyModels');
const Team = require('../models/teamModels');
const User = require('../models/userModel');
const jwt = require('jsonwebtoken');
const generateAndAddUsersToTournament = require('./tester');


// Create a new tournament
const createTournament = async (req, res) => {
 const { UUID,title,description,category,teamSize,entryFee,prize,applications} = req.body;


 try {
   const newTournament = await Tournament.create({
      UUID,
      title,
      description,
      category,
      teamSize,
      entryFee,
      prize,
      applications
   });
   res.status(200).json(newTournament);
 } catch (error) {
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
 enrolledParticipants: [
   {
     teamName: "Team 1",
     players: [
       {
         UUID: "9410f264-0bef-4516-b3ea-661c575490f2",
         score: 0,
         eliminated: false
       },
       {
         UUID: "9410f264-0bef-4516-b3ea-661c575490f2",
         score: 0,
         eliminated: false
       }
     ]
   },
   {
     teamName: "Team 2",
     players: [
       {
         UUID: "9410f264-0bef-4516-b3ea-661c575690f2",
         score: 0,
         eliminated: false
       },
       {
         UUID: "9410f264-0bef-4516-b3ea-661c575690f2",
         score: 0,
         eliminated: false
       }
     ]
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


 // delete all tournaments
 // await Tournament.deleteMany({})
 // .then(result => {
 //   console.log(`${result.deletedCount} tournaments deleted successfully.`);
 // })
 // .catch(error => {
 //   console.error('Error deleting tournaments:', error);
 // });


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


 // print all users in the db
 // User.find({}).exec()
 // .then(users => {
 //   users.forEach(user => {
 //     console.log(user);
 //   });
 // })
  
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
   const transformedData = await Promise.all(tournament.enrolledParticipants.map(async (participant) => {
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
       enrolledParticipants: transformedData,
     },
     hasStarted: tournament.hasStarted,
     startDate: tournament.startDate,
     endDate: tournament.endDate,
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
   return res.status(400).json({ error: 'Your chosen team must have exactly ' + tournament.teamSize + ' members.' })
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


 // check if already applied
 if(team) {
   // check if team already applied
   let alreadyApplied = false
   tournament.applications.forEach(app => {
     if(app.UUID == team._id) {
       alreadyApplied = true
     }
   })
   if(alreadyApplied) {
     return res.status(400).json({ error: 'Team already applied' })
   }
 }
 else {
   // check if user already applied
   let alreadyApplied = false
   tournament.applications.forEach(app => {
     if(app.UUID == userUUID) {
       alreadyApplied = true
     }
   })
   if(alreadyApplied) {
     return res.status(400).json({ error: 'User already applied' })
   }
 }


 // tournament must have capacity available
 if (tournament.enrolledParticipants.length * tournament.teamSize + 1 > tournament.maxCapacity) {
   return res.status(404).json({ error: 'No capacity available' })
 }


 // tournament must not have started
 if (tournament.hasStarted) {
   return res.status(404).json({ error: 'Tournament has started' })
 }


 // applicant must not already be part of tournament
 function isUserOrTeamEnrolled(userUUID, teamName) {
   if (userUUID) {
     const userExists = tournament.enrolledParticipants.some(participant => participant.players.some(player => player.UUID === userUUID));
     console.log('User exists:', userExists);
     if (userExists) {
       return true;
     }
   }


   // Check if teamName is provided
   if (teamName) {
     const teamExists = tournament.enrolledParticipants.some(participant => participant.teamName === teamName);
     console.log('Team exists:', teamExists);
     if (teamExists) {
       return true;
     }
   }


   // If neither user nor team exists
   return false;
   }
  if (isUserOrTeamEnrolled(userUUID, req.body.team)) {
   return res.status(404).json({ error: 'You are already enrolled in this tournament.' })
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


 if(team) {
   // add team to applications
   Tournament.updateOne(
     { _id
     : req.body.tournament },
     { $push: { applications: {UUID: team._id, application: userApplication, team} } }
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
     { $push: { applications: {UUID: userUUID, application: userApplication} } }
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
 if (tournament.enrolledParticipants.length * tournament.teamSize + 1 > tournament.maxCapacity) {
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
   const transformedData = await Promise.all(tournament.enrolledParticipants.map(async (participant) => {
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
       enrolledParticipants: transformedData,
     },
     hasStarted: tournament.hasStarted,
     startDate: tournament.startDate,
     endDate: tournament.endDate,
     applications: tournament.applications
   });
 } catch (error) {
   console.error(error);
   res.status(500).json({ error: 'Server error' });
 }
}


const images = new Map();
images.set('fortnite',"https://m.media-amazon.com/images/M/MV5BOGY3ZjM3NWUtMWNiMi00OTcwLWIxN2UtMjNhMDhmZWRlNzRkXkEyXkFqcGdeQXVyNjMxNzQ2NTQ@._V1_.jpg")
images.set('counter strike',"https://static.displate.com/857x1200/displate/2023-06-12/6e217abc7f5bb5d0dc56e68752193a11_5c51574f5f2f216f9ef25a0d08fa6400.jpg")
images.set('tennis',"https://upload.wikimedia.org/wikipedia/commons/thumb/9/94/2013_Australian_Open_-_Guillaume_Rufin.jpg/800px-2013_Australian_Open_-_Guillaume_Rufin.jpg")
images.set('league of legends',"https://cdn1.epicgames.com/offer/24b9b5e323bc40eea252a10cdd3b2f10/EGS_LeagueofLegends_RiotGames_S2_1200x1600-905a96cea329205358868f5871393042")
images.set('football',"https://upload.wikimedia.org/wikipedia/commons/4/42/Football_in_Bloomington%2C_Indiana%2C_1995.jpg")
images.set('basketball',"https://static.owayo-cdn.com/newhp/img/magazin/basketballstatistikEN/basketball-statistics-670.jpg")
images.set('valorant',"https://m.media-amazon.com/images/M/MV5BNmNhM2NjMTgtNmIyZC00ZmVjLTk4YWItZmZjNGY2NThiNDhkXkEyXkFqcGdeQXVyODU4MDU1NjU@._V1_FMjpg_UX1000_.jpg")




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


const getTrendingTournaments = async (req,res) => {
 const tournaments = await Tournament.find({})
 const RandomTournaments = getRandomTournaments(tournaments)
 return res.json(RandomTournaments)
}


const getTournamentCategories = async (req,res) => {
 const categories = ["fortnite","counter strike","tennis","league of legends","football","basketball","valorant"]
 return res.json(categories)
}


async function handleApplication(tournamentUUID, applicationUUID, accept) {
 try {
     // Find the tournament by UUID
     const tournament = await Tournament.findOne({ UUID: tournamentUUID });
     if (!tournament) {
         throw new Error("Tournament not found");
     }


     // Find the application within the tournament
     const applicationIndex = tournament.applications.findIndex(app => app.UUID === applicationUUID);
     if (applicationIndex === -1) {
         throw new Error("Application not found");
     }


     // Handle the application based on the 'accept' flag
     if (accept) {
         // Add the user to acceptedUsers if not already added
         const userUUID = tournament.applications[applicationIndex].UUID;
         if (!tournament.acceptedUsers.includes(userUUID)) {
             tournament.acceptedUsers.push(userUUID);
         }
     }


     // Remove the application whether accepted or rejected
     tournament.applications.splice(applicationIndex, 1);


     // Save the updated tournament
     await tournament.save();
     console.log(`Application ${accept ? 'accepted' : 'rejected'} and processed.`);
 } catch (error) {
     console.error("Error handling the application:", error.message);
 }
}


const response = async (req,res) => {
 const { tournamentUUID, applicationUUID, accept } = req.body;


   if (typeof accept !== 'boolean') {
       return res.status(400).send("Invalid 'accept' value, must be boolean.");
   }


   try {
       await handleApplication(tournamentUUID, applicationUUID, accept);
       res.send(`Application has been ${accept ? 'accepted' : 'rejected'}.`);
   } catch (error) {
       res.status(500).send(error.message);
   }
}


const updateScore = async (req,res) =>{
 const { tournamentUUID, teamName, playerUUID, newScore } = req.body;


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
               arrayFilters: [{"elem.UUID": playerUUID}],
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
 response,
 updateScore
};


  