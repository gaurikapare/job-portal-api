const Job = require("../models/Job");
const Application = require("../models/Application");
const asyncHandler = require("../utils/asyncHandler");
const isValidObjectId = require("../utils/validateObjectId");

const applyToJob = asyncHandler(async (req, res) => {
  if (!isValidObjectId(req.params.id)) {
    return res.status(400).json({ success: false, message: "Invalid job ID format" });
  }

  const job = await Job.findById(req.params.id);
  if (!job) return res.status(404).json({ success: false, message: "Job not found" });

  if (job.status !== "open") {
    return res.status(409).json({ success: false, message: "You cannot apply to a closed job" });
  }

  const existing = await Application.findOne({ job: job._id, candidate: req.user._id });
  if (existing) {
    return res.status(409).json({ success: false, message: "You have already applied to this job" });
  }

  try {
    const application = await Application.create({
      job: job._id,
      candidate: req.user._id,
      coverLetter: req.body.coverLetter || ""
    });

    res.status(201).json({
      success: true,
      message: "Application submitted successfully",
      data: { application }
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: "You have already applied to this job" });
    }
    throw error;
  }
});

const getMyApplications = asyncHandler(async (req, res) => {
  const applications = await Application.find({ candidate: req.user._id })
    .populate("job", "title description companyName location type salary skills status")
    .sort("-createdAt");

  res.status(200).json({
    success: true,
    count: applications.length,
    data: applications
  });
});

const updateApplicationStatus = asyncHandler(async (req, res) => {
  if (!isValidObjectId(req.params.id)) {
    return res.status(400).json({ success: false, message: "Invalid application ID format" });
  }

  const { status } = req.body;
  const validStatuses = ["applied", "shortlisted", "rejected", "hired"];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ success: false, message: "Provide a valid application status" });
  }

  const application = await Application.findById(req.params.id).populate("job");
  if (!application) {
    return res.status(404).json({ success: false, message: "Application not found" });
  }

  if (application.job.postedBy.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: "You can only update applications for your own jobs" });
  }

  const allowedTransitions = {
    applied: ["shortlisted", "rejected"],
    shortlisted: ["hired", "rejected"],
    rejected: [],
    hired: []
  };

  if (!allowedTransitions[application.status].includes(status)) {
    return res.status(400).json({
      success: false,
      message: `An application cannot move from ${application.status} to ${status}`
    });
  }

  application.status = status;
  await application.save();

  res.status(200).json({
    success: true,
    message: "Application status updated successfully",
    data: { application }
  });
});

const withdrawApplication = asyncHandler(async (req, res) => {
  if (!isValidObjectId(req.params.id)) {
    return res.status(400).json({ success: false, message: "Invalid application ID format" });
  }

  const application = await Application.findById(req.params.id);
  if (!application) {
    return res.status(404).json({ success: false, message: "Application not found" });
  }

  if (application.candidate.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: "You can only withdraw your own applications" });
  }

  if (application.status !== "applied") {
    return res.status(400).json({
      success: false,
      message: "You can withdraw an application only while its status is applied"
    });
  }

  await application.deleteOne();
  res.status(200).json({ success: true, message: "Application withdrawn successfully" });
});

module.exports = {
  applyToJob, getMyApplications, updateApplicationStatus, withdrawApplication
};
