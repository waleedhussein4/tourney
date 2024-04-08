// Import necessary modules
const mongoose = require('mongoose');
const User = require('../models/userModel');
const Tournament = require('../models/tourneyModels');
const { v4: uuidv4 } = require('uuid');

// Function to generate a random UUID
const generateUUID = () => {
  return uuidv4();
};

// Function to generate a random gamer tag
const generateGamerTag = async () => {
  const adjectives = ['Swift', 'Epic', 'Savage', 'Ninja', 'Fierce', 'Stealthy', 'Rapid', 'Mystic', 'Shadow', 'Blaze', 'Thunder', 'Frosty', 'Iron', 'Golden', 'Silent', 'Inferno', 'Atomic', 'Cyber', 'Elite', 'Mighty', 'Cosmic', 'Neon', 'Phantom', 'Solar'];
  const nouns = ['Wolf', 'Phoenix', 'Dragon', 'Storm', 'Sword', 'Arrow', 'Hunter', 'Knight', 'Gamer', 'Legend', 'Hero', 'Warrior', 'Sniper', 'Assassin', 'Ninja', 'Master', 'Champion', 'Gladiator', 'Viking', 'Ranger', 'Pirate', 'Cyborg', 'Samurai', 'Sorcerer'];

  let gamerTag = `${adjectives[Math.floor(Math.random() * adjectives.length)]}${nouns[Math.floor(Math.random() * nouns.length)]}`;

  // Check if gamer tag already exists in the database
  const existingUser = await User.findOne({ userName: gamerTag });
  if (existingUser) {
    // Gamer tag already exists, generate a new one
    gamerTag = await generateGamerTag();
  }

  return gamerTag;
};

// Function to generate sample users and add them to the specified tournament
const generateAndAddUsersToTournament = async (tournamentUUID, count) => {

  try {
    const users = [];
    for (let i = 0; i < count; i++) {
      let userName = await generateGamerTag();
      console.log(userName)
      const newUser = await User.create({
        _id: generateUUID(), // Generating random UUID for each user
        email: `${userName}@example.com`,
        userName: userName,
        password: 'password123', // Note: This is just for demonstration, use proper password hashing in real application
      });
      console.log(`User ${newUser.userName} added with UUID: ${newUser._id}`);
      users.push(newUser);
    }

    // Find the tournament and add enrolled users
    const tournament = await Tournament.findOne({ UUID: tournamentUUID });
    if (!tournament) {
      throw new Error('Tournament not found');
    }

    tournament.enrolledUsers.push(...users.map(user => user._id));
    await tournament.save();
    console.log('Enrolled users added to tournament successfully');
  } catch (error) {
    console.error('Error:', error);
  }
};

// Export the function
module.exports = generateAndAddUsersToTournament;
