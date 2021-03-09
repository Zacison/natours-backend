const crypto = require('crypto');
const util = require('util');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const sendEmail = require('../utils/email');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

exports.signup = catchAsync(async (req, res, next) => {
  //for security - ex: somebody tries to put in an admin role
  //to get to more data, we wont put it in, since we are only using this data
  //if we need an admin, we can do it in compass, or define a special route that creates admins
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    role: req.body.role,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
  });

  //create a JWT token using the jwt library - pass in the id as the new
  //token's ID. Also, the secret key is a 32 char long random string, and we put it in the config.env file for ease of access
  //as an additional security measure, we can pass in an expiration time - 90 days
  const token = signToken(newUser._id);

  res.status(201).json({
    status: 'success',
    token,
    data: {
      user: newUser,
    },
  });
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // check if email and pw exist
  if (!email || !password) {
    //throw an error with our appError mw
    return next(new AppError('Please provide email and password', 400));
  }
  //check if user exists, and pw is correct
  //pass in the filter for the email
  const user = await User.findOne({ email: email }).select('+password');
  //const correct = await user.correctPassword(password, user.password);

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect email or password', 401));
  }

  //if everything is ok, send token to client
  const token = signToken(user._id);
  res.status(200).json({
    status: 'success',
    token,
  });
});

//implementing protected routes
//runs before the route handlers for the tours as a mw
//it checks if they are authenticated, and only then sends back the data
//example in the tour routes for notes **

//a common practice is to send a token using a http header with the request
//we can find it in req.headers
//the standard for sending a jwt as a header is using a header called authorization
//It starts with Bearer, since we possess this token, and then has the value of the token
//we can read the token from the header as req.headers.authorization in the console
exports.protect = catchAsync(async (req, res, next) => {
  //1-get token and check if it exists & starts with bearer
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    //get the second part of Bearer asdfasdf by splitting the string
    token = req.headers.authorization.split(' ')[1];
  }

  //throw an error if there is a new token
  //401 is unauthorized header
  if (!token) {
    return next(
      new AppError('You are not logged in. Please login to get access', 401)
    );
  }

  //2 -validate jwt token - verification checks if token is valid
  //by this point its not enough to just send a token with a req,
  //so we validate it so that nobody messes with the token

  //jwt.verify is a method on the jwt package
  //util is node's built in promise function to turn it into a promise
  //the promise will call jwt.verify, and the returned data will be stored in a var
  const decoded = await util.promisify(jwt.verify)(
    token,
    process.env.JWT_SECRET
  );

  /** contains ID of user, created/exp date of jwt
   * { id: '602445d3bd449e2c53a361b2',
    iat: 1614807816,
    exp: 1622583816 }
   */
  //trycatch for invalid jwt error & expired token error goes in global error handlind mw

  //3-check if user still exists, if verification is successful
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(
      new AppError('The user belonging to this token no longer exists', 401)
    );
  }
  //4-check if user changed password after jwt was issued
  //create this on an instance model on the user model
  //calling the instance method
  currentUser.changedPasswordAfter(decoded.iat);
  //if they changed their pw, throw a   n error
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError('User recently changed password! Please log in again.', 401)
    );
  }
  //go next, which is the route that was called - grant access to protected route
  //put the user on the req object, which may be useful in the future
  req.user = currentUser;
  next();
});

//authorization - in tourroutes we run protect first for authentication using protect
//now we use restrictTo to implement authorization
//only if the 2 mws pass, we go to the actual resource
//we pass all teh roles allowed to interact with the resource into the restrictTo func in the tourRoute
//This function will run and return this func
//which will return an error if they dont have permission

//On the userSchema, add a role field
/**
 * role: {
    type: String,
    enum: ['user', 'guide', 'lead-guide', 'admin'],
    default: 'user',
  },

  On exports.signup in the authController, add the role field
  so that it wont get stuck with the default role

  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    role: req.body.role,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
  });
 */

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    //roles ['admin', 'lead-guide']. role=user = no permission
    //we get the role of the user from the protect mw where we put it on the request object
    if (!roles.includes(req.user.role)) {
      return next(
        //403 is forbidden
        new AppError('You do not have permission to perform this action', 403)
      );
    }
    next();
  };
};

//forgot and reset passwords - add the routes to userRouter
exports.forgotPassword = catchAsync(async (req, res, next) => {
  //1 - get user based on POSTed email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError('There is no user with that email address', 404));
  }
  //2 - generate random reset token & save it to the user
  //create new instance method on the userSchema for this
  const resetToken = user.createPasswordResetToken();
  //need the validatebeforeSave option because we are trying to save a document
  //but arent specifying all the manditory data - fields marked as required
  //just need to turn this option false
  await user.save({ validateBeforeSave: false });

  //3- send it to the users email
  const resetURL = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/users/resetPassword/${resetToken}`;

  const message = `Forgot your password? Submit a patch request with your new password and passwordConfirm to: ${resetURL}.\nIf you didn't forget your password, please ignore this email`;

  try {
    await sendEmail({
      email: user.email,
      subject: 'Your password reset token - valid for 10 minutes',
      message,
    });

    res.status(200).json({
      status: 'success',
      message: 'Token sent to email',
    });
  } catch (err) {
    //if there is an error, reset the token & expiration to protect security
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    return next(
      new AppError('There was an error sending the email. Try again later', 500)
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  //1 -get user based on token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  //2 - if token has not expred and there is a user, set new pasword
  if (!user) {
    return next(new AppError('Token is invalid of has expired', 400));
  }
  user.password = req.body.password;
  user.passwordConfirm = req.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  //3 - update changedPasswordAt property for the user

  //4 - log the user in, send jwt
  const token = signToken(user._id);
  res.status(200).json({
    status: 'success',
    token: token,
  });
});
