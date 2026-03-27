const ApiError = require("../utils/apiError");

module.exports = (err, req, res, next) => {
  if (err instanceof ApiError) {
    return res
      .status(err.statusCode)
      .json({ success: false, message: err.message });
  }

  if (err.name === "SequelizeUniqueConstraintError") {
    return res
      .status(409)
      .json({ success: false, message: "Du lieu bi trung." });
  }

  if (err.name === "SequelizeValidationError") {
    return res.status(400).json({
      success: false,
      message: "Validation error.",
      errors: err.errors.map((e) => e.message),
    });
  }

  // eslint-disable-next-line no-console
  console.error(err);
  return res
    .status(500)
    .json({ success: false, message: "Internal server error." });
};
