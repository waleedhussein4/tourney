const Tournament = require('../models/tourneyModels');

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
  accessibility: "open",
  updates: [{
      date: new Date("2024-02-29T10:01:31.474Z"),
      content: "Tournament Started"
    },
    {
      date: new Date("2024-02-29T10:02:10.959Z"),
      content: "First Round Complete"
    }
  ]
});

// Get all tournaments
const getAllTournaments = async (req, res) => {
  const tournaments = await Tournament.find().sort({ createdAt: -1 });
  
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, GET, PUT");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

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
  // Tournament.deleteMany({})
  // .then(result => {
  //   console.log(`${result.deletedCount} tournaments deleted successfully.`);
  // })
  // .catch(error => {
  //   console.error('Error deleting tournaments:', error);
  // });

  // create new tournament
  // newTournament.save()
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
    
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, GET, PUT");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  try {
    const UUID = req.query.UUID;
    if (!UUID) {
      return res.status(400).json({ error: 'UUID parameter is missing' });
    }
    const tournament = await Tournament.findById(UUID);
    if (!tournament) {
      return res.status(404).json({ error: 'Tournament not found' });
    }
    res.status(200).json({
      hasStarted: tournament.hasStarted,
      accessibility: tournament.accessibility,
      title: tournament.title,
      description: tournament.description,
      category: tournament.category,
      type: tournament.type,
      teamSize: tournament.teamSize,
      enrolledUsers: tournament.enrolledUsers,
      maxCapacity: tournament.maxCapacity,
      earnings: tournament.earnings,
      host: tournament.host,
      isAccepted: tournament.isAccepted,
      updates: tournament.updates
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
}

module.exports = {
  createTournament,
  getTournamentById,
  getAllTournaments,
  updateTournament,
  deleteTournament,
  getTournamentDisplayData
};

  