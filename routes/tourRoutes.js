//we need to require in express since we're using a method from express
const express = require('express');
const {
  getAllTours,
  createTour,
  getOneTour,
  updateTour,
  deleteTour,
  aliasTopTours,
  getTourStats,
  getMonthlyPlan,
} = require('../controllers/tourController');
const { protect, restrictTo } = require('../controllers/authController');

const tourRouter = express.Router();

//parameter middleware - mw that only runs when there is a certan param
//tourRouter.param('id', checkId);

//mw for the post
//checkbody mw - check if body contains name/price property
//if not send back 404 error
//add it to the post handler stack

//alias route
tourRouter.route('/top-5-cheap').get(aliasTopTours, getAllTours);

tourRouter.route('/tour-stats').get(getTourStats);

tourRouter.route('/monthly-plan/:year').get(getMonthlyPlan);

//tours routes
tourRouter
  .route('/')
  .get(protect, restrictTo('admin', 'lead-guide', 'user'), getAllTours)
  .post(createTour);
tourRouter
  .route('/:id')
  .get(getOneTour)
  .patch(updateTour)
  .delete(protect, restrictTo('admin', 'lead-guide'), deleteTour);

module.exports = tourRouter;
