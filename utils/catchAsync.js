//fixing the try catch block
//we only want to run the normal code, lets abstract out the error handling
//create a function and wrap the async function into that function

module.exports = (fn) => {
  //we return this function so the route handler doesnt auto call the handler, but instead waits
  //it returns a function, waiting until its called
  //this is the func express will call
  return (req, res, next) => {
    //abstracting the catch to the global error handline mw
    //when theres an error in async function, promise gets rejected
    //we can catch the error here because the promise can be rejected
    //so, where we call that function, we can catch the error - instead of the try/catch block
    //err => next(err) is the same as writing next - shorthand
    fn(req, res, next).catch((err) => next(err));
  };
};
