const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    dueDate: {
      type: String,
      default: null,
      match: [/^\d{4}-\d{2}-\d{2}$/, "dueDate must be YYYY-MM-DD"],
    },
    idCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
    },
    idStatu: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Status",
    },
    idUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Task", taskSchema);
