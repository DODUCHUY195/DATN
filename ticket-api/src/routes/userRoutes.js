const express = require("express");
const asyncHandler = require("../utils/asyncHandler");
const { auth } = require("../middlewares/auth");
const validate = require("../middlewares/validate");
const { userSchemas } = require("../schemas/requestSchemas");
const userController = require("../controllers/userController");

const router = express.Router();

/**
 * @swagger
 * /api/users/me:
 *   get:
 *     tags: [Users]
 *     summary: Xem thong tin ca nhan
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Thong tin user
 */
router.get("/me", auth, asyncHandler(userController.getProfile));

/**
 * @swagger
 * /api/users/me:
 *   put:
 *     tags: [Users]
 *     summary: Cap nhat thong tin ca nhan
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fullName:
 *                 type: string
 *                 example: Nguyen Van B
 *               phone:
 *                 type: string
 *                 example: 0911222333
 *               avatarUrl:
 *                 type: string
 *                 example: https://example.com/avatar.jpg
 *     responses:
 *       200:
 *         description: Profile updated
 */
router.put(
  "/me",
  auth,
  validate(userSchemas.updateProfile),
  asyncHandler(userController.updateProfile),
);

/**
 * @swagger
 * /api/users/me/bookings:
 *   get:
 *     tags: [Users]
 *     summary: Danh sach ve da dat
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sach booking cua user
 */
router.get("/me/bookings", auth, asyncHandler(userController.getMyBookings));

/**
 * @swagger
 * /api/users/me/history:
 *   get:
 *     tags: [Users]
 *     summary: Lich su dat ve
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lich su dat ve cua user
 */
router.get(
  "/me/history",
  auth,
  asyncHandler(userController.getMyBookingHistory),
);

module.exports = router;
