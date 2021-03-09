const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');

// ----------------
//Users routes

exports.getAllUsers = catchAsync(async (req, res) => {
  const allUsers = await User.find();

  res.status(200); //internal server error
  res.json({
    status: 'success',
    results: allUsers.length,
    data: {
      users: allUsers,
    },
  });
});

exports.getUser = (req, res) => {
  res.status(500); //internal server error
  res.json({
    status: 'err',
    message: 'This route is not yet defined',
  });
};

exports.createUser = (req, res) => {
  res.status(500); //internal server error
  res.json({
    status: 'err',
    message: 'This route is not yet defined',
  });
};

exports.updateUser = (req, res) => {
  res.status(500); //internal server error
  res.json({
    status: 'err',
    message: 'This route is not yet defined',
  });
};

exports.deleteUser = (req, res) => {
  res.status(500); //internal server error
  res.json({
    status: 'err',
    message: 'This route is not yet defined',
  });
};
