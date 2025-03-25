const User = require('../models/userModel');

// list of all sample users
const users = [
  { username: "soumi7", email: "soumi7@gmail.com", password: "Soumi123!" },
  { username: "Ahmad01", email: "ahmad01@gmail.com", password: "Ahmad0001@" },
  { username: "Khalid", email: "khalid@hotmail.com", password: "Khalid#45" },
  { username: "Majed", email: "majed@yahoo.com", password: "Majed678*" },
  { username: "Ahmed", email: "ahmed@gmail.com", password: "Ahmed_90A" },
  { username: "Sara", email: "sara@hotmail.com", password: "Sara123$" },
  { username: "Ali", email: "ali@yahoo.com", password: "Aliii456&" },
  { username: "Omar", email: "omar@gmail.com", password: "Omar789%" },
  { username: "Nour", email: "nour@hotmail.com", password: "Nour321!" },
  { username: "Lina", email: "lina@yahoo.com", password: "Lina654@" },
  { username: "Mona", email: "mona@gmail.com", password: "Mona987#" },
  { username: "Hassan", email: "hassan@hotmail.com", password: "Hassan000*" }
];

// CREATE ALL TEST USERS AND ADD THEM TO THE DATABASE
async function createUsers() {
  for (const user of users) {
    try {
      console.log(`Trying to create user: ${user.username}`);
      const newUser = await User.signup(user.email, user.username, user.password);
      console.log(`User created: ${newUser.username}`);
    } catch (error) {
      console.error(`Error creating user ${user.username}: ${error.message}`);
    }
  }
}

// DELETE ALL USERS THAT DONT HAVE ROLE="ADMIN"
async function deleteUsers() {
  await User.deleteMany({ role: { $ne: "admin" } })
    .then(result => {
      console.log(`${result.deletedCount} users deleted successfully.`);
    })
    .catch(error => {
      console.error('Error deleting users:', error);
    });
}


module.exports = { createUsers, deleteUsers };