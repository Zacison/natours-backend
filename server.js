//getting mongoose
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: './config.env' });
const app = require('./app');

const DB = process.env.DATABASE.replace(
  '<password>',
  process.env.DATABASE_PASSWORD
);
//the mongoose driver, returns a promise
mongoose
  .connect(DB, {
    //options to deal with deprication warnings
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
  })
  .then(() => console.log('connected to the mongoose db'));

//creating a mongoose model
//the model is used to create docs using it, and to perform CRUD ops on those docs
//to create a model, we need a schema - validate data, set default values, describe data, etc...

//shows the environment where we're running
//env vars are global vars used to define env where a node app is running
//console.log(app.get('env'));
console.log(process.env);

//NODE_ENV is a var we can set to development or production
//we can also use env vars for config - ex diff dbs for dev/prod
//we can activate the right db based on env - same with pws, etc...
//
//start up a server
const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  console.log('Listening to the express server');
});

//handling all unhandles promise rejections
//importannt, since our error handling only works inside express app
//this handles things outside of that app - safety net
//listens to the unhandledRejection Events that occur in async code
process.on('unhandledRejection', (err) => {
  console.log(err.name, err.message);
  console.log('Unhandled rejection, shutting down...');
  //process.exit is used to exit the app
  //0 stands for success, 1 for uncaught exception
  //server.close closes server gracefully - finishes all req/res needed, then exits
  //in a production level app there will be something that restarts the app
  server.close(() => {
    process.exit(1);
  });
});
