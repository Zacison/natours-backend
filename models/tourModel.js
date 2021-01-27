const mongoose = require('mongoose');
//mongoose.Schema specifies a schema for the data, describing and doing basic balidation
const tourSchema = new mongoose.Schema({
  //fields, and data types
  name: {
    type: String,
    required: [true, 'A tour must have a name'],
    unique: true,
  },
  rating: {
    type: Number,
    default: 4.5,
  },
  price: {
    type: Number,
    required: true,
  },
});

//model
const Tour = mongoose.model('Tour', tourSchema);

//now we create a new document created out of the tour model
//like a class being instantiated, so it's an instance of the tour model
module.exports = Tour;
