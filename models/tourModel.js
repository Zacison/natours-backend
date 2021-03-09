const mongoose = require('mongoose');
const slugify = require('slugify');

//mongoose.Schema specifies a schema for the data, describing and doing basic balidation
const tourSchema = new mongoose.Schema(
  {
    //fields, and data types
    name: {
      type: String,
      required: [true, 'A tour must have a name'],
      unique: true,
      //validators
      //the runValidators setting has to be set to true in the updateTour route handler for this to work, for example
      maxlength: [40, 'A tour name must have less than or equal to 40 chars'],
      minlength: [3, 'A name must have more than 3 characters'],
      //this is how we use the validator alphabetic validation
      //but this doesnt handle white space
      /*validate: [
        validator.isAlpha,
        'Tour name must only contain alphabet chars',
      ],
      */
    },
    slug: String,
    duration: {
      type: Number,
      required: [true, 'A tour must have a duration'],
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a group size'],
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must have a difficulty'],
      //validators for strings
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'Difficulty is either easy, medium, or difficult',
      },
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      //number validation
      min: [0, 'Rating must be above 0'],
      max: [5, 'Rating must be below 5'],
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: true,
    },
    priceDiscount: Number,
    //custom validator for if the discout is greater than the price

    summary: {
      type: String,
      //trim removes leading/trailing whitespace
      trim: true,
      required: [true, 'A tour must have a description'],
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String,
      required: [true, 'A tour must have a cover image'],
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false,
    },
    startDates: [Date],
    secretTour: {
      type: Boolean,
      default: false,
    },
  },
  //second object is the opject for schema options
  {
    //each time the data is outputted as json or an object,
    //we want our virtuals to show up there too
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

//fields we can define on our schema that arent persistenct
//useful for things that can be derived from one another, like miles to KM
//.get is used bc its called each time we get some data
//we use a normal function bc the arrow func doenst get the this keyword
//we need this bc we want to point to the current document

//also, we cant use vprops in queries, bc they arent part of the DB
//we could do this conversion each time after we query the data
//But this is a bad practice bc we want to seprarate biz and app logic
//knowing duration in weeks is biz logic, so we do the calc in the model where it belongs
tourSchema.virtual('durationWeeks').get(function () {
  //calc duration in weeks
  return this.duration / 7;
});

//Mongoose middleware
//document middleware manipulates documents that are currently being saved
//document middleware - runs vefore .save and .create
//wont run for insertMany, findOneAndUpdate, etc...
//pre save hook runs before the document is saved
tourSchema.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

//post runs after the doc is saved
tourSchema.post('save', function (doc, next) {
  console.log(doc);
  next();
});

//Mongoose Query middleware
//run funcs before or after a query is executed
//pre find middleware, runs before the find method
//use case ex: secret tours in our DB
//create a secret tour field and only query for tours that arent secret
tourSchema.pre('find', function (next) {
  //when the original .find() method is called, this runs next as mw
  this.find({ secretTour: false });
  next();
});

//we are trying to hide secret tours from an ID based search
//regex makes it so any mw that starts with find gets used
//find, findOne, findOneAndUpdate, etc...
tourSchema.pre(/^find/, function (next) {
  //when the original .find() method is called, this runs next as mw
  this.find({ secretTour: false });
  next();
});

//post happens after the query
tourSchema.post(/^find/, function (docs, next) {
  console.log(docs);
  next();
});

//aggregation middleware
//we want to exclude the secret tour in the aggregation
tourSchema.pre('aggregate', function (next) {
  //points to the current aggregation object
  //the pipeline is the array we passed into the aggregate function before
  //match, group, sort
  //to filter out the tour, we add another match at the beginning
  this.pipeline().unshift({ $match: { $secretTour: false } });
  console.log(this.pipeline());
  next();
});

//model
const Tour = mongoose.model('Tour', tourSchema);

//now we create a new document created out of the tour model
//like a class being instantiated, so it's an instance of the tour model
module.exports = Tour;
