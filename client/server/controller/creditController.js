const e = require("express");
const Credit = require("../models/creditModels"); // Path to your Credit model
const User = require("../models/userModel"); // Path to your User model
const { default: mongoose, ObjectID } = require("mongoose");

const getCredits = async (req, res) => {
  res.setHeader('Access-Control-Allow-Credentials', true)
  res.setHeader('Access-Control-Allow-Origin', 'https://tourneyhost.online')
  // another common pattern
  // res.setHeader('Access-Control-Allow-Origin', req.headers.origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  )
  try {
    const credits = await Credit.find();
    res.status(200).json(credits);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getTotalCredits = async (req, res) => {
  res.setHeader('Access-Control-Allow-Credentials', true)
  res.setHeader('Access-Control-Allow-Origin', 'https://tourneyhost.online')
  // another common pattern
  // res.setHeader('Access-Control-Allow-Origin', req.headers.origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  )
  try {
    const userId = req.user; // Assuming you're using auth middleware to get user ID
    const user = await User.findById(userId);
    res.status(200).json({ credits: user.credits });
  } catch (error) {
    console.error('Error getting total credits:', error);
    res.status(500).json({ message: 'Error getting total credits' });
  }
};

const createCredit = async (req, res) => {
  res.setHeader('Access-Control-Allow-Credentials', true)
  res.setHeader('Access-Control-Allow-Origin', 'https://tourneyhost.online')
  // another common pattern
  // res.setHeader('Access-Control-Allow-Origin', req.headers.origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  )
  const { name, totalCredits, price } = req.body;
  try {
    const credit = await Credit.create({
      name,
      totalCredits,
      price,
      dateCreated: new Date(),
    });
    res.status(201).json(credit);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteCredit = async (req, res) => {
  res.setHeader('Access-Control-Allow-Credentials', true)
  res.setHeader('Access-Control-Allow-Origin', 'https://tourneyhost.online')
  // another common pattern
  // res.setHeader('Access-Control-Allow-Origin', req.headers.origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  )
  try {
    const credit = await Credit.findOne({ _id: req.params.id });
    await credit.remove();
    res.status(200).json({ message: "Credit deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const purchaseCredit = async (req, res) => {
  res.setHeader('Access-Control-Allow-Credentials', true)
  res.setHeader('Access-Control-Allow-Origin', 'https://tourneyhost.online')
  // another common pattern
  // res.setHeader('Access-Control-Allow-Origin', req.headers.origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  )
  try {
    const { userId, creditPackageId } = req.body;
    console.log(userId, "userId");
    console.log(creditPackageId, "creditId");

    const user = await User.findById(userId);
    if (user == null) {
      user = await User.findOne({ _id: ObjectID(userId) });
    }
    const creditPackage = await Credit.findById(creditPackageId);

    // Update user's credit balance
    user.credits += creditPackage.totalCredits;
    await user.save();

    res.status(200).json({ message: "Credit purchase successful!" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error processing purchase" });
  }
};

module.exports = {
  getCredits,
  getTotalCredits,
  createCredit,
  deleteCredit,
  purchaseCredit,
};
