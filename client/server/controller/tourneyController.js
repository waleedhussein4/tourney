const Tournament = require('../models/tourneyModels');
const Team = require('../models/teamModels');
const User = require('../models/userModel');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const generateAndAddUsersToTournament = require('./tester');


// Create a new tournament
const createTournament = async (req, res) => {
  res.setHeader('Access-Control-Allow-Credentials', true)
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:5173')
  // another common pattern
  // res.setHeader('Access-Control-Allow-Origin', req.headers.origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  )
  let { title, teamSize, description, type, category, entryFee, earnings, accessibility, maxCapacity, applications } = req.body;
  console.log('Earnings: ' + earnings)
  category = category;
  teamSize = parseInt(teamSize)
  maxCapacity = parseInt(maxCapacity)
  entryFee = parseInt(entryFee)
  if (typeof earnings === 'string') {
    console.log("in earnigs")
    earnings = parseInt(earnings)
  }
  accessibility = accessibility.toLowerCase();
  type = type.toLowerCase();
  if (type === "bracket") {
    type = "brackets"
  }
  if (type === "battleroyale") {
    type = "battle royale"
  }
  console.log(req.body)
  console.log(typeof applications)
  const id = uuidv4();
  console.log(id)
  // let errors = [];

  //   if (description && description.length > 200) {
  //       errors.push("Description is more than 200 chars.");
  //   }

  // if (parseInt(teamSize) === 0) {
  //   errors.push("Can't be an empty team.");
  // }

  //   // if (typeof teamSize === 'string') {
  //   //     errors.push("Team size must be an integer.");
  //   // }

  // if (earnings !== undefined && earnings <= -1) {
  //     errors.push("Earnings must be positive.");
  // }
  // console.log(typeof entryFee)
  // // if (typeof entryFee === 'string') {
  // //     errors.push("Entry fee must be an integer.");
  // // }

  // if (typeof type !== 'string') {
  //     errors.push("Type must be a string.");
  // }
  // console.log(errors)
  // if (errors.length > 0) {
  //     return res.status(400).send({ errors });
  // }

  let newTournament
  try {
    console.log('teamsize: ' + teamSize)
    if (type === "brackets") {
      if (parseInt(teamSize) === 1) {
        console.log("in if")
        newTournament = await Tournament.create({
          _id: id,
          UUID: id,
          host: req.user,
          title: title,
          teamSize: teamSize,
          description: description,
          type: type,
          category: category,
          startDate: "2024-04-24T02:09:13.636+00:00",
          endDate: "2024-02-29T10:02:10.959+00:00",
          hasStarted: false,
          hasEnded: false,
          enrolledTeams: [],
          enrolledUsers: [],
          entryFee: entryFee,
          earnings: earnings,
          maxCapacity: maxCapacity * teamSize,
          accessibility: accessibility,
          matches: [],
          updates: [],
          acceptedUsers: [],
          acceptedTeams: [],
          application: applications,
          applications: []
        })
      }
      if (parseInt(teamSize) > 1) {
        console.log('iseeu')
        newTournament = await Tournament.create({
          _id: id,
          UUID: id,
          host: req.user,
          title: title,
          teamSize: teamSize,
          description: description,
          type: type.toLowerCase(),
          category: category,
          startDate: "2024-04-24T02:09:13.636+00:00",
          endDate: "2024-02-29T10:02:10.959+00:00",
          hasStarted: false,
          hasEnded: false,
          enrolledTeams: [],
          enrolledUsers: [],
          entryFee: entryFee,
          earnings: earnings,
          maxCapacity: maxCapacity * teamSize,
          accessibility: accessibility,
          matches: [],
          updates: [],
          application: [],
          acceptedUsers: [],
          acceptedTeams: [],
          application: applications
        })
      }
    };
    console.log('type: ' + type.toLowerCase())
    if (type.toLowerCase() === "battle royale") {
      console.log('battle royALE')
      if (parseInt(teamSize) === 1) {
        newTournament = await Tournament.create({
          _id: id,
          UUID: id,
          host: req.user,
          title: title,
          teamSize: teamSize,
          description: description,
          type: type.toLowerCase(),
          category: category,
          startDate: "2024-04-24T02:09:13.636+00:00",
          endDate: "2024-02-29T10:02:10.959+00:00",
          hasStarted: false,
          hasEnded: false,
          enrolledUsers: [],
          entryFee: entryFee,
          earnings: earnings,
          maxCapacity: maxCapacity,
          accessibility: accessibility,
          matches: [],
          updates: [],
          application: applications,
          acceptedUsers: [],
          applications: []
        })
      }
      if (parseInt(teamSize) >= 2) {
        newTournament = await Tournament.create({
          _id: id,
          UUID: id,
          host: req.user,
          title: title,
          teamSize: teamSize,
          description: description,
          type: type.toLowerCase(),
          category: category,
          startDate: "2024-04-24T02:09:13.636+00:00",
          endDate: "2024-02-29T10:02:10.959+00:00",
          hasStarted: false,
          hasEnded: false,
          enrolledTeams: [],
          entryFee: entryFee,
          earnings: earnings,
          maxCapacity: maxCapacity,
          accessibility: accessibility,
          matches: [],
          updates: [],
          application: applications,
          acceptedTeams: [],
          applications: []
        })
      }
    }
    console.log('newTournament: ' + newTournament)
    res.status(200).json(newTournament);
  } catch (error) {
    console.log("wrro")
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
  earnings: [
    200,
    100,
    50
  ],
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
  acceptedTeams: [],
  applications: [],
  matches: []
});

async function createTournaments() {

  // delete all tournaments
  await Tournament.deleteMany({})
    .then(result => {
      console.log(`${result.deletedCount} tournaments deleted successfully.`);
    })
    .catch(error => {
      console.error('Error deleting tournaments:', error);
    });

  let tournaments = [];

  let tournament1 = new Tournament({
    _id: "89b50cfe-0b87-4395-8230-8e8e1f571cb7",
    UUID: "89b50cfe-0b87-4395-8230-8e8e1f571cb7",
    host: "e1236c52-1db6-4524-9dc3-25a030b6b61e", // soumi7
    title: "Football Tournament",
    teamSize: 2,
    description: "A fun football tournament.",
    type: "battle royale",
    category: "football",
    startDate: new Date("2024-05-05T22:50:00.000Z"),
    endDate: new Date("2024-05-10T17:30:00.000Z"),
    hasStarted: false,
    hasEnded: false,
    enrolledTeams: [
    ],
    entryFee: 0,
    earnings: [
      0
    ],
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
        name: "Player names"
      },
      {
        name: "Player ages"
      }
    ],
    acceptedUsers: [],
    acceptedTeams: [],
    applications: [],
    matches: []
  })

  await tournament1.save()
    .then(savedTournament => {
      console.log('Tournament saved successfully:', savedTournament);
    })
    .catch(error => {
      console.error('Error saving tournament:', error);
    });


  let tournament2 = new Tournament({
    _id: "15b72cfe-0b87-4395-8230-8e8e1f571cb7",
    UUID: "15b72cfe-0b87-4395-8230-8e8e1f571cb7",
    host: "d6cab22f-b734-4ad9-b43e-cde81a82b62b", // Waleed00
    title: "Fortnite Duo Cup",
    teamSize: 2,
    description: "The ultimate Fortnite duo championship. High stakes. High rewards. Only the best will emerge victorious",
    type: "brackets",
    category: "fortnite",
    startDate: new Date("2024-04-23T17:30:00.000Z"),
    endDate: new Date("2024-05-01T19:30:00.000Z"),
    hasStarted: false,
    hasEnded: false,
    enrolledTeams: [
      {
        teamName: "Team 1",
        players: [
          {
            UUID: "9410f265-0bef-4516-b3ea-661c575490f2",
          },
          {
            UUID: "9410f267-0bef-4516-b3ea-661c575492f2",
          }
        ],
        score: 0,
        eliminated: false
      },
      {
        teamName: "Team 2",
        players: [
          {
            UUID: "9410f244-0bef-4516-b3e4-661c575690f2",
          },
          {
            UUID: "9410f2a4-0bef-4516-b3e2-661c575692f2",
          }
        ],
        score: 0,
        eliminated: false
      },
      {
        teamName: "Team 3",
        players: [
          {
            UUID: "9410f264-0beg-4516-b3e4-661c575690f2",
          },
          {
            UUID: "9410f264-0bzf-4516-b3e2-661c575692f2",
          }
        ],
        score: 0,
        eliminated: false
      },
      {
        teamName: "Team 4",
        players: [
          {
            UUID: "9410f264-0bef-4z16-b3e4-661c575690f2",
          },
          {
            UUID: "9410f264-0bef-4516-b3e2-66xc575692f2",
          }
        ],
        score: 0,
        eliminated: false
      },
      {
        teamName: "Team 5",
        players: [
          {
            UUID: "9410f264-0bef-4516-b3e4-661c57b690f2",
          },
          {
            UUID: "9410f264-0bef-4516-b3e2-661c575692l2",
          }
        ],
        score: 0,
        eliminated: false
      },
      {
        teamName: "Team 6",
        players: [
          {
            UUID: "9410f264-0bef-4516-b3e4-66hc575690f2",
          },
          {
            UUID: "9410f264-0beh-4516-b3e2-661c575692f2",
          }
        ],
        score: 0,
        eliminated: false
      },
      {
        teamName: "Team 7",
        players: [
          {
            UUID: "9410f264-0bef-45m6-b3e4-661c575690f2",
          },
          {
            UUID: "9410f264-0bef-4y16-b3e2-661c575692f2",
          }
        ],
        score: 0,
        eliminated: false
      }
    ],
    entryFee: 5,
    earnings: 50,
    maxCapacity: 16,
    accessibility: "application required",
    updates: [],
    application: [
      {
        name: "Names"
      },
      {
        name: "Ages"
      },
      {
        name: "Epic Games Usernames"
      }
    ],
    acceptedUsers: [],
    acceptedTeams: [],
    applications: [],
    matches: []
  });

  await tournament2.save()
    .then(savedTournament => {
      console.log('Tournament saved successfully:', savedTournament);
    })
    .catch(error => {
      console.error('Error saving tournament:', error);
    });

  let tournament3 = new Tournament({
    _id: "15b72cfe-0b87-4395-8230-8e8e2f571cb7",
    UUID: "15b72cfe-0b87-4395-8230-8e8e2f571cb7",
    host: "d6cab22f-b734-4ad9-b43e-cde81a82b62b", // Waleed00
    title: "Fortnite Solo Cup",
    teamSize: 1,
    description: "The ultimate Fortnite solo championship. High stakes. High rewards. Only the best will emerge victorious",
    type: "brackets",
    category: "fortnite",
    startDate: new Date("2024-04-23T17:30:00.000Z"),
    endDate: new Date("2024-05-01T19:30:00.000Z"),
    hasStarted: false,
    hasEnded: false,
    enrolledUsers: [
      {
        UUID: "d6cab22f-b734-4ad9-b43e-cde81a82b62b",
        score: 0,
        eliminated: false
      }
    ],
    entryFee: 5,
    earnings: 50,
    maxCapacity: 16,
    accessibility: "application required",
    updates: [],
    application: [
      {
        name: "Names"
      },
      {
        name: "Ages"
      },
      {
        name: "Epic Games Usernames"
      }
    ],
    acceptedUsers: [],
    acceptedTeams: [],
    applications: [],
    matches: []
  });

  await tournament3.save()
    .then(savedTournament => {
      console.log('Tournament saved successfully:', savedTournament);
    })
    .catch(error => {
      console.error('Error saving tournament:', error);
    });
}

// Get all tournaments
const getAllTournaments = async (req, res) => {
  res.setHeader('Access-Control-Allow-Credentials', true)
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:5173')
  // another common pattern
  // res.setHeader('Access-Control-Allow-Origin', req.headers.origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  )
  const tournaments = await Tournament.find().sort({ createdAt: -1 });
  res.status(200).json(tournaments);
};

const getPaginatedTournaments = async (req, res) => {
  res.setHeader('Access-Control-Allow-Credentials', true)
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:5173')
  // another common pattern
  // res.setHeader('Access-Control-Allow-Origin', req.headers.origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  )
  const { page } = req.params;
  const options = {
    page: parseInt(page) || 1,
    limit: parseInt(10) || 10,
  };

  const tournaments = await Tournament.find().limit(options.limit).skip(options.limit * (options.page - 1));
  res.status(200).json(tournaments);
};

// Function to calculate Jaro-Winkler distance between two strings
function jaroWinklerDistance(s1, s2) {
  const prefixMatchScale = 0.1;
  const maxPrefixLength = 4;

  if (s1 === s2) return 1;

  const s1Length = s1.length;
  const s2Length = s2.length;
  const matchDistance = Math.floor(Math.max(s1Length, s2Length) / 2) - 1;

  const s1Matches = new Array(s1Length).fill(false);
  const s2Matches = new Array(s2Length).fill(false);

  let matches = 0;
  for (let i = 0; i < s1Length; i++) {
    const start = Math.max(0, i - matchDistance);
    const end = Math.min(i + matchDistance + 1, s2Length);

    for (let j = start; j < end; j++) {
      if (!s2Matches[j] && s1[i] === s2[j]) {
        s1Matches[i] = true;
        s2Matches[j] = true;
        matches++;
        break;
      }
    }
  }

  if (matches === 0) return 0;

  let transpositions = 0;
  let k = 0;
  for (let i = 0; i < s1Length; i++) {
    if (s1Matches[i]) {
      while (!s2Matches[k]) k++;
      if (s1[i] !== s2[k]) transpositions++;
      k++;
    }
  }

  const jaro = (matches / s1Length + matches / s2Length + (matches - transpositions / 2) / matches) / 3;

  const prefixLength = Math.min(maxPrefixLength, Math.min(s1Length, s2Length));
  let commonPrefix = 0;
  for (let i = 0; i < prefixLength; i++) {
    if (s1[i] === s2[i]) commonPrefix++;
    else break;
  }

  const jaroWinkler = jaro + commonPrefix * prefixMatchScale * (1 - jaro);

  return jaroWinkler;
}

async function findSimilarTournaments(query) {
  const tournaments = await Tournament.find({});

  const similarMatches = tournaments.filter(tournament => {
    // Construct regular expression for the query
    const regex = new RegExp(query, 'i'); // 'i' flag for case insensitivity

    // Check if any field matches the regular expression
    return regex.test(tournament.title) || regex.test(tournament.description) || regex.test(tournament.category) || regex.test(tournament.type);
  }).map(tournament => tournament.title);

  return similarMatches;
}

const getFilteredTournaments = async (req, res) => {
  res.setHeader('Access-Control-Allow-Credentials', true)
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:5173')
  // another common pattern
  // res.setHeader('Access-Control-Allow-Origin', req.headers.origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  )

  try {
    const { search, category, minEntryFee, maxEntryFee, type, accessibility } = req.body;

    const query = {};

    // Add criteria to the query if they are provided and not default
    if (search) {
      const similarMatches = await findSimilarTournaments(search);
      query.$or = [
        { title: { $in: similarMatches } }, // Search for similar titles
        { description: { $in: similarMatches } }, // Search for similar descriptions
        { category: { $in: similarMatches } }, // Search for similar categories
        { type: { $in: similarMatches } } // Search for similar types
      ];
    }
    if (category !== "All") {
      query.category = category.toLowerCase();
    }
    if (minEntryFee !== "") {
      query.entryFee = { $gte: minEntryFee };
    }
    if (maxEntryFee !== "") {
      query.entryFee = { ...query.entryFee, $lte: maxEntryFee };
    }
    if (type !== "Any") {
      query.type = type.toLowerCase();
    }
    if (accessibility !== "Any") {
      query.accessibility = accessibility.toLowerCase();
    }

    const { page } = req.params;
    const options = {
      page: parseInt(page) || 1,
      limit: parseInt(10) || 10,
    };

    const tournaments = await Tournament.find(query)
      .limit(options.limit)
      .skip(options.limit * (options.page - 1));

    res.json(tournaments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

// Get a single tournament by ID
const getTournamentById = async (req, res) => {
  res.setHeader('Access-Control-Allow-Credentials', true)
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:5173')
  // another common pattern
  // res.setHeader('Access-Control-Allow-Origin', req.headers.origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  )
  const { id } = req.params;


  const tournament = await Tournament.findById(id);
  if (!tournament) {
    return res.status(404).json({ error: 'No such tournament' });
  }


  res.status(200).json(tournament);
};


// Update a tournament
const updateTournament = async (req, res) => {
  res.setHeader('Access-Control-Allow-Credentials', true)
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:5173')
  // another common pattern
  // res.setHeader('Access-Control-Allow-Origin', req.headers.origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  )
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
  res.setHeader('Access-Control-Allow-Credentials', true)
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:5173')
  // another common pattern
  // res.setHeader('Access-Control-Allow-Origin', req.headers.origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  )
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
  res.setHeader('Access-Control-Allow-Credentials', true)
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:5173')
  // another common pattern
  // res.setHeader('Access-Control-Allow-Origin', req.headers.origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  )

  // await createTournaments()


  // delete all tournaments
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


  // create new tournament
  // await newTournament.save()
  //   .then(savedTournament => {
  //     console.log('Tournament saved successfully:', savedTournament);
  //   })
  //   .catch(error => {
  //     console.error('Error saving tournament:', error);
  //   });

  // print all tournaments
  // Tournament.find({}).exec()
  //   .then(tournaments => {
  //     tournaments.forEach(tournament => {
  //       console.log(tournament);
  //       console.log("Type of id: ", typeof (tournament._id))
  //     });
  //   })
  //   .catch(error => {
  //     console.error('Error fetching tournaments:', error);
  //   });


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
          return { username: user.username }; // Assuming 'username' is the field in the user document containing the username
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
        console.log("Applied user: " + appliedUser)
        console.log("User UUID: " + userUUID)
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

      try {
        const applications = tournament.applications
        for (let i = 0; i < applications.length; i++) {
          const teamUUID = applications[i].UUID
          const team = await Team.findOne({ _id: teamUUID })
          if (team.members.map(member => member).includes(userUUID)) {
            return true
          }
        }
        return false
      } catch (error) {
        return false
      }
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
        const teamUUID = acceptedTeams[i]
        const team = await Team.findOne({ _id: teamUUID })
        console.log("Team: " + team.leader)
        console.log("User UUID: " + userUUID)
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
      for (let i = 0; i < enrolledTeams.length; i++) {
        const team = enrolledTeams[i]
        if ((team.players.map(player => player.UUID)).includes(userUUID)) {
          return true
        }
      }
      return false
    }
    const isJoinedSolo = await checkIsJoinedSolo()
    const isJoinedTeam = await checkIsJoinedTeam()
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
      isJoined: isJoined,
      matches: tournament.matches
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
}


const handleApplicationSubmission = async (req, res) => {
  res.setHeader('Access-Control-Allow-Credentials', true)
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:5173')
  // another common pattern
  // res.setHeader('Access-Control-Allow-Origin', req.headers.origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  )


  console.log('Handling application submission')


  const tournament = await Tournament.findById(req.body.tournament);
  if (!tournament) {
    return res.status(404).json({ error: 'No such tournament' });
  }


  // find team by name (name is unique but its not the id. the UUID is unique so treat name like any other attribute)
  const team = await Team.findOne({ name: req.body.team });

  if (team) {
    if (team.members.length != tournament.teamSize) {
      console.log(team.members, tournament.teamSize)
      return res.status(400).json({ error: 'Your chosen team must have exactly ' + tournament.teamSize + ' members.' })
    }
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
    if (dbApplicationArray[i] != userApplicationArray[i].label) {
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

  if (team) {
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
  }
  else {
    function isUserEnrolled(userUUID) {
      const userExists = tournament.enrolledUsers.some(participant => participant.UUID === userUUID);
      return userExists;
    }
    if (isUserEnrolled(userUUID)) {
      return res.status(404).json({ error: 'You are already enrolled in this tournament.' })
    }
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
  res.setHeader('Access-Control-Allow-Credentials', true)
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:5173')
  // another common pattern
  // res.setHeader('Access-Control-Allow-Origin', req.headers.origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  )
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
  if ((tournament.enrolledUsers.map(user => user.UUID)).includes(req.user)) {
    return res.status(404).json({ error: 'Invalid request' })
  }

  // user must not be host
  if (tournament.host == req.user) {
    return res.status(404).json({ error: 'Invalid request' })
  }

  // user must have enough credits to pay the entry fee
  const user = await User.findOne({ _id: req.user });
  if (user.credits < tournament.entryFee) {
    return res.status(404).json({ error: 'Not enough credits' })
  }

  // deduct entry fee from user's credits
  await User.updateOne({ _id: req.user }, { $inc: { credits: -tournament.entryFee } })

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
  res.setHeader('Access-Control-Allow-Credentials', true)
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:5173')
  // another common pattern
  // res.setHeader('Access-Control-Allow-Origin', req.headers.origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  )
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

  // team members must have enough credits to pay the entry fee
  for (let member of team.members) {
    const user = await User.findOne({ _id: member });
    if (user.credits < tournament.entryFee) {
      return res.status(404).json({ error: 'Not enough credits' })
    }
  }

  // deduct credits from team members
  for (let member of team.members) {
    await User.updateOne({ _id: member }, { $inc: { credits: -tournament.entryFee } })
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
  res.setHeader('Access-Control-Allow-Credentials', true)
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:5173')
  // another common pattern
  // res.setHeader('Access-Control-Allow-Origin', req.headers.origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  )
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
  res.setHeader('Access-Control-Allow-Credentials', true)
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:5173')
  // another common pattern
  // res.setHeader('Access-Control-Allow-Origin', req.headers.origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  )
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
  res.setHeader('Access-Control-Allow-Credentials', true)
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:5173')
  // another common pattern
  // res.setHeader('Access-Control-Allow-Origin', req.headers.origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  )
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
  res.setHeader('Access-Control-Allow-Credentials', true)
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:5173')
  // another common pattern
  // res.setHeader('Access-Control-Allow-Origin', req.headers.origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  )
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
  res.setHeader('Access-Control-Allow-Credentials', true)
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:5173')
  // another common pattern
  // res.setHeader('Access-Control-Allow-Origin', req.headers.origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  )

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
            // If no team information found for the provided UUID, add username
            const user = await User.findOne({ _id: application.UUID });
            const result = {
              UUID: application.UUID,
              username: user.username,
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

    const transformedApps = await getTeamNameAndApplications(tournament.applications)

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
          return { username: user.username }; // Assuming 'username' is the field in the user document containing the username
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
      applications: transformedApps,
      matches: tournament.matches
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
images.set('rainbow six: siege', 'https://img.redbull.com/images/c_fill,g_auto,w_450,h_600/q_auto:low,f_auto/redbullcom/2019/02/14/5455aa48-c5fb-48e5-9d54-3d848c7c32a2/rainbow-six-sieges-operators-add-complexity-to-the-strategising')
images.set('pubg', 'https://img.redbull.com/images/c_crop,x_502,y_0,h_1080,w_864/c_fill,w_450,h_600/q_auto:low,f_auto/redbullcom/2017/08/22/c54ac74a-74b5-43b5-9352-5041fdc50766/pubg-title.jpg.jpg')
images.set('apex legends', 'https://upload.wikimedia.org/wikipedia/en/d/db/Apex_legends_cover.jpg')
images.set('call of duty: warzone', 'https://m.media-amazon.com/images/M/MV5BZWYxY2VmN2ItNjNlNi00ZmM0LWEwMjEtMTE1NGQxMGVhMWQxXkEyXkFqcGdeQXVyMTk2OTAzNTI@._V1_.jpg')
images.set('dota 2', 'https://m.media-amazon.com/images/M/MV5BZDQxMjVmMjYtZTU4OC00MzRhLTljNTgtMTAwMDg3YzhlY2M4L2ltYWdlL2ltYWdlXkEyXkFqcGdeQXVyNTAyODkwOQ@@._V1_.jpg')
images.set('volleyball', 'https://cdn.britannica.com/81/198481-050-10CED2D9/Gilberto-Godoy-Filho-ball-Brazil-Argentina-volleyball-2007.jpg')


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
    image: images.get(tournament.category.toLowerCase())
  }));

  return formattedTournaments;
};

const getTrendingTournaments = async (req, res) => {
  res.setHeader('Access-Control-Allow-Credentials', true)
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:5173')
  // another common pattern
  // res.setHeader('Access-Control-Allow-Origin', req.headers.origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  )
  const tournaments = await Tournament.find({})
  const RandomTournaments = getRandomTournaments(tournaments)
  return res.json(RandomTournaments)
}

const getMyTournaments = async (req, res) => {
  res.setHeader('Access-Control-Allow-Credentials', true)
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:5173')
  // another common pattern
  // res.setHeader('Access-Control-Allow-Origin', req.headers.origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  )
  // find tournaments where user is either the host or a participant
  const selectedTournaments = await Tournament.find({
    $or: [
      { host: req.user },
      { "enrolledUsers.UUID": req.user },
      { "enrolledTeams.players.UUID": req.user }]
  });

  const formattedTournaments = selectedTournaments.map(tournament => ({
    UUID: tournament.UUID,
    title: tournament.title,
    description: tournament.description,
    image: images.get(tournament.category.toLowerCase())
  }));

  return res.json(formattedTournaments)
}

const getTournamentCategories = async (req, res) => {
  const categories = ["Fortnite", "Counter Strike", "Tennis", "League of Legends", "Football", "Basketball", "Valorant", "Rainbow Six: Siege", "PUBG", "Apex Legends", "Call of Duty: Warzone", "Dota 2", "Volleyball"]
  return res.json(categories)
}

const getTournamentCategoriesWithImages = async (req, res) => {
  const categories = ["Fortnite", "Counter Strike", "Tennis", "League of Legends", "Football", "Basketball", "Valorant", "Rainbow Six: Siege", "PUBG", "Apex Legends", "Call of Duty: Warzone", "Dota 2", "Volleyball"]
  const formattedCategories = categories.map(category => ({
    name: category,
    image: images.get(category.toLowerCase())
  }));
  return res.json(formattedCategories)
}

const updateScores = async (req, res) => {
  res.setHeader('Access-Control-Allow-Credentials', true)
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:5173')
  // another common pattern
  // res.setHeader('Access-Control-Allow-Origin', req.headers.origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  )
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
  res.setHeader('Access-Control-Allow-Credentials', true)
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:5173')
  // another common pattern
  // res.setHeader('Access-Control-Allow-Origin', req.headers.origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  )
  const { tournamentUUID, applicationUUID } = req.body;

  const tournament = await Tournament.findOne({ UUID: tournamentUUID });
  if (!tournament) {
    return res.status(404).send('Tournament not found');
  }

  // console.log('tournament:', tournament)

  // check if user is host
  if (tournament.host != req.user) {
    return res.status(401).send('Unauthorized');
  }

  const application = tournament.applications.find(app => app.UUID === applicationUUID);
  // console.log('application:', application)
  if (!application) {
    return res.status(404).send('Application not found');
  }

  // add team to acceptedTeams
  const team = await Team.findOne({ _id: application.UUID });
  if (team) {
    // console.log('pushed team uuid to acceptedTeams')
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
  res.setHeader('Access-Control-Allow-Credentials', true)
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:5173')
  // another common pattern
  // res.setHeader('Access-Control-Allow-Origin', req.headers.origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  )
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
  res.setHeader('Access-Control-Allow-Credentials', true)
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:5173')
  // another common pattern
  // res.setHeader('Access-Control-Allow-Origin', req.headers.origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  )
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
  res.setHeader('Access-Control-Allow-Credentials', true)
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:5173')
  // another common pattern
  // res.setHeader('Access-Control-Allow-Origin', req.headers.origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  )
  const { UUID, participants } = req.body;

  const tournament = await Tournament.findOne({ _id: UUID });
  if (!tournament) {
    return res.status(404).send('Tournament not found');
  }

  // check if user is host
  if (tournament.host != req.user) {
    return res.status(401).send('Unauthorized');
  }

  // ensure tournament has started
  // if (!tournament.hasStarted) {
  //   return res.status(400).send('Tournament has not started');
  // }

  // ensure tournament is solo based
  // if (tournament.teamSize != 1) {
  //   return res.status(400).send('Tournament is not solo based');
  // }

  try {
    // Create an array of update operations for each participant
    const updateOperations = participants.map(participantData => ({
      updateOne: {
        filter: { _id: UUID, "enrolledUsers.UUID": participantData.UUID },
        update: {
          $set: {
            "enrolledUsers.$.score": participantData.score,
            "enrolledUsers.$.eliminated": participantData.eliminated
          }
        }
      }
    }));

    // Execute all update operations in bulk
    const result = await Tournament.bulkWrite(updateOperations);

    console.log(result)

    console.log(`${result.modifiedCount} participants in tournament '${UUID}' updated successfully.`);
  } catch (error) {
    console.error(`Error updating participants in tournament '${UUID}':`, error);
  }

  res.status(200).send('Participants updated');
}

const editTeamParticipants = async (req, res) => {
  res.setHeader('Access-Control-Allow-Credentials', true)
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:5173')
  // another common pattern
  // res.setHeader('Access-Control-Allow-Origin', req.headers.origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  )
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

const editMatches = async (req, res) => {
  res.setHeader('Access-Control-Allow-Credentials', true)
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:5173')
  // another common pattern
  // res.setHeader('Access-Control-Allow-Origin', req.headers.origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  )
  const { UUID, matches } = req.body;

  const tournament = await Tournament.findOne({ _id: UUID });
  if (!tournament) {
    return res.status(404).send('Tournament not found');
  }

  // check if user is host
  if (tournament.host != req.user) {
    return res.status(401).send('Unauthorized');
  }

  // ensure it is a brackets tournament
  if (tournament.type != 'brackets') {
    return res.status(400).send('Tournament is not brackets based');
  }

  // ensure winners are part of the tournament
  if (tournament.teamSize == 1) {
    for (let participant of matches) {

      const user = await User.findOne({ username: participant });

      if (!user) return res.status(404).json({ error: 'Match winners must be part of the tournament.' });

    }
  }

  // ensure winners are part of the tournament
  if (tournament.teamSize > 1) {
    for (let participant of matches) {

      const team = await Team.findOne({ name: participant });

      if (!team) return res.status(404).json({ error: 'Match winners must be part of the tournament.' });

    }
  }

  // ensure tournament has started
  if (!tournament.hasStarted) {
    return res.status(400).send('Tournament has not started');
  }

  // ensure its brackets tournament
  if (tournament.type != 'brackets') {
    return res.status(400).send('Tournament is not brackets based');
  }

  try {
    tournament.matches = matches
    await tournament.save()
  } catch (error) {
    console.error(`Error updating matches in tournament '${UUID}':`, error);
  }

  res.status(200).send('Matches updated');
}

const startTournament = async (req, res) => {
  res.setHeader('Access-Control-Allow-Credentials', true)
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:5173')
  // another common pattern
  // res.setHeader('Access-Control-Allow-Origin', req.headers.origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  )
  const { UUID } = req.body;

  const tournament = await Tournament.findOne({ _id: UUID });
  if (!tournament) {
    return res.status(404).json({ error: 'Tournament not found' });
  }

  // check if user is host
  if (tournament.host != req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // ensure tournament hasnt started
  if (tournament.hasStarted) {
    return res.status(400).json({ error: 'Tournament has already started' });
  }

  // ensure tournament hasnt ended
  if (tournament.hasEnded) {
    return res.status(400).json({ error: 'Tournament has already ended' });
  }

  // ensure startDate has passed
  if (tournament.startDate > new Date()) {
    return res.status(400).json({ error: 'Expected tournament start date has not yet been reached.' });
  }

  // ensure tournament has enough participants
  if (tournament.enrolledUsers?.length == tournament.maxCapacity || tournament.enrolledTeams?.length == tournament.maxCapacity) {
    return res.status(400).json({ error: 'Not enough participants' });
  }

  // start tournament
  tournament.hasStarted = true;
  await tournament.save();

  res.status(200).json({ message: 'Tournament started' });
}

const endTournament = async (req, res) => {
  res.setHeader('Access-Control-Allow-Credentials', true)
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:5173')
  // another common pattern
  // res.setHeader('Access-Control-Allow-Origin', req.headers.origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  )
  const { UUID } = req.body;

  const tournament = await Tournament.findOne({ _id: UUID });
  if (!tournament) {
    return res.status(404).json({ error: 'Tournament not found' });
  }

  // check if user is host
  if (tournament.host != req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // ensure tournament has started
  if (!tournament.hasStarted) {
    return res.status(400).json({ error: 'Tournament has not started' });
  }

  // ensure tournament hasnt ended
  if (tournament.hasEnded) {
    return res.status(400).json({ error: 'Tournament has already ended' });
  }

  // ensure endDate has passed
  if (tournament.endDate > new Date()) {
    return res.status(400).json({ error: 'Expected tournament end date has not yet been reached.' });
  }

  // give out earnings if solo bracket tournament
  if (tournament.earnings && tournament.type == 'brackets' && tournament.teamSize == 1) {
    const earnings = tournament.earnings;
    const winnerUsername = tournament.matches[tournament.matches.length - 1];

    // get user from username
    const winner = await User.findOne({ username: winnerUsername });

    // give earnings to winner
    winner.credits += earnings;
    await winner.save();
  }

  // give out earnings if team bracket tournament
  if (tournament.earnings && tournament.type == 'brackets' && tournament.teamSize > 1) {
    const earnings = tournament.earnings;
    const winnerTeamName = tournament.matches[tournament.matches.length - 1];

    // get team from teamName
    const winner = await Team.findOne({ name: winnerTeamName });

    // divide earnings among team members
    const earningsPerMember = earnings / winner.members.length;
    for (let member of winner.members) {
      const user = await User.findOne({ _id: member });
      user.credits += earningsPerMember;
      await user.save();
    }
  }

  // give out earnings if solo battle royale tournament
  if (tournament.earnings && tournament.type == 'battle royale' && tournament.teamSize == 1) {
    const earnings = tournament.earnings;
    const usersSortedByScore = tournament.enrolledUsers.sort((a, b) => b.score - a.score);

    earnings.forEach(async (earning, i) => {
      const user = await User.findOne({ _id: usersSortedByScore[i].UUID });
      user.credits += earning;
      await user.save();
    });
  }

  // give out earnings if team battle royale tournament
  if (tournament.earnings && tournament.type == 'battle royale' && tournament.teamSize > 1) {
    const earnings = tournament.earnings;
    const teamsSortedByScore = tournament.enrolledTeams.sort((a, b) => b.score - a.score);

    earnings.forEach(async (earning, i) => {
      const team = await Team.findOne({ _id: teamsSortedByScore[i].UUID });

      // divide earnings among team members
      const earningsPerMember = earning / team.members.length;
      for (let member of team.members) {
        const user = await User.findOne({ _id: member });
        user.credits += earningsPerMember;
        await user.save();
      }
    });
  }

  // end tournament
  tournament.hasEnded = true;
  await tournament.save();

  res.status(200).json({ message: 'Tournament ended' });
}

module.exports = {
  createTournament,
  getTournamentById,
  getAllTournaments,
  getPaginatedTournaments,
  getFilteredTournaments,
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
  getMyTournaments,
  getTournamentCategories,
  getTournamentCategoriesWithImages,
  updateScores,
  acceptApplication,
  rejectApplication,
  postUpdate,
  editSoloParticipants,
  editTeamParticipants,
  editMatches,
  startTournament,
  endTournament
};


