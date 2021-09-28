const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const slug = require('slugify');

// const Review =

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A user must have a name'],
    },
    email: {
      type: String,
      required: [true, 'A user must have an email'],
      unique: true,
      lowercase: true,
      trim: true,
      validate: [validator.isEmail, 'Please enter a valid email'],
    },
    photo: {
      type: String,
      default: 'default.jpg',
    },
    role: {
      type: String,
      enum: ['user', 'guide', 'lead-guide', 'admin'],
      default: 'user',
    },
    password: {
      type: String,
      required: [true, 'Password is needed for user authentication'],
      minlength: 8,
      select: false,
    },
    confirmPassword: {
      type: String,
      required: [true, 'User need to confirm password'],
      validate: {
        validator: function (el) {
          return el === this.password;
        },
        message: 'Passwords are not the same',
      },
    },
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordTokenExpireTime: Date,
    active: {
      type: Boolean,
      default: true,
      select: true,
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// UserSchema.virtual('firstName').get(function() {
//   // console.log(this.name.split(' ')[0])
//   return this.name.split(' ')[0];
// });

UserSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'user',
  localField: '_id',
  select: '-__v',
});

UserSchema.virtual('bookings', {
  ref: 'Booking',
  foreignField: 'user',
  localField: '_id',
  select: '-__v',
});

// UserSchema.pre(/^find/, function(next) {
//   console.log('Yes we are here');
//   this.populate({
//     path: 'bookings',
//     // select: 'paid'
//   });
//   next();
// })

// Middleware to encrypt password and to delete password confirmation from the database
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  this.password = await bcrypt.hash(this.password, 12);

  this.confirmPassword = undefined;
  console.log('Password change time:', this.passwordChangedAt);
  next();
});

// Middleware to check if password is modified and create a timestamp when it
// was modified
UserSchema.pre('save', function (next) {
  if (!this.isModified('password') || this.isNew) return next();

  this.passwordChangedAt = Date.now() - 2000;
  next();
});

UserSchema.pre(/^find/, function (next) {
  this.find({ active: { $ne: false } });
  next();
});

// Middleware method to compare passwords in the database and the one user inputted
UserSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

// Middleware method to compare the time token was issued and the time password
// was changed, if changed.
UserSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );

    // console.log(JWTTimestamp, changedTimestamp);
    return JWTTimestamp < changedTimestamp;
  }

  return false;
};

// Middleware method to create password reset token
UserSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  this.passwordTokenExpireTime = Date.now() + 10 * 60 * 1000;

  console.log({ resetToken }, this.passwordResetToken);

  return resetToken;
};

// UserSchema.methods.sayHello = function() {
//   return `Hello ${this.name}`
// }

const User = mongoose.model('User', UserSchema);

module.exports = User;

// bookings: {
//   type: mongoose.Schema.ObjectId,
//   ref: 'Booking',
// }
