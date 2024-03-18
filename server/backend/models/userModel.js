const mongoose = require('mongoose')
const bcrypt = require('bcrypt')
const validator = require('validator')
const { v4: uuidv4 } = require('uuid');

const Schema = mongoose.Schema

const userSchema = new Schema({
  _id: { type: String, required: true, default: uuidv4 },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    validate: [validator.isEmail, 'Invalid email format']
  },
  userName:{
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true
  },
  password: {
    type: String,
    required: [true, 'Password is required']
  },
})

const isStrongPasswordd = (password) => {
  console.log("test")
  const minLength = 8;
  const hasLowerCase = /[a-z]/;
  const hasUpperCase = /[A-Z]/;
  const hasNumber = /[0-9]/;
  console.log(password.length >= minLength)
  console.log(hasLowerCase.test(password))
  console.log(hasUpperCase.test(password))
  console.log(hasNumber.test(password))
  return (
      password.length >= minLength &&
      hasLowerCase.test(password) &&
      hasUpperCase.test(password) &&
      hasNumber.test(password)
  );
};




// static signup method
userSchema.statics.signup = async function(email, userName ,password) {
  console.log("in database")
  // validation
  if (!email || !password || !userName) {
    console.log("All fields must be filled")
    throw Error('All fields must be filled')
  }
  if (!userName.trim()) {
    console.log("User name must be provided");
    throw Error('User name must be provided');
  }
  if (!validator.isEmail(email)) {
    console.log("Email not valid")
    throw Error('Email not valid')
  }
  if (!isStrongPasswordd(password)) {
    console.log("Password not strong")
    throw Error('Password not strong enough')
  }

  const exists = await this.findOne({ email })

  if (exists) {
    throw Error('Email already in use')
  }

  const salt = await bcrypt.genSalt(10)
  const hash = await bcrypt.hash(password, salt)
  console.log("bcrypted")
  const user = await this.create({ _id: uuidv4(), email, userName, password: hash });
  console.log("created")
  return user
}

// static login method
userSchema.statics.login = async function(email, password) {

  if (!email || !password) {
    console.log("All fields must be filled")
    throw Error('All fields must be filled')
  }

  const user = await this.findOne({ email })
  if (!user) {
    console.log("incorret email")
    throw Error('Incorrect email')
  }
  console.log("email checked")
  console.log(user.password)
  const match = await bcrypt.compare(password, user.password)
  console.log("match done")
  if (!match) {
    console.log("incorrect password")
    throw Error('Incorrect password')
  }

  return user
}

module.exports = mongoose.model('User', userSchema)

