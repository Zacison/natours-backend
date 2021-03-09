const express = require('express');
const {
  getAllUsers,
  createUser,
  getUser,
  updateUser,
  deleteUser,
} = require('../controllers/userController');
const {
  signup,
  login,
  forgotPassword,
  resetPassword,
} = require('../controllers/authController');

//Users routes
const userRouter = express.Router();

//for signup, we only need post - doesnt follow rest conventions
userRouter.post('/signup', signup);
userRouter.post('/login', login);

userRouter.post('/forgotPassword', forgotPassword);
userRouter.patch('/resetPassword/:token', resetPassword);

//rest format
userRouter.route('/').get(getAllUsers).post(createUser);
userRouter.route('/:id').get(getUser).patch(updateUser).delete(deleteUser);

//export them
module.exports = userRouter;
