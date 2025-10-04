const mongoose = require('mongoose');

const RouteSchema = new mongoose.Schema({
  routeName: {
    type: String,
    required: [true, 'Please add a route name'],
    unique: true,
    trim: true,
  },
  driver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Driver',
    required: true,
  },
});

module.exports = mongoose.model('Route', RouteSchema);
