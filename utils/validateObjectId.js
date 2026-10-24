const mongoose = require("mongoose");

function isValidObjectId(value) {
  return mongoose.Types.ObjectId.isValid(value) &&
    String(new mongoose.Types.ObjectId(value)) === value;
}

module.exports = isValidObjectId;
