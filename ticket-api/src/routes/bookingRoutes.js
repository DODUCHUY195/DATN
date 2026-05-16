const express = require("express");
const asyncHandler = require("../utils/asyncHandler");
const { auth } = require("../middlewares/auth");
const validate = require("../middlewares/validate");
const { bookingSchemas } = require("../schemas/requestSchemas");
const bookingController = require("../controllers/bookingController");

const router = express.Router();

/**
 * @swagger
 * /api/bookings/hold:
 *   post:
 *     tags: [Bookings]
 *     summary: Giu ghe tam thoi 5-10 phut
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [showtimeId, seatIds]
 *             properties:
 *               showtimeId:
 *                 type: integer
 *                 example: 1
 *               seatIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 example: [1, 2]
 *               snacks:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     snackId:
 *                       type: integer
 *                     quantity:
 *                       type: integer
 *                 example:
 *                   - snackId: 1
 *                     quantity: 2
 *     responses:
 *       201:
 *         description: Seats held successfully
 */
router.post(
  "/hold",
  auth,
  validate(bookingSchemas.holdSeats),
  asyncHandler(bookingController.holdBooking),
);

/**
 * @swagger
 * /api/bookings/{id}/confirm-payment:
 *   post:
 *     tags: [Bookings]
 *     summary: Thanh toan demo va xac nhan dat ve
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               method:
 *                 type: string
 *                 enum: [DEMO, CARD, CASH]
 *                 example: DEMO
 *     responses:
 *       200:
 *         description: Payment success and booking confirmed
 */
router.post(
  "/:id/confirm-payment",
  auth,
  validate(bookingSchemas.confirmPayment),
  asyncHandler(bookingController.confirmBookingPayment),
);

/**
 * @swagger
 * /api/bookings/{id}/momo-payment:
 *   post:
 *     tags: [Bookings]
 *     summary: Khoi tao thanh toan MoMo
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 */
router.post(
  "/:id/momo-payment",
  auth,
  validate(bookingSchemas.bookingIdParam),
  asyncHandler(bookingController.createMomoPayment),
);

/**
 * @swagger
 * /api/bookings/momo-callback:
 *   post:
 *     tags: [Bookings]
 *     summary: Webhook MoMo IPN
 */
router.post(
  "/momo-callback",
  asyncHandler(bookingController.momoCallback),
);

/**
 * @swagger
 * /api/bookings/{id}:
 *   get:
 *     tags: [Bookings]
 *     summary: Chi tiet ve
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Booking detail
 */
router.get(
  "/:id",
  auth,
  validate(bookingSchemas.bookingIdParam),
  asyncHandler(bookingController.getBookingDetail),
);

/**
 * @swagger
 * /api/bookings/{id}/cancel:
 *   patch:
 *     tags: [Bookings]
 *     summary: Huy ve
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Booking canceled
 */
router.patch(
  "/:id/cancel",
  auth,
  validate(bookingSchemas.bookingIdParam),
  asyncHandler(bookingController.cancelMyBooking),
);

module.exports = router;
