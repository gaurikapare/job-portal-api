const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const asyncHandler = require("../utils/asyncHandler");

function createToken(user) {
  return jwt.sign(
    { id: user._id.toString(), role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "1d" }
  );
}

function safeUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    ...(user.companyName ? { companyName: user.companyName } : {}),
    createdAt: user.createdAt
  };
}

const register = asyncHandler(async (req, res) => {
  const { name, email, password, role, companyName } = req.body;

  if (!name || !email || !password || !role) {
    return res.status(400).json({
      success: false,
      message: "Name, email, password and role are required"
    });
  }

  if (password.length < 6) {
    return res.status(400).json({
      success: false,
      message: "Password must contain at least 6 characters"
    });
  }

  if (!["candidate", "employer"].includes(role)) {
    return res.status(400).json({
      success: false,
      message: "Role must be candidate or employer"
    });
  }

  if (role === "employer" && !String(companyName || "").trim()) {
    return res.status(400).json({
      success: false,
      message: "Company name is required for employers"
    });
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const existing = await User.findOne({ email: normalizedEmail });

  if (existing) {
    return res.status(409).json({
      success: false,
      message: "An account with this email already exists"
    });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await User.create({
    name: name.trim(),
    email: normalizedEmail,
    password: hashedPassword,
    role,
    ...(role === "employer" ? { companyName: companyName.trim() } : {})
  });

  return res.status(201).json({
    success: true,
    message: "User registered successfully",
    data: { user: safeUser(user) }
  });
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: "Email and password are required"
    });
  }

  const user = await User.findOne({
    email: String(email).trim().toLowerCase()
  }).select("+password");

  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({
      success: false,
      message: "Invalid email or password"
    });
  }

  return res.status(200).json({
    success: true,
    message: "Login successful",
    token: createToken(user),
    data: { user: safeUser(user) }
  });
});

const getMe = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    data: { user: safeUser(req.user) }
  });
});

module.exports = { register, login, getMe };
