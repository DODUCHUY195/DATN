const express = require("express");
const asyncHandler = require("../utils/asyncHandler");
const movieController = require("../controllers/movieController");

const router = express.Router();

/**
 * @swagger
 * /api/snacks:
 *   get:
 *     tags: [Snacks]
 *     summary: Danh sach bong nuoc/combo
 *     responses:
 *       200:
 *         description: Danh sach snacks/combo
 */
router.get("/", asyncHandler(movieController.listSnacks));

module.exports = router;
