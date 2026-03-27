const {
  User,
  Booking,
  Showtime,
  Movie,
  Room,
  SeatReservation,
  BookingSnack,
  Snack,
  Ticket,
  Seat,
} = require("../models");

const getProfile = async (req, res) => {
  const user = await User.findByPk(req.user.id, {
    attributes: [
      "id",
      "fullName",
      "email",
      "phone",
      "avatarUrl",
      "role",
      "isLocked",
      "createdAt",
    ],
  });

  return res.json({ data: user });
};

const updateProfile = async (req, res) => {
  const { fullName, phone, avatarUrl } = req.body;

  req.user.fullName = fullName || req.user.fullName;
  req.user.phone = phone || req.user.phone;
  req.user.avatarUrl = avatarUrl || req.user.avatarUrl;

  await req.user.save();

  return res.json({
    message: "Profile updated.",
    data: {
      id: req.user.id,
      fullName: req.user.fullName,
      email: req.user.email,
      phone: req.user.phone,
      avatarUrl: req.user.avatarUrl,
    },
  });
};

const getMyBookings = async (req, res) => {
  const rows = await Booking.findAll({
    where: { userId: req.user.id },
    include: [
      { model: Showtime, include: [{ model: Movie }, { model: Room }] },
      { model: SeatReservation, include: [{ model: Seat }] },
      { model: BookingSnack, include: [{ model: Snack }] },
      { model: Ticket },
    ],
    order: [["createdAt", "DESC"]],
  });

  return res.json({ data: rows });
};

const getMyBookingHistory = async (req, res) => {
  const rows = await Booking.findAll({
    where: { userId: req.user.id },
    include: [
      { model: Showtime, include: [{ model: Movie }, { model: Room }] },
      { model: Ticket },
    ],
    order: [["createdAt", "DESC"]],
  });

  return res.json({ data: rows });
};

module.exports = {
  getProfile,
  updateProfile,
  getMyBookings,
  getMyBookingHistory,
};
