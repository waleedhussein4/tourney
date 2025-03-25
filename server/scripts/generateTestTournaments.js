const Tournament = require('../models/tourneyModels');
const User = require('../models/userModel');
const { v4: uuidv4 } = require('uuid');

// CREATE TEST TOURNAMENTS
async function createTournaments() {
  // GET ALL NON-ADMIN USERS FROM DB
  const users = await User.find({ role: { $ne: "admin" } })
    .then(result => {
      return result;
    })
    .catch(error => {
      console.error('Error getting users:', error);
    });

  if (!users || users.length < 12) {
    console.error('Not enough users found. Please create users first.');
    return;
  }

  // GENERATE TEST TEAMS BASED ON users TO BE USED IN TOURNAMENT CREATION
  const teams = [
    {
      teamName: "Alpha Squad",
      players: [
        { UUID: users[0]._id },
        { UUID: users[1]._id },
        { UUID: users[2]._id }
      ]
    },
    {
      teamName: "Beta Force",
      players: [
        { UUID: users[3]._id },
        { UUID: users[4]._id },
        { UUID: users[5]._id }
      ]
    },
    {
      teamName: "Delta Strikers",
      players: [
        { UUID: users[6]._id },
        { UUID: users[7]._id },
        { UUID: users[8]._id }
      ]
    },
    {
      teamName: "Gamma Warriors",
      players: [
        { UUID: users[9]._id },
        { UUID: users[10]._id },
        { UUID: users[11]._id }
      ]
    }
  ];

  // LIST OF ALL 10 TOURNAMENTS
  const tournaments = [
    {
      host: "363e752a-0dc2-4282-b2ae-905e7cbfdfed", // Original host UUID
      UUID: "f5d8c742-a9b1-4e2b-8f7c-3d2e6a8b9c0d",
      title: "Fortnite Battle Royale Cup",
      type: "battle royale",
      category: "Fortnite",
      startDate: new Date("2024-06-15T14:00:00.000Z"),
      endDate: new Date("2024-06-16T18:00:00.000Z"),
      entryFee: 10,
      earnings: [ {rank: 1, prize: 1000}, {rank: 2, prize: 500}, {rank: 3, prize: 250}, {rank: 4, prize: 100}, {rank: 5, prize: 50}, {rank: 6, prize: 25}, {rank: 7, prize: 10}, {rank: 8, prize: 5} ],
      maxCapacity: 12,
      accessibility: "open",
      description: "The ultimate Fortnite battle royale tournament where players fight to be the last one standing!",
      teamSize: 1,
      application: [],
      rules: "Standard Fortnite battle royale rules apply. No teaming allowed.",
      contactInfo: {
        email: "support@fortnitecup.com",
        phone: "+1-555-123-4567",
        socialMedia: {
          discord: "discord.gg/fortnitecup",
          instagram: "@fortnitecup",
          twitter: "@fortnitecup",
          facebook: "facebook.com/fortnitecup"
        }
      },
      // All 12 users enrolled
      enrolledUsers: users.map(user => ({ 
        UUID: user._id, 
        score: Math.floor(Math.random() * 100), 
        eliminated: false 
      })),
    },
    {
      host: "363e752a-0dc2-4282-b2ae-905e7cbfdfed", // Original host UUID
      UUID: "a1b2c3d4-e5f6-7g8h-9i0j-k1l2m3n4o5p6",
      title: "Counter Strike Championship",
      type: "brackets",
      category: "Counter Strike",
      startDate: new Date("2024-07-01T12:00:00.000Z"),
      endDate: new Date("2024-07-03T20:00:00.000Z"),
      entryFee: 20,
      earnings: 2000,
      maxCapacity: 12,
      accessibility: "application required",
      description: "Elite Counter Strike tournament for the best teams in the region.",
      teamSize: 3,
      application: ["Team Name", "Player Ranks", "Previous Tournament Experience"],
      rules: "Standard CS:GO competitive ruleset. Best of 3 matches in finals.",
      contactInfo: {
        email: "info@cschampionship.com",
        socialMedia: {
          discord: "discord.gg/cschamp"
        }
      },
      // All 4 teams enrolled
      enrolledTeams: teams.map(team => ({
        teamName: team.teamName,
        players: team.players,
        score: Math.floor(Math.random() * 100),
        eliminated: false
      }))
    },
    {
      host: "363e752a-0dc2-4282-b2ae-905e7cbfdfed", // Original host UUID
      UUID: "b2c3d4e5-f6g7-h8i9-j0k1-l2m3n4o5p6q7",
      title: "Tennis Open Singles",
      type: "brackets",
      category: "Tennis",
      startDate: new Date("2024-08-10T08:00:00.000Z"),
      endDate: new Date("2024-08-14T18:00:00.000Z"),
      entryFee: 50,
      earnings: 5000,
      maxCapacity: 8, // Changed to 8 (power of 2)
      accessibility: "open",
      description: "Premier tennis tournament for singles players.",
      teamSize: 1,
      application: [],
      rules: "ITF tennis rules. Match format: best of 3 sets.",
      contactInfo: {
        email: "contact@tennisopen.com",
        phone: "+1-555-987-6543"
      },
      // 8 users enrolled (power of 2)
      enrolledUsers: users.slice(0, 8).map(user => ({ 
        UUID: user._id, 
        score: Math.floor(Math.random() * 100), 
        eliminated: false 
      })),
    },
    {
      host: "363e752a-0dc2-4282-b2ae-905e7cbfdfed", // Original host UUID
      UUID: "c3d4e5f6-g7h8-i9j0-k1l2-m3n4o5p6q7r8",
      title: "League of Legends Pro Series",
      type: "brackets",
      category: "League of Legends",
      startDate: new Date("2024-09-05T16:00:00.000Z"),
      endDate: new Date("2024-09-07T22:00:00.000Z"),
      entryFee: 15,
      earnings: 3000,
      maxCapacity: 12,
      accessibility: "application required",
      description: "Competitive LoL tournament for amateur and semi-pro teams.",
      teamSize: 3,
      application: ["Team Name", "Average Rank", "Team History"],
      rules: "Standard Summoner's Rift 5v5 tournament draft. Single elimination.",
      contactInfo: {
        email: "tournaments@lolproseries.com",
        socialMedia: {
          discord: "discord.gg/lolpro",
          twitter: "@LOLProSeries"
        }
      },
      // Just use our 4 teams - with no user duplication
      enrolledTeams: teams.map(team => ({
        teamName: team.teamName,
        players: team.players,
        score: Math.floor(Math.random() * 100),
        eliminated: false
      }))
    },
    {
      host: "363e752a-0dc2-4282-b2ae-905e7cbfdfed", // Original host UUID
      UUID: "d4e5f6g7-h8i9-j0k1-l2m3-n4o5p6q7r8s9",
      title: "Football 5-a-side Cup",
      type: "battle royale",
      category: "Football",
      startDate: new Date("2024-07-15T09:00:00.000Z"),
      endDate: new Date("2024-07-15T17:00:00.000Z"),
      entryFee: 100,
      earnings: [ {rank: 1, prize: 2000}, {rank: 2, prize: 1000}, {rank: 3, prize: 500}, {rank: 4, prize: 250}, {rank: 5, prize: 100}, {rank: 6, prize: 50}, {rank: 7, prize: 25}, {rank: 8, prize: 10} ],
      maxCapacity: 12,
      accessibility: "open",
      description: "One-day football tournament for players.",
      teamSize: 1,
      application: [],
      rules: "Standard 5-a-side football rules. 15-minute matches.",
      contactInfo: {
        email: "info@footballcup.com",
        phone: "+1-555-456-7890"
      },
      // All 12 users enrolled
      enrolledUsers: users.map(user => ({ 
        UUID: user._id, 
        score: Math.floor(Math.random() * 100), 
        eliminated: false 
      })),
    },
    {
      host: "363e752a-0dc2-4282-b2ae-905e7cbfdfed", // Original host UUID
      UUID: "e5f6g7h8-i9j0-k1l2-m3n4-o5p6q7r8s9t0",
      title: "Basketball Street Tournament",
      type: "brackets",
      category: "Basketball",
      startDate: new Date("2024-06-25T15:00:00.000Z"),
      endDate: new Date("2024-06-26T19:00:00.000Z"),
      entryFee: 25,
      earnings: 1000,
      maxCapacity: 12,
      accessibility: "open",
      description: "Street basketball tournament for 3v3 teams.",
      teamSize: 3,
      application: [],
      rules: "3v3 half-court games. First to 21 points or 15 minutes.",
      contactInfo: {
        email: "streetball@basketballtourney.com",
        socialMedia: {
          instagram: "@streetballtourney"
        }
      },
      // Only the first 3 teams to avoid player duplication
      enrolledTeams: teams.slice(0, 2).map(team => ({
        teamName: team.teamName,
        players: team.players,
        score: Math.floor(Math.random() * 100),
        eliminated: false
      }))
    },
    {
      host: "363e752a-0dc2-4282-b2ae-905e7cbfdfed", // Original host UUID 
      UUID: "f6g7h8i9-j0k1-l2m3-n4o5-p6q7r8s9t0u1",
      title: "Valorant Champions Tour",
      type: "brackets",
      category: "Valorant",
      startDate: new Date("2024-08-20T14:00:00.000Z"),
      endDate: new Date("2024-08-22T20:00:00.000Z"),
      entryFee: 30,
      earnings: 4000,
      maxCapacity: 16, // Changed to 16 (power of 2)
      accessibility: "application required",
      description: "Premier Valorant tournament featuring the best players.",
      teamSize: 1,
      application: ["Rank", "Previous Tournament Results"],
      rules: "Standard Valorant competitive ruleset. Best of 3 matches.",
      contactInfo: {
        email: "valoranttour@games.com",
        socialMedia: {
          discord: "discord.gg/valoranttour",
          twitter: "@ValorantTour"
        }
      },
      // 8 users enrolled - power of 2
      enrolledUsers: users.slice(4, 12).map(user => ({ 
        UUID: user._id, 
        score: Math.floor(Math.random() * 100), 
        eliminated: false 
      })),
    },
    {
      host: "363e752a-0dc2-4282-b2ae-905e7cbfdfed", // Original host UUID
      UUID: "g7h8i9j0-k1l2-m3n4-o5p6-q7r8s9t0u1v2",
      title: "Rainbow Six Siege League",
      type: "battle royale",
      category: "Rainbow Six: Siege",
      startDate: new Date("2024-09-15T17:00:00.000Z"),
      endDate: new Date("2024-09-17T23:00:00.000Z"),
      entryFee: 40,
      earnings: [ {rank: 1, prize: 3000}, {rank: 2, prize: 1500}, {rank: 3, prize: 750}, {rank: 4, prize: 300}, {rank: 5, prize: 150}, {rank: 6, prize: 75}, {rank: 7, prize: 30}, {rank: 8, prize: 15} ],
      maxCapacity: 12,
      accessibility: "open",
      description: "Competitive Rainbow Six Siege tournament for teams of 3.",
      teamSize: 3,
      application: [],
      rules: "Standard R6S competitive ruleset. Maps determined by tournament organizers.",
      contactInfo: {
        email: "siege@r6league.com",
        socialMedia: {
          discord: "discord.gg/r6sleague"
        }
      },
      // Only enrolling the last 2 teams to avoid player duplication
      enrolledTeams: teams.slice(2, 4).map(team => ({
        teamName: team.teamName,
        players: team.players,
        score: Math.floor(Math.random() * 100),
        eliminated: false
      }))
    },
    {
      host: "363e752a-0dc2-4282-b2ae-905e7cbfdfed", // Original host UUID
      UUID: "h8i9j0k1-l2m3-n4o5-p6q7-r8s9t0u1v2w3",
      title: "PUBG Mobile Showdown",
      type: "battle royale",
      category: "PUBG",
      startDate: new Date("2024-07-10T13:00:00.000Z"),
      endDate: new Date("2024-07-11T19:00:00.000Z"),
      entryFee: 5,
      earnings: [ {rank: 1, prize: 500}, {rank: 2, prize: 250}, {rank: 3, prize: 100}, {rank: 4, prize: 50}, {rank: 5, prize: 25}, {rank: 6, prize: 10}, {rank: 7, prize: 5} ],
      maxCapacity: 12,
      accessibility: "open",
      description: "Mobile PUBG tournament for trios.",
      teamSize: 3,
      application: [],
      rules: "Standard PUBG Mobile rules. Custom rooms. 5 matches total.",
      contactInfo: {
        email: "pubgmobile@tourneys.com",
        socialMedia: {
          discord: "discord.gg/pubgmobile",
          twitter: "@PUBGMobileTourney"
        }
      },
      // Using teams 1 and 3 to avoid player duplication
      enrolledTeams: [teams[0], teams[2]].map(team => ({
        teamName: team.teamName,
        players: team.players,
        score: Math.floor(Math.random() * 100),
        eliminated: false
      }))
    },
    {
      host: "363e752a-0dc2-4282-b2ae-905e7cbfdfed", // Original host UUID
      UUID: "i9j0k1l2-m3n4-o5p6-q7r8-s9t0u1v2w3x4",
      title: "Apex Legends Trophy",
      type: "battle royale",
      category: "Apex Legends",
      startDate: new Date("2024-08-05T15:00:00.000Z"),
      endDate: new Date("2024-08-06T21:00:00.000Z"),
      entryFee: 15,
      earnings: [ {rank: 1, prize: 100}, {rank: 2, prize: 50}, {rank: 3, prize: 30} ],
      maxCapacity: 12,
      accessibility: "open",
      description: "Apex Legends tournament for individual players. Points based on placement and kills.",
      teamSize: 1,
      application: [],
      rules: "Standard Apex Legends rules. 6 matches total. Points for placement and eliminations.",
      contactInfo: {
        email: "apex@legendstrophy.com",
        socialMedia: {
          discord: "discord.gg/apextrophy",
          twitter: "@ApexTrophy"
        }
      },
      // All 12 users enrolled
      enrolledUsers: users.map(user => ({ 
        UUID: user._id, 
        score: Math.floor(Math.random() * 100), 
        eliminated: false 
      })),
    }
  ];

  //save the tournaments and assign random uuid using uuidv4()
  for (const tournament of tournaments) {
    tournament._id = tournament.UUID;
    await Tournament.create(tournament)
      .then(result => {
        console.log(`Tournament created: ${result.title}`);
      })
      .catch(error => {
        console.error(`Error creating tournament ${tournament.title}: ${error.message}`);
      });
  }
}

// DELETE ALL TOURNAMENTS
async function deleteAllTournaments() {
  await Tournament.deleteMany({})
    .then(result => {
      console.log(`${result.deletedCount} tournaments deleted successfully.`);
    })
    .catch(error => {
      console.error('Error deleting tournaments:', error);
    });
}

module.exports = { createTournaments, deleteAllTournaments };