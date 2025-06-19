const validator = require('../helpers/validate.js');
const { ObjectId } = require('mongodb');

const saveTeam = (req, res, next) => {
  const validationRule = {
    name: 'required|string',
    record: 'required|string',
    location: 'required|string',
    players: 'required|integer',
    colors: 'required|string',
    headCoach: 'required|string',
    streak: 'required|integer',
  };

  validator(req.body, validationRule, {}, (err, status) => {
    if (!status) {
      res.status(412).send({
        success: false,
        message: 'Validation failed',
        data: err,
      });
    } else {
      next();
    }
  });
};

const saveUser = (req, res, next) => {
  const validationRule = {
    firstName: 'required|string',
    lastName: 'required|string',
    position: 'required|string',
  };

  validator(req.body, validationRule, {}, (err, status) => {
    if (!status) {
      res.status(412).send({
        success: false,
        message: 'Validation failed',
        data: err,
      });
    } else {
      next();
    }
  });
};

const validateId = (req, res, next) => {
  const id = req.params.id;

  if (!ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid ID format. Must be a valid MongoDB ObjectId.',
    });
  }

  next();
};

module.exports = {
  saveTeam,
  validateId,
  saveUser,
};