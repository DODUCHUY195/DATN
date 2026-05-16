const dotenv = require("dotenv");
const crypto = require("crypto");

dotenv.config();

// Generate a secure default JWT secret if not provided
const generateSecureSecret = () => crypto.randomBytes(32).toString("hex");

const nodeEnv = process.env.NODE_ENV || "development";
const jwtSecret = process.env.JWT_SECRET || (nodeEnv === "production" 
  ? (() => {
    throw new Error("CRITICAL: JWT_SECRET environment variable must be set in production");
  })() 
  : generateSecureSecret());

module.exports = {
  port: Number(process.env.PORT || 3000),
  nodeEnv,
  jwtSecret,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  db: {
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT || 3306),
    name: process.env.DB_NAME || "ticket_db",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
  },
  dbSyncOnStart:
    (process.env.DB_SYNC_ON_START || "true").toLowerCase() === "true",
  seatHoldMinutes: Number(process.env.SEAT_HOLD_MINUTES || 10),
  momo: {
    partnerCode: process.env.MOMO_PARTNER_CODE || "MOMOBKUN20180529",
    accessKey: process.env.MOMO_ACCESS_KEY || "klm05nuayShadow",
    secretKey: process.env.MOMO_SECRET_KEY || "at67qH6mk8w5Y1n71y_Su791G6m9_",
    endpoint: process.env.MOMO_ENDPOINT || "https://test-payment.momo.vn/v2/gateway/api/create",
    redirectUrl: process.env.MOMO_REDIRECT_URL || "http://localhost:5173/payment-result",
    ipnUrl: process.env.MOMO_IPN_URL || "http://localhost:3000/api/bookings/momo-callback",
  },
};
