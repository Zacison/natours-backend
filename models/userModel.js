const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please tell us your name'],
  },
  email: {
    type: String,
    required: [true, 'Please provide your email'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please provide a valid email'],
  },
  photo: String,
  role: {
    type: String,
    enum: ['user', 'guide', 'lead-guide', 'admin'],
    default: 'user',
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 8,
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please confirm your password'],
    validate: {
      //custom validator function from the validator library
      //normal func bc we want THIS
      //PW checker, compares this to the 1st pw
      //but will only work on .create() and .save(), so we will have to use.save()
      //with update, not like findOneAndUpdate w/tours
      validator: function (el) {
        return el === this.password;
      },
      message: 'Passwords are not the same',
    },
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
});

//encryption mw on the document
//happens after we recieve teh doc but b4 we save it to the DB
UserSchema.pre('save', async function (next) {
  //only run func if pw was actually modified
  if (!this.isModified('password')) {
    return next();
  }
  //set the pw to the encrypted version
  this.password = await bcrypt.hash(this.password, 12);
  //after we validate it, we don't want to persist it to the DB, its just for checking
  //it was required, but doesnt have to persist - delete the field basically
  this.passwordConfirm = undefined;
  next();
});

UserSchema.pre('save', function (next) {
  if (!this.isModified('password') || this.isNew) {
    return next();
  }
  //putting pca 1 sec in the past ensures the token is always created
  this.passwordChangedAt = Date.now() - 1000;
  next();
});

//instance method - avaliable on all instances of the schema
UserSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  //pw is not availabe in the output because the select in the schema,
  //so we cant use this.password
  //compares the pw to match them
  return await bcrypt.compare(candidatePassword, userPassword);
};

UserSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    console.log(this.passwordChangedAt, JWTTimestamp);
    return JWTTimestamp < changedTimestamp;
    //100 < 200 = false
  }
  //false means not changed
  return false;
};

UserSchema.methods.createPasswordResetToken = function () {
  //create the token based on the built in crypto module
  const resetToken = crypto.randomBytes(32).toString('hex');
  //encrypt it to protect from attacks, and assign it to the user
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  //logs the original reset token & the encrypted one
  console.log({ resetToken }, this.passwordResetToken);

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
  //we send one token via email, and then have the encrypted version in our DB
  //We only save sensitive data in an encrypted form, and then compare it with the encrypted data in the DB
  return resetToken;
};

const User = mongoose.model('User', UserSchema);
module.exports = User;
