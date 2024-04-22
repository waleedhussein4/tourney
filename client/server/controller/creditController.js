const e = require("express");
const Credit = require("../models/creditModels"); // Path to your Credit model
const User = require("../models/userModel"); // Path to your User model
const { default: mongoose, ObjectID } = require("mongoose");

const getCredits = async (req, res) => {
  try {
    const credits = await Credit.find();
    res.status(200).json(credits);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createCredit = async (req, res) => {
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
  try {
    const credit = await Credit.findOne({ _id: req.params.id });
    await credit.remove();
    res.status(200).json({ message: "Credit deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const purchaseCredit = async (req, res) => {
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
  createCredit,
  deleteCredit,
  purchaseCredit,
};
