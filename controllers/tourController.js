const { deleteMany, update } = require('../models/tourModel');
const Tour = require('../models/tourModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
//Route handlers, aka controllers

exports.aliasTopTours = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage, price';
  req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
  next();
};

/*
const tours = JSON.parse(
  fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`)
);
*/

class APIFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  filter() {
    // 1- Filtering
    const queryObject = { ...this.queryString };
    const excludedFields = ['page', 'sort', 'limit', 'fields'];
    excludedFields.forEach((el) => delete queryObject[el]);

    //2) Advanced filtering
    //now we want to do greater than, less than, equals to, etc...
    //in the query, it will be /tours?duration{[gte]=5
    //the query we get back wont habve the $. thats just what mongoose does
    //so we have to replace it with the $ sign
    // { difficulty: 'easy', duration: { $gte: 5 } }

    let queryStr = JSON.stringify(queryObject);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);
    queryStr = JSON.parse(queryStr);
    this.query = this.query.find(queryStr);
    return this;
  }

  sort() {
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort.split(',').join(' ');

      this.query = this.query.sort(sortBy);
    } else {
      //if there is no sort, sort by createdAt, so the new creations appear first
      this.query = this.query.sort('-createdAt');
    }
    return this;
  }

  limitFields() {
    //FIELD LIMITING
    ///tours?fields=name,duration,difficulty,price
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(',').join(' ');
      this.query = this.query.select(fields);
    } else {
      this.query = this.query.select('-__v');
    }
    return this;
  }

  paginate() {
    //PAGINATION
    //uses page field, ex: ?page=2&limit=10
    // 1-10 is page 1, 11-20 is page 2, etc...
    //skip value is dynamic, so we have to calculate that
    //default: make the string into a number
    const page = this.queryString.page * 1 || 1;
    const limit = this.queryString.limit * 1 || 100;
    const skip = (page - 1) * limit;
    this.query = this.query.skip(skip).limit(limit);

    return this;
  }
}

//first get request
//get all tours
exports.getAllTours = catchAsync(async (req, res, next) => {
  //console.log(req.query);

  //Build query

  //Execute the query
  //passing in the model we can query, and the qstring coming from express
  //then we manipulate the query
  const features = new APIFeatures(Tour.find(), req.query);
  //can chain methods bc we return this at the end of each method
  features.filter().sort().limitFields().paginate();

  const allTours = await features.query;

  //another way is await Tour.find(req.query)
  res.status(200);
  res.json({
    status: 'success',
    results: allTours.length,
    data: {
      tours: allTours,
    },
  });
});

exports.getOneTour = catchAsync(async (req, res, next) => {
  //findbyID is a helper function for finding one tour
  //like the filter object in mongodb
  //Tour.findOne({ _id: req.params.id })
  //findBy ID
  const tour = await Tour.findById(req.params.id);

  //if the tour cant be found based on the ID
  //we create an error, pass it into next
  //the global error handline middleware will send a response back for us
  if (!tour) {
    return next(new AppError('No tour found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      tour: tour,
    },
  });

  //consolse: {id: '5'}
  //req.params auto assigns the value to the parameter we defined
  //console.log(req.params);
  /*
  //convert the ID string to a number
  const reqParamId = req.params.id * 1;

  //find the element where the tour's id matches the request
  //.find creates an array where it matches the params
  //const tour = tours.find((el) => el.id === reqParamId);

  //then, send back the matching tour
  res.status(200);
  res.json({
    status: 'success',
    data: {},
  });
  */
});

//mw for the post
//checkbody mw - check if body contains name/price property
//if not send back 404 error
//add it to the post handler stack

/*
exports.checkBody = (req, res, next) => {
  if (!req.body.name || !req.body.price) {
    return res.status(404).json({
      status: 'fail',
      message: 'Name or price not found',
    });
  }
  next();
};
*/

exports.createTour = catchAsync(async (req, res, next) => {
  const newTour = await Tour.create(req.body);

  //we tried to post a duration and difficulty, but it didnt work
  //Bc it's not in the schema
  res.status(201).json({
    status: 'success',
    data: {
      tour: newTour,
    },
  });
});

exports.updateTour = catchAsync(async (req, res, next) => {
  //findByIdAndUpdate
  const updatedTour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!updatedTour) {
    return next(new AppError('No tour found with that ID', 404));
  }

  //update still sends back 200 ok
  res.status(200);
  res.json({
    status: 'success',
    data: {
      tour: updatedTour,
    },
  });
});

exports.deleteTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findByIdAndDelete(req.params.id);
  //delete  sends back 204 no content
  //delete sends back no data to the client

  if (!tour) {
    return next(new AppError('No tour found with that ID', 404));
  }
  res.status(204);
  res.json({
    status: 'success',
    data: null,
  });
});

//aggregation pipeline, part of mongo
exports.getTourStats = catchAsync(async (req, res, next) => {
  const stats = await Tour.aggregate([
    //match stage
    {
      $match: { ratingsAverage: { $gte: 4.5 }, _id: { $ne: 'easy' } },
    },
    {
      $group: {
        _id: 'difficulty',
        //_id: '$difficulty',
        numTours: { $sum: 1 },
        numRatings: { $sum: '$ratingsAverage' },
        avgRating: { $avg: '$ratingsAverage' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
      },
    },
    {
      $sort: { avgPrice: 1 },
    },
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      stats: stats,
    },
  });
});

exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
  const year = req.params.year * 1;
  const plan = await Tour.aggregate([
    {
      //unwinds all the startdates in the results,
      //so theres 27 tours instead of 9, bc each tour has 3 start dates
      $unwind: '$startDates',
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`),
        },
      },
    },
    {
      $group: {
        _id: { $month: '$startDates' },
        numTourStarts: { $sum: 1 },
        tours: { $push: '$name' },
      },
    },
    {
      $addFields: { month: '$_id' },
    },
    {
      $project: {
        _id: 0,
      },
    },
    {
      $sort: { numTourStarts: -1 },
    },
    {
      $limit: 12,
    },
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      plan: plan,
    },
  });
});
