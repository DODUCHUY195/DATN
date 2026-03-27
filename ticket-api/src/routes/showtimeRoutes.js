const express = require("express");
const asyncHandler = require("../utils/asyncHandler");
const validate = require("../middlewares/validate");
const { movieSchemas } = require("../schemas/requestSchemas");
const movieController = require("../controllers/movieController");

const router = express.Router();

/**
 * @swagger
 * /api/showtimes:
 *   get:
 *     tags: [Showtimes]
 *     summary: Danh sach lich chieu
 *     parameters:
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         required: false
 *       - in: query
 *         name: roomId
 *         schema:
 *           type: integer
 *         required: false
 *       - in: query
 *         name: movieId
 *         schema:
 *           type: integer
 *         required: false
 *       - in: query
 *         name: timeSlot
 *         schema:
 *           type: string
 *           example: 9-12
 *         required: false
 *     responses:
 *       200:
 *         description: Danh sach lich chieu
 */
router.get(
  "/",
  validate(movieSchemas.listShowtimes),
  asyncHandler(movieController.listShowtimes),
);

/**
 * @swagger
 * /api/showtimes/{id}/seats:
 *   get:
 *     tags: [Showtimes]
 *     summary: Seat map va trang thai ghe
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Seat map
 *       404:
 *         description: Showtime not found
 */
router.get(
  "/:id/seats",
  validate(movieSchemas.movieIdParam),
  asyncHandler(movieController.getSeatMapByShowtime),
);

module.exports = router;
