const express = require("express");
const asyncHandler = require("../utils/asyncHandler");
const { auth, requireRole } = require("../middlewares/auth");
const validate = require("../middlewares/validate");
const { adminSchemas, bookingSchemas } = require("../schemas/requestSchemas");
const adminController = require("../controllers/adminController");
const upload = require("../middlewares/upload");

const router = express.Router();

router.use(auth, requireRole("ADMIN"));

/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     tags: [Admin]
 *     summary: Danh sach user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sach user
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Users fetched successfully.
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       fullName:
 *                         type: string
 *                       email:
 *                         type: string
 *                       phone:
 *                         type: string
 *                         nullable: true
 *                       role:
 *                         type: string
 *                         enum: [USER, ADMIN]
 *                       isLocked:
 *                         type: boolean
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 */
router.get("/users", asyncHandler(adminController.listUsers));

/**
 * @swagger
 * /api/admin/users/{id}/lock:
 *   patch:
 *     tags: [Admin]
 *     summary: Khoa/mo khoa user
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [isLocked]
 *             properties:
 *               isLocked:
 *                 type: boolean
 *                 example: true
 */
router.patch(
  "/users/:id/lock",
  validate(adminSchemas.lockUser),
  asyncHandler(adminController.lockUser),
);

/**
 * @swagger
 * /api/admin/movies:
 *   get:
 *     tags: [Admin]
 *     summary: Danh sach phim
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sach phim
 */
router.get("/movies", asyncHandler(adminController.listMoviesAdmin));

/**
 * @swagger
 * /api/admin/movies:
 *   post:
 *     tags: [Admin]
 *     summary: Tao phim (co the upload poster/trailer)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [title, durationMinutes, status]
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               durationMinutes:
 *                 type: integer
 *               releaseDate:
 *                 type: string
 *                 format: date
 *               status:
 *                 type: string
 *                 enum: [NOW_SHOWING, COMING_SOON]
 *               poster:
 *                 type: string
 *                 format: binary
 *               trailer:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Tao phim thanh cong
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Movie created.
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     title:
 *                       type: string
 *                     description:
 *                       type: string
 *                       nullable: true
 *                     durationMinutes:
 *                       type: integer
 *                     releaseDate:
 *                       type: string
 *                       format: date
 *                       nullable: true
 *                     status:
 *                       type: string
 *                       enum: [NOW_SHOWING, COMING_SOON]
 *                     posterUrl:
 *                       type: string
 *                       nullable: true
 *                     trailerUrl:
 *                       type: string
 *                       nullable: true
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Validation error
 */
router.post(
  "/movies",
  upload.fields([
    { name: "poster", maxCount: 1 },
    { name: "trailer", maxCount: 1 },
  ]),
  validate(adminSchemas.createMovie),
  asyncHandler(adminController.createMovie),
);

/**
 * @swagger
 * /api/admin/movies/{id}:
 *   put:
 *     tags: [Admin]
 *     summary: Cap nhat phim
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               durationMinutes:
 *                 type: integer
 *               releaseDate:
 *                 type: string
 *                 format: date
 *               status:
 *                 type: string
 *                 enum: [NOW_SHOWING, COMING_SOON]
 *               poster:
 *                 type: string
 *                 format: binary
 *               trailer:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Cap nhat phim thanh cong
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Movie updated.
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     title:
 *                       type: string
 *                     description:
 *                       type: string
 *                       nullable: true
 *                     durationMinutes:
 *                       type: integer
 *                     releaseDate:
 *                       type: string
 *                       format: date
 *                       nullable: true
 *                     status:
 *                       type: string
 *                       enum: [NOW_SHOWING, COMING_SOON]
 *                     posterUrl:
 *                       type: string
 *                       nullable: true
 *                     trailerUrl:
 *                       type: string
 *                       nullable: true
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Validation error
 *       404:
 *         description: Movie not found
 */
router.put(
  "/movies/:id",
  upload.fields([
    { name: "poster", maxCount: 1 },
    { name: "trailer", maxCount: 1 },
  ]),
  validate(adminSchemas.updateMovie),
  asyncHandler(adminController.updateMovie),
);

/**
 * @swagger
 * /api/admin/movies/{id}:
 *   delete:
 *     tags: [Admin]
 *     summary: Xoa phim
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 */
router.delete(
  "/movies/:id",
  validate(adminSchemas.userIdParam),
  asyncHandler(adminController.deleteMovie),
);

/**
 * @swagger
 * /api/admin/cinemas:
 *   get:
 *     tags: [Admin]
 *     summary: Danh sach rap
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sach rap
 */
router.get("/cinemas", asyncHandler(adminController.listCinemas));

/**
 * @swagger
 * /api/admin/cinemas:
 *   post:
 *     tags: [Admin]
 *     summary: Tao rap
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, address]
 *             properties:
 *               name:
 *                 type: string
 *               address:
 *                 type: string
 */
router.post(
  "/cinemas",
  validate(adminSchemas.createCinema),
  asyncHandler(adminController.createCinema),
);

/**
 * @swagger
 * /api/admin/rooms:
 *   get:
 *     tags: [Admin]
 *     summary: Danh sach phong chieu
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sach phong
 */
router.get("/rooms", asyncHandler(adminController.listRooms));

/**
 * @swagger
 * /api/admin/rooms:
 *   post:
 *     tags: [Admin]
 *     summary: Tao phong chieu
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [cinemaId, name, rowCount, colCount]
 *             properties:
 *               cinemaId:
 *                 type: integer
 *               name:
 *                 type: string
 *               rowCount:
 *                 type: integer
 *               colCount:
 *                 type: integer
 */
router.post(
  "/rooms",
  validate(adminSchemas.createRoom),
  asyncHandler(adminController.createRoom),
);

/**
 * @swagger
 * /api/admin/rooms/{roomId}/seats/configure:
 *   post:
 *     tags: [Admin]
 *     summary: Cau hinh seat layout cho phong
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [seats]
 *             properties:
 *               seats:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [rowLabel, seatNumber]
 *                   properties:
 *                     rowLabel:
 *                       type: string
 *                     seatNumber:
 *                       type: integer
 *                     type:
 *                       type: string
 *                       enum: [SINGLE, COUPLE]
 *                     isActive:
 *                       type: boolean
 *     responses:
 *       200:
 *         description: Seat layout updated
 */
router.post(
  "/rooms/:roomId/seats/configure",
  validate(adminSchemas.configureSeats),
  asyncHandler(adminController.configureSeats),
);

/**
 * @swagger
 * /api/admin/showtimes:
 *   get:
 *     tags: [Admin]
 *     summary: Danh sach suat chieu
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sach suat chieu
 */
router.get("/showtimes", asyncHandler(adminController.listShowtimesAdmin));

/**
 * @swagger
 * /api/admin/showtimes:
 *   post:
 *     tags: [Admin]
 *     summary: Tao suat chieu
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [movieId, roomId, startTime, endTime]
 *             properties:
 *               movieId:
 *                 type: integer
 *               roomId:
 *                 type: integer
 *               startTime:
 *                 type: string
 *                 format: date-time
 *               endTime:
 *                 type: string
 *                 format: date-time
 *               basePrice:
 *                 type: number
 *               status:
 *                 type: string
 *                 enum: [ACTIVE, INACTIVE]
 *     responses:
 *       201:
 *         description: Showtime created
 */
router.post(
  "/showtimes",
  validate(adminSchemas.createShowtime),
  asyncHandler(adminController.createShowtime),
);

/**
 * @swagger
 * /api/admin/showtimes/{id}:
 *   put:
 *     tags: [Admin]
 *     summary: Cap nhat suat chieu
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               movieId:
 *                 type: integer
 *               roomId:
 *                 type: integer
 *               startTime:
 *                 type: string
 *                 format: date-time
 *               endTime:
 *                 type: string
 *                 format: date-time
 *               basePrice:
 *                 type: number
 *               status:
 *                 type: string
 *                 enum: [ACTIVE, INACTIVE]
 *     responses:
 *       200:
 *         description: Showtime updated
 */
router.put(
  "/showtimes/:id",
  validate(adminSchemas.updateShowtime),
  asyncHandler(adminController.updateShowtime),
);

/**
 * @swagger
 * /api/admin/showtimes/{id}:
 *   delete:
 *     tags: [Admin]
 *     summary: Xoa suat chieu
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 */
router.delete(
  "/showtimes/:id",
  validate(adminSchemas.userIdParam),
  asyncHandler(adminController.deleteShowtime),
);

/**
 * @swagger
 * /api/admin/bookings:
 *   get:
 *     tags: [Admin]
 *     summary: Danh sach booking
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sach booking
 */
router.get("/bookings", asyncHandler(adminController.listBookingsAdmin));

/**
 * @swagger
 * /api/admin/bookings/{id}/confirm:
 *   patch:
 *     tags: [Admin]
 *     summary: Xac nhan booking
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 */
router.patch(
  "/bookings/:id/confirm",
  validate(bookingSchemas.bookingIdParam),
  asyncHandler(adminController.confirmBookingAdmin),
);

/**
 * @swagger
 * /api/admin/bookings/{id}/cancel:
 *   patch:
 *     tags: [Admin]
 *     summary: Huy booking
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
  "/bookings/:id/cancel",
  validate(bookingSchemas.bookingIdParam),
  asyncHandler(adminController.cancelBookingAdmin),
);

/**
 * @swagger
 * /api/admin/dashboard:
 *   get:
 *     tags: [Admin]
 *     summary: Dashboard thong ke
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Thong ke tong quan
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalTicketsSold:
 *                       type: integer
 *                       example: 120
 *                     revenue:
 *                       type: number
 *                       example: 5000000
 *                     popularShowtimes:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           showtimeId:
 *                             type: integer
 *                           seatCount:
 *                             type: integer
 *                           Showtime:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: integer
 *                               startTime:
 *                                 type: string
 *                                 format: date-time
 *                               endTime:
 *                                 type: string
 *                                 format: date-time
 *                               Movie:
 *                                 type: object
 *                                 properties:
 *                                   id:
 *                                     type: integer
 *                                   title:
 *                                     type: string
 *                               Room:
 *                                 type: object
 *                                 properties:
 *                                   id:
 *                                     type: integer
 *                                   name:
 *                                     type: string
 */

router.get("/dashboard", asyncHandler(adminController.dashboard));

module.exports = router;
