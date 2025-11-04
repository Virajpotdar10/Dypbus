const mongoose = require('mongoose');

const RouteSchema = new mongoose.Schema({
  routeName: {
    type: String,
    required: [true, 'Please add a route name'],
    unique: true,
    trim: true,
  },
  busNumber: {
    type: String,
    required: [true, 'Please add a bus number'],
  },
  capacity: {
    type: Number,
    default: 40,
  },
  driver: {
    type: mongoose.Schema.ObjectId,
    ref: 'Driver',
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
}, {
 
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

RouteSchema.virtual('link').get(function() {
  return `/route/${this._id}`;
});
RouteSchema.pre('remove', async function(next) {
  console.log(`Students being removed from route ${this._id}`);
  await this.model('Student').deleteMany({ route: this._id });
  next();
});
module.exports = mongoose.model('Route', RouteSchema);