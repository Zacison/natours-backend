//Has all the app configuration in one file

const express = require('express');

const morgan = require('morgan');
const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
//get the routes
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');

//this is a convntion
const app = express();

//midlewares

app.use(express.json());
//serving static files from the file system
app.use(express.static(`${__dirname}/public`));

//calling morgan will log request data to the console, its a logging middleware
//this is a third party middleware installed globaly, so every request
//we get the method, the path, status code, time back, and size of response in bytes

//if we are in development mode, then use morgan for logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}
/*
//middleware gets the res and req objects, as well as the next arg
//good to define global middleware before route handlers
//remember, middleware gets called in order that its written in code
app.use((req, res, next) => {
  console.log('Hello from the middleware');
  //have to call the next function in middlware,
  //otherwise it wouldnt move on and we would be stuck & never send a response back to the client
  next();
});

app.use((req, res, next) => {
  //adding a property to a request
  req.requestTime = new Date().toISOString();
  next();
});
*/

/*
//routing - server.method('path', callback  )
//the callback gets req and res, and decides what to do when they get a request
app.get('/', (req, res) => {
  //sent the status code by res.status
  //.send is like .end
  res.status(200).send('Hello from the server side');
  //can also send json - auto sets the content type property
  //in vanilla node we had to define it in the header so it would work
  res.json({ message: 'Hello there', answer: 'Ah yes, general Kenobi' });
});

//posting to an endpoint
app.post('/', (req, res) => {
  res.send('You can post to this endpoint');
});
*/

//Routes

//to separate routing into different files, we use the.Router middleware
//this creates a sort of mini app
//when the request hits the middleware, it will match the route

//the router on express is middleware,
//thats why we use app.use

//app.get('/api/v1/tours', getAllTours);
//app.get('/api/v1/tours/:id', getOneTour);
//app.post('/api/v1/tours', createTour);
//app.patch('/api/v1/tours/:id', updateTour);
//app.delete('/api/v1/tours/:id', deleteTour);

//cant use the routers before we declare them
//when a req comes in it will match with the path, and run the route
//mount the routers on two different routes

app.use((req, res, next) => {
  //adding a property to a request
  req.requestTime = new Date().toISOString();
  //console.log(req.headers.authorization);
  next();
});

app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);

//General error handle
//If we reach this point, the res/req cycle hasnt yet finished
//mw is added to our code in the order it is written
//if the route matched the tour or user router, it wouldnt even hit this
//this is the last part after every other route
//if we had this at the beginning, we would only get this.
//.all handles all get/post/methods, and the * gets all routes
app.all('*', (req, res, next) => {
  next(new AppError(`Cant find ${req.originalUrl} on this server`, 404));
});

//express has error handling out of the box
//by ysing a 4 arg function, express knows that it is error handling

app.use(globalErrorHandler);

module.exports = app;
