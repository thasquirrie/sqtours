



// TO CATCH THE ERRORS IN THE ROUTES
module.exports = catchAsync = fn => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  }
}
