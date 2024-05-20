const asyncHandler = require("express-async-handler");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/user.model");

// @desc register a user
// @route POST /api/auth/register
// @access public
const registerUser = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;
  const availableUser = await User.findOne({ $or: [{ email }, { username }] });
  if (availableUser) {
    res.status(400);
    throw new Error("Email or Username already in use");
  }
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await User.create({
    username,
    email,
    password: hashedPassword,
  });
  if (!user) {
    res.status(400);
    throw new Error("User data invalid");
  }
  res
    .status(201)
    .json({ _id: user.id, username: user.username, email: user.email });
});

// @desc login a user
// @route POST /api/auth/login
// @access public
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (user && (await bcrypt.compare(password, user.password))) {
    jwt.sign(req.body, process.env.ACCESS, (err, token) => {
      if (err) {
        res.status(401);
        throw new Error("Invalid user credentials");
      }
      res.status(200).json({ message: "login successful", token });
    });
  } else {
    res.status(401);
    throw new Error("InValid email and password");
  }
  
});

// @desc get current user
// @route GET /api/auth/current
// @access private
const currentUser = asyncHandler(async (req, res) => {
  if (!req.user) {
    res.status(401);
    throw new Error("UnAuthorized user");
  }
  const user = await User.findById(req.user.id);
  if (!req.user.currentGroup) {
    res.status(404);
    throw new Error("Not found: user not in any group");
  }
  res.status(200).json(user);
});

// @desc log out the user
// @route GET /api/auth/logout
// @access private
const logoutUser = asyncHandler((req, res) => {
  // Instruct the client to delete the token
  res.status(200).json({ message: "Logout successful" });
});

module.exports = { loginUser, registerUser, currentUser, logoutUser };