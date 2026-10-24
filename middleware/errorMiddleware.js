function notFound(req, res, next) {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`
  });
}

function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);

  if (error.name === "CastError") {
    return res.status(400).json({
      success: false,
      message: "Invalid ID format"
    });
  }

  if (error.code === 11000) {
    return res.status(409).json({
      success: false,
      message: "A record with these details already exists"
    });
  }

  if (error.name === "ValidationError") {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }

  console.error(error);
  return res.status(500).json({
    success: false,
    message: "An unexpected server error occurred"
  });
}

module.exports = { notFound, errorHandler };
