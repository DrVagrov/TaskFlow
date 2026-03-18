const mongoose = require("mongoose");

const statusSchema = new mongoose.Schema(
  {
    label: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
  }
);

module.exports = mongoose.model("Status", statusSchema);
