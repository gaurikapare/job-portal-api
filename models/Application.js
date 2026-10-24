const mongoose = require("mongoose");

const applicationSchema = new mongoose.Schema(
  {
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      required: true
    },
    candidate: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    coverLetter: { type: String, trim: true, maxlength: 5000, default: "" },
    status: {
      type: String,
      enum: ["applied", "shortlisted", "rejected", "hired"],
      default: "applied"
    }
  },
  { timestamps: true }
);

applicationSchema.index({ job: 1, candidate: 1 }, { unique: true });

module.exports = mongoose.model("Application", applicationSchema);
