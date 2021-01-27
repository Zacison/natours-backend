const Tour = require('../models/tourModel');
//Route handlers, aka controllers

/*
const tours = JSON.parse(
  fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`)
);
*/

//first get request
//get all tours
exports.getAllTours = (req, res) => {
  res.status(200);
  res.json({
    status: 'success',

    data: {},
  });
};

exports.getOneTour = (req, res) => {
  //consolse: {id: '5'}
  //req.params auto assigns the value to the parameter we defined
  //console.log(req.params);

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

exports.createTour = (req, res) => {
  //request object holds all the data about the request
  //out of the box express doesnt give us access to that
  //we need to include middleware for this
  //req.body is available bc of the middleware
  //console.log(req.body);
  //have to send something back to finish req/res cycle
  //new object usually gets an id
};

exports.updateTour = (req, res) => {
  //update still sends back 200 ok
  res.status(200);
  res.json({
    status: 'success',
    data: {
      tour: 'Updated tour here...',
    },
  });
};

exports.deleteTour = (req, res) => {
  //delete  sends back 204 no content
  res.status(204);
  res.json({
    status: 'success',
    data: null,
  });
};
