const db = require('../models');
const Theme = db.theme;

// Create a new theme
exports.createTheme = (req, res) => {
  if (!req.body.themeName) {
    return res.status(400).send({ message: "Theme name cannot be empty" });
  }

  const theme = new Theme({
    themeName: req.body.themeName,
    color: req.body.color,
    layout: req.body.layout
  });

  theme.save()
    .then(data => res.status(201).send(data))
    .catch(err => {
      res.status(500).send({
        message: "Error occurred while creating the theme.",
        error: err
      });
    });
};

// Get a theme by themeName
exports.getTheme = (req, res) => {
  const themeName = req.params.themeName;

  Theme.find({ themeName: themeName })
    .then(data => {
      if (!data || data.length === 0) {
        res.status(404).send({ message: 'Not found theme with name: ' + themeName });
      } else {
        res.send(data[0]);
      }
    })
    .catch(err => {
      res.status(500).send({
        message: 'Error retrieving theme with themeName=' + themeName,
        error: err
      });
    });
};

// Update a theme by themeName
exports.updateTheme = (req, res) => {
  const themeName = req.params.themeName;

  if (!req.body) {
    return res.status(400).send({ message: "Update data cannot be empty" });
  }

  Theme.findOneAndUpdate({ themeName: themeName }, req.body, { new: true })
    .then(data => {
      if (!data) {
        res.status(404).send({ message: "Theme not found with name: " + themeName });
      } else {
        res.send(data);
      }
    })
    .catch(err => {
      res.status(500).send({
        message: "Error updating theme with name=" + themeName,
        error: err
      });
    });
};

// Delete a theme by themeName
exports.deleteTheme = (req, res) => {
  const themeName = req.params.themeName;

  Theme.findOneAndDelete({ themeName: themeName })
    .then(data => {
      if (!data) {
        res.status(404).send({ message: "Theme not found with name: " + themeName });
      } else {
        res.send({ message: "Theme was deleted successfully." });
      }
    })
    .catch(err => {
      res.status(500).send({
        message: "Could not delete theme with name=" + themeName,
        error: err
      });
    });
};
