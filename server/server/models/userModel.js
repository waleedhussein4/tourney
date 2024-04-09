const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const validator = require("validator");

const Schema = mongoose.Schema;

const userSchema = new Schema({
  email: {
    type: String,
    required: [true, "Email is required"],
    unique: true,
    validate: [validator.isEmail, "Invalid email format"],
  },
  username: {
    type: String,
    required: [true, "Username is required"],
    unique: true,
    trim: true,
  },
  password: {
    type: String,
    required: [true, "Password is required"],
  },
  role: {
    type: String,
    default: "user",
  },
  tournaments: [
    {
      type: Schema.Types.ObjectId,
      ref: "Tournament",
    },
  ],
  teams: [
    {
      type: Schema.Types.ObjectId,
      ref: "Team",
    },
  ],
  isHost: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
  },
});

const isStrongPasswordd = (password) => {
  console.log("test");
  const minLength = 8;
  const hasLowerCase = /[a-z]/;
  const hasUpperCase = /[A-Z]/;
  const hasNumber = /[0-9]/;
  console.log(password.length >= minLength);
  console.log(hasLowerCase.test(password));
  console.log(hasUpperCase.test(password));
  console.log(hasNumber.test(password));
  return (
    password.length >= minLength &&
    hasLowerCase.test(password) &&
    hasUpperCase.test(password) &&
    hasNumber.test(password)
  );
};

// static signup method
userSchema.statics.signup = async function (email, username, password) {
  console.log("in database");
  // validation
  if (!email || !password || !username) {
    console.log("All fields must be filled");
    throw Error("All fields must be filled");
  }
  if (!username.trim()) {
    console.log("User name must be provided");
    throw Error("User name must be provided");
  }
  if (!validator.isEmail(email)) {
    console.log("Email not valid");
    throw Error("Email not valid");
  }
  if (!isStrongPasswordd(password)) {
    console.log("Password not strong");
    throw Error("Password not strong enough");
  }

  const exists = await this.findOne({ email });

  if (exists) {
    throw Error("Email already in use");
  }

  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(password, salt);
  console.log("bcrypted");
  let user;
  try {
    user = await this.create({
      email,
      username,
      password: hash,
    });
  } catch (error) {
    console.log(error);
  }
  console.log("created");
  console.log(user, "check user created");
  return user;
};

// static login method
userSchema.statics.login = async function (email, password) {
  if (!email || !password) {
    console.log("All fields must be filled");
    throw Error("All fields must be filled");
  }

  const user = await this.findOne({ email });
  if (!user) {
    console.log("incorret email");
    throw Error("Incorrect email");
  }
  console.log("email checked");
  console.log(user.password);
  const match = await bcrypt.compare(password, user.password);
  console.log("match done");
  if (!match) {
    console.log("incorrect password");
    throw Error("Incorrect password");
  }

  return user;
};

module.exports = mongoose.model("User", userSchema);
