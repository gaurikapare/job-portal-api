const express = require("express");
const { body } = require("express-validator");
const { register, login, getMe } = require("../controllers/authController");
const protect = require("../middleware/authMiddleware");
const validateRequest = require("../middleware/validationMiddleware");

const router = express.Router();

router.post(
  "/register",
  [
    body("name").trim().notEmpty().withMessage("Name is required"),
    body("email").isEmail().withMessage("Enter a valid email"),
    body("password").isLength({ min: 6 }).withMessage("Password must contain at least 6 characters"),
    body("role").isIn(["candidate", "employer"]).withMessage("Role must be candidate or employer"),
    body("companyName").custom((value, { req }) => {
      if (req.body.role === "employer" && !String(value || "").trim()) {
        throw new Error("Company name is required for employers");
      }
      return true;
    })
  ],
  validateRequest,
  register
);

router.post(
  "/login",
  [
    body("email").isEmail().withMessage("Enter a valid email"),
    body("password").notEmpty().withMessage("Password is required")
  ],
  validateRequest,
  login
);

router.get("/me", protect, getMe);

module.exports = router;
