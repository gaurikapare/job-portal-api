const express = require("express");
const protect = require("../middleware/authMiddleware");
const allowRoles = require("../middleware/roleMiddleware");
const {
  getMyApplications, updateApplicationStatus, withdrawApplication
} = require("../controllers/applicationController");

const router = express.Router();

router.get("/my", protect, allowRoles("candidate"), getMyApplications);
router.patch("/:id/status", protect, allowRoles("employer"), updateApplicationStatus);
router.delete("/:id", protect, allowRoles("candidate"), withdrawApplication);

module.exports = router;
