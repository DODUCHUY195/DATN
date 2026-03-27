const jwt = require("jsonwebtoken");
const env = require("../config/env");
const { User } = require("../models");

const normalizeToken = (authorizationHeader = "") => {
  let token = String(authorizationHeader || "").trim();

  // Swagger HTTP bearer already prepends "Bearer ".
  // Handle accidental double prefix like "Bearer Bearer <token>".
  for (let i = 0; i < 2; i += 1) {
    if (/^Bearer\s+/i.test(token)) {
      token = token.replace(/^Bearer\s+/i, "").trim();
    }
  }

  // Handle pasted token wrapped by quotes.
  token = token.replace(/^\"|\"$/g, "").trim();

  return token;
};

const auth = async (req, res, next) => {
  const authHeader = req.headers.authorization || "";
  const token = normalizeToken(authHeader);

  if (!token || token === "undefined" || token === "null") {
    return res.status(401).json({ message: "Token is required." });
  }

  try {
    const decoded = jwt.verify(token, env.jwtSecret);

    const user = await User.findByPk(decoded.userId);

    if (!user || user.isLocked) {
      return res
        .status(401)
        .json({ message: "Invalid token or user is locked." });
    }

    req.user = user;
    return next();
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn("Token verification failed:", error.name);
    return res.status(401).json({
      message:
        "Token is invalid. Neu dung Swagger Authorize, chi dan token raw (khong them Bearer).",
    });
  }
};

const requireRole =
  (...roles) =>
  (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Forbidden." });
    }
    return next();
  };

module.exports = {
  auth,
  requireRole,
};
