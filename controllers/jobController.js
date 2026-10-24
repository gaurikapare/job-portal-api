const Job = require("../models/Job");
const Application = require("../models/Application");
const asyncHandler = require("../utils/asyncHandler");
const isValidObjectId = require("../utils/validateObjectId");

const createJob = asyncHandler(async (req, res) => {
  const { title, description, companyName, location, type, salary, skills } = req.body;

  if (!title || !description || !companyName || !location || !type ||
      salary === undefined || !Array.isArray(skills) || skills.length === 0) {
    return res.status(400).json({
      success: false,
      message: "Title, description, companyName, location, type, salary and a non-empty skills array are required"
    });
  }

  if (!["full-time", "part-time", "internship", "remote"].includes(type)) {
    return res.status(400).json({
      success: false,
      message: "Job type must be full-time, part-time, internship or remote"
    });
  }

  if (!Number.isFinite(Number(salary)) || Number(salary) <= 0) {
    return res.status(400).json({
      success: false,
      message: "Salary must be a positive number"
    });
  }

  const job = await Job.create({
    title, description, companyName, location, type,
    salary: Number(salary),
    skills,
    postedBy: req.user._id
  });

  res.status(201).json({
    success: true,
    message: "Job created successfully",
    data: { job }
  });
});

const getJobs = asyncHandler(async (req, res) => {
  const page = Number.parseInt(req.query.page || "1", 10);
  const limit = Number.parseInt(req.query.limit || "10", 10);

  if (!Number.isInteger(page) || page < 1 ||
      !Number.isInteger(limit) || limit < 1 || limit > 100) {
    return res.status(400).json({
      success: false,
      message: "page must be at least 1 and limit must be between 1 and 100"
    });
  }

  const filter = { status: "open" };

  if (req.query.search) {
    const search = String(req.query.search).trim();
    filter.$or = [
      { title: { $regex: search, $options: "i" } },
      { companyName: { $regex: search, $options: "i" } }
    ];
  }

  if (req.query.location) filter.location = { $regex: String(req.query.location), $options: "i" };
  if (req.query.type) {
    if (!["full-time", "part-time", "internship", "remote"].includes(req.query.type)) {
      return res.status(400).json({ success: false, message: "Invalid job type filter" });
    }
    filter.type = req.query.type;
  }
  if (req.query.skill) filter.skills = { $regex: String(req.query.skill), $options: "i" };

  if (req.query.minSalary !== undefined) {
    const minSalary = Number(req.query.minSalary);
    if (!Number.isFinite(minSalary) || minSalary < 0) {
      return res.status(400).json({ success: false, message: "minSalary must be a non-negative number" });
    }
    filter.salary = { $gte: minSalary };
  }

  const allowedSorts = ["salary", "-salary", "createdAt", "-createdAt", "title", "-title"];
  const sort = req.query.sort || "-createdAt";
  if (!allowedSorts.includes(sort)) {
    return res.status(400).json({
      success: false,
      message: "sort must be salary, -salary, createdAt, -createdAt, title or -title"
    });
  }

  const skip = (page - 1) * limit;
  const [jobs, total] = await Promise.all([
    Job.find(filter).sort(sort).skip(skip).limit(limit).populate("postedBy", "name companyName"),
    Job.countDocuments(filter)
  ]);

  res.status(200).json({
    success: true,
    total,
    page,
    pages: Math.ceil(total / limit),
    count: jobs.length,
    data: jobs
  });
});

const getJob = asyncHandler(async (req, res) => {
  if (!isValidObjectId(req.params.id)) {
    return res.status(400).json({ success: false, message: "Invalid job ID format" });
  }

  const job = await Job.findById(req.params.id).populate("postedBy", "name companyName");
  if (!job) return res.status(404).json({ success: false, message: "Job not found" });

  res.status(200).json({ success: true, data: { job } });
});

const updateJob = asyncHandler(async (req, res) => {
  if (!isValidObjectId(req.params.id)) {
    return res.status(400).json({ success: false, message: "Invalid job ID format" });
  }

  const job = await Job.findById(req.params.id);
  if (!job) return res.status(404).json({ success: false, message: "Job not found" });

  if (job.postedBy.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: "You can only update jobs you posted" });
  }

  const allowedFields = ["title", "description", "companyName", "location", "type", "salary", "skills"];
  for (const field of allowedFields) {
    if (req.body[field] !== undefined) job[field] = req.body[field];
  }

  await job.save();
  res.status(200).json({ success: true, message: "Job updated successfully", data: { job } });
});

const closeJob = asyncHandler(async (req, res) => {
  if (!isValidObjectId(req.params.id)) {
    return res.status(400).json({ success: false, message: "Invalid job ID format" });
  }

  const job = await Job.findById(req.params.id);
  if (!job) return res.status(404).json({ success: false, message: "Job not found" });

  if (job.postedBy.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: "You can only close jobs you posted" });
  }

  job.status = "closed";
  await job.save();
  res.status(200).json({ success: true, message: "Job closed successfully", data: { job } });
});

const deleteJob = asyncHandler(async (req, res) => {
  if (!isValidObjectId(req.params.id)) {
    return res.status(400).json({ success: false, message: "Invalid job ID format" });
  }

  const job = await Job.findById(req.params.id);
  if (!job) return res.status(404).json({ success: false, message: "Job not found" });

  if (job.postedBy.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: "You can only delete jobs you posted" });
  }

  await Application.deleteMany({ job: job._id });
  await job.deleteOne();

  res.status(200).json({ success: true, message: "Job and its applications deleted successfully" });
});

const getJobStats = asyncHandler(async (req, res) => {
  if (!isValidObjectId(req.params.id)) {
    return res.status(400).json({ success: false, message: "Invalid job ID format" });
  }

  const job = await Job.findById(req.params.id);
  if (!job) return res.status(404).json({ success: false, message: "Job not found" });

  if (job.postedBy.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: "You can only view statistics for your own jobs" });
  }

  const grouped = await Application.aggregate([
    { $match: { job: job._id } },
    { $group: { _id: "$status", count: { $sum: 1 } } }
  ]);

  const stats = { applied: 0, shortlisted: 0, rejected: 0, hired: 0 };
  grouped.forEach((item) => { stats[item._id] = item.count; });

  res.status(200).json({ success: true, data: stats });
});

const getJobApplications = asyncHandler(async (req, res) => {
  if (!isValidObjectId(req.params.id)) {
    return res.status(400).json({ success: false, message: "Invalid job ID format" });
  }

  const job = await Job.findById(req.params.id);
  if (!job) return res.status(404).json({ success: false, message: "Job not found" });

  if (job.postedBy.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: "You can only view applications for your own jobs" });
  }

  const filter = { job: job._id };
  if (req.query.status) {
    if (!["applied", "shortlisted", "rejected", "hired"].includes(req.query.status)) {
      return res.status(400).json({ success: false, message: "Invalid application status filter" });
    }
    filter.status = req.query.status;
  }

  const applications = await Application.find(filter)
    .populate("candidate", "name email")
    .populate("job", "title companyName location");

  res.status(200).json({ success: true, count: applications.length, data: applications });
});

module.exports = {
  createJob, getJobs, getJob, updateJob, closeJob, deleteJob,
  getJobStats, getJobApplications
};
