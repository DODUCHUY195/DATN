const express = require("express");
const asyncHandler = require("../utils/asyncHandler");
const { auth } = require("../middlewares/auth");
const validate = require("../middlewares/validate");
const { authSchemas } = require("../schemas/requestSchemas");
const authController = require("../controllers/authController");

const router = express.Router();

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Dang ky tai khoan
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [fullName, email, password]
 *             properties:
 *               fullName:
 *                 type: string
 *                 example: Nguyen Van A
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user1@example.com
 *               password:
 *                 type: string
 *                 example: 123456
 *               phone:
 *                 type: string
 *                 example: 0901234567
 *     responses:
 *       201:
 *         description: Register successfully
 *       409:
 *         description: Email already exists
 */
router.post(
  "/register",
  validate(authSchemas.register),
  asyncHandler(authController.register),
);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Dang nhap
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: admin@gmail.com
 *               password:
 *                 type: string
 *                 example: admin123
 *     responses:
 *       200:
 *         description: Login successfully
 *       401:
 *         description: Invalid credentials
 */
router.post(
  "/login",
  validate(authSchemas.login),
  asyncHandler(authController.login),
);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Dang xuat (demo)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout successfully
 *       401:
 *         description: Missing or invalid token
 */
router.post("/logout", auth, asyncHandler(authController.logout));

module.exports = router;
