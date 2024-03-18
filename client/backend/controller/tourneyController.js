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

module.exports = {
  createTournament,
  getTournamentById,
  getAllTournaments,
  updateTournament,
  deleteTournament
};

  