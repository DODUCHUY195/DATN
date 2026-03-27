const express = require("express");
const asyncHandler = require("../utils/asyncHandler");
const validate = require("../middlewares/validate");
const { movieSchemas } = require("../schemas/requestSchemas");
const movieController = require("../controllers/movieController");

const router = express.Router();

/**
 * @swagger
 * /api/movies:
 *   get:
 *     tags: [Movies]
 *     summary: Danh sach phim dang chieu / sap chieu
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [NOW_SHOWING, COMING_SOON]
 *         required: false
 *         description: Loc theo trang thai phim
 *     responses:
 *       200:
 *         description: Danh sach phim
 */
router.get(
  "/",
  validate(movieSchemas.listMovies),
  asyncHandler(movieController.listMovies),
);

/**
 * @swagger
 * /api/movies/{id}:
 *   get:
 *     tags: [Movies]
 *     summary: Chi tiet phim
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Chi tiet phim
 *       404:
 *         description: Movie not found
 */
router.get(
  "/:id",
  validate(movieSchemas.movieIdParam),
  asyncHandler(movieController.getMovieDetail),
);

module.exports = router;
