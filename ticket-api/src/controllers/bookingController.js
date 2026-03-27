const {
  Booking,
  Showtime,
  Movie,
  Room,
  SeatReservation,
  Seat,
  BookingSnack,
  Snack,
  Ticket,
} = require("../models");
const {
  holdSeats,
  confirmPayment,
  cancelBooking,
} = require("../services/bookingService");

const holdBooking = async (req, res) => {
  const { showtimeId, seatIds, snacks } = req.body;
  const booking = await holdSeats({
    userId: req.user.id,
    showtimeId,
    seatIds,
    snacks,
  });

  return res.status(201).json({
    message: "Seats held successfully.",
    data: booking,
  });
};

const confirmBookingPayment = async (req, res) => {
  const result = await confirmPayment({
    bookingId: Number(req.params.id),
    userId: req.user.id,
    method: req.body.method || "DEMO",
  });

  return res.json({
    message: "Payment success, booking confirmed.",
    data: result,
  });
};

const cancelMyBooking = async (req, res) => {
  const booking = await cancelBooking({
    bookingId: Number(req.params.id),
    userId: req.user.id,
    isAdmin: false,
  });

  return res.json({ message: "Booking canceled.", data: booking });
};

const getBookingDetail = async (req, res) => {
  const row = await Booking.findOne({
    where: { id: req.params.id, userId: req.user.id },
    include: [
      { model: Showtime, include: [{ model: Movie }, { model: Room }] },
      { model: SeatReservation, include: [{ model: Seat }] },
      { model: BookingSnack, include: [{ model: Snack }] },
      { model: Ticket },
    ],
  });

  if (!row) {
    return res.status(404).json({ message: "Booking not found." });
  }

  return res.json({ data: row });
};

module.exports = {
  holdBooking,
  confirmBookingPayment,
  cancelMyBooking,
  getBookingDetail,
};
