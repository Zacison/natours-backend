//we need to require in express since we're using a method from express
const express = require('express');
const {
  getAllTours,
  createTour,
  getOneTour,
  updateTour,
  deleteTour,
} = require('../controllers/tourController');

const tourRouter = express.Router();

//parameter middleware - mw that only runs when there is a certan param
//tourRouter.param('id', checkId);

//mw for the post
//checkbody mw - check if body contains name/price property
//if not send back 404 error
//add it to the post handler stack

//tours routes
tourRouter.route('/').get(getAllTours).post(createTour);
tourRouter.route('/:id').get(getOneTour).patch(updateTour).delete(deleteTour);

module.exports = tourRouter;
