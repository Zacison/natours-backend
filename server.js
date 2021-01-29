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
app.listen(port, () => {
  console.log('Listening to the express server');
});
