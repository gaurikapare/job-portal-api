const express = require("express");
const protect = require("../middleware/authMiddleware");
const allowRoles = require("../middleware/roleMiddleware");
const {
  createJob, getJobs, getJob, updateJob, closeJob, deleteJob,
  getJobStats, getJobApplications
} = require("../controllers/jobController");
const { applyToJob } = require("../controllers/applicationController");

const router = express.Router();

router.get("/", getJobs);
router.get("/:id", getJob);

router.post("/", protect, allowRoles("employer"), createJob);
router.put("/:id", protect, allowRoles("employer"), updateJob);
router.patch("/:id/close", protect, allowRoles("employer"), closeJob);
router.delete("/:id", protect, allowRoles("employer"), deleteJob);
router.get("/:id/stats", protect, allowRoles("employer"), getJobStats);
router.get("/:id/applications", protect, allowRoles("employer"), getJobApplications);
router.post("/:id/apply", protect, allowRoles("candidate"), applyToJob);

module.exports = router;
