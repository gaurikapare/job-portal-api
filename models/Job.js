const mongoose = require("mongoose");

const jobSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 150 },
    description: { type: String, required: true, trim: true },
    companyName: { type: String, required: true, trim: true },
    location: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ["full-time", "part-time", "internship", "remote"],
      required: true
    },
    salary: { type: Number, required: true, min: 1 },
    skills: {
      type: [{ type: String, trim: true }],
      required: true,
      validate: {
        validator: (value) => Array.isArray(value) && value.length > 0,
        message: "Provide at least one skill"
      }
    },
    status: { type: String, enum: ["open", "closed"], default: "open" },
    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Job", jobSchema);
