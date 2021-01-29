const { deleteMany } = require('../models/tourModel');
const Tour = require('../models/tourModel');
//Route handlers, aka controllers

/*
const tours = JSON.parse(
  fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`)
);
*/

//first get request
//get all tours
exports.getAllTours = async (req, res) => {
  try {
    //filtering out things like the page for pagination
    //new object containing all teh key value pairs in the req.query object
    // eslint-disable-next-line node/no-unsupported-features/es-syntax
    const queryObject = { ...req.query };
    const excludedFields = ['page', 'sort', 'limit', 'fields'];
    excludedFields.forEach((el) => delete queryObject[el]);
    /*gives us:
    //{ duration: '5',
  difficulty: 'easy',
  page: '2',
  sort: '1',
  limit: '10' } { duration: '5', difficulty: 'easy' }
  */

    //query is 127.0.0.1:3000/api/v1/tours?duration=5&difficulty=easy

    //from mongoDB, the find method returns all documents in teh collection

    const allTours = await Tour.find(queryObject);
    //new way, mongoose has specific filter methods we can use
    //query prototype has a ton of methods on the query class, so we can chain
    //when we use await, then the query executed and comes back with the result of the query
    //.where('duration')
    //.equals(5)
    //.where('difficulty')
    //.equals('easy');
    //could use the normal filter object from mongo
    // await Tour.find({ duration: 5, difficulty: 'easy'})

    //another way is await Tour.find(req.query)
    res.status(200);
    res.json({
      status: 'success',
      results: allTours.length,
      data: {
        tours: allTours,
      },
    });
  } catch (error) {
    res.status(404).json({
      status: 'fail',
      message: error,
    });
  }
};

exports.getOneTour = async (req, res) => {
  try {
    //findbyID is a helper function for finding one tour
    //like the filter object in mongodb
    //Tour.findOne({ _id: req.params.id })
    //findBy ID
    const tour = await Tour.findById(req.params.id);
    res.status(200).json({
      status: 'success',
      data: {
        tour: tour,
      },
    });
  } catch (error) {
    res.status(404).json({
      status: 'fail',
      message: error,
    });
  }
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
};

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

exports.createTour = async (req, res) => {
  //we need to error handle, and we use a try/catch block with async code
  try {
    //old version - had the tour we created,
    //Then the document has the save method and lots of others
    //const newTour = new Tour({});
    //newTour.save()

    //we call the create method right on the model itself
    //Tour.create(data) returns a promise, but we can use async await
    //and store the result into a var, which will be the
    //newly created document with the ID and everything
    //we pass in req.body because it is the data that comes in from the req
    const newTour = await Tour.create(req.body);

    //we tried to post a duration and difficulty, but it didnt work
    //Bc it's not in the schema
    res.status(201).json({
      status: 'success',
      data: {
        tour: newTour,
      },
    });
  } catch (error) {
    //if theres an error, send back a response saying so
    res.status(400).json({
      status: 'fail',
      message: error,
    });
  }
};

exports.updateTour = async (req, res) => {
  try {
    //findByIdAndUpdate
    const updatedTour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    //update still sends back 200 ok
    res.status(200);
    res.json({
      status: 'success',
      data: {
        tour: updatedTour,
      },
    });
  } catch (error) {
    res.status(400).json({
      status: 'fail',
      message: error,
    });
  }
};

exports.deleteTour = async (req, res) => {
  try {
    await Tour.findByIdAndDelete(req.params.id);
    //delete  sends back 204 no content
    //delete sends back no data to the client
    res.status(204);
    res.json({
      status: 'success',
      data: null,
    });
  } catch (error) {
    res.status(400).json({
      status: 'fail',
      message: error,
    });
  }
};
