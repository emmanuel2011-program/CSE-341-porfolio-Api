const isAuthenticated = (req, res, next) => {
  console.log('--- Inside isAuthenticated Middleware ---'); // New log
  console.log('Request Path:', req.path);                   // New log
  console.log('Is req.isAuthenticated() a function?', typeof req.isAuthenticated === 'function'); // New log
  console.log('req.isAuthenticated() result:', req.isAuthenticated()); // New log
  console.log('Session User:', req.session?.passport?.user); // New log
  console.log('req.user:', req.user);                         // New log

    console.log('Checking authentication...');
    if (req.isAuthenticated && req.isAuthenticated()) {
      return next();
    }
    res.status(401).json({ message: 'you dont have access' });
  };  
  module.exports = {isAuthenticated};
  