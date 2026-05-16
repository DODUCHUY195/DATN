const {
  Booking,
  Showtime,
  Movie,
  Room,
  Cinema,
  SeatReservation,
  Seat,
  BookingSnack,
  Snack,
  Ticket,
  User,
  Payment,
} = require("../models");
const {
  holdSeats,
  confirmPayment,
  cancelBooking,
} = require("../services/bookingService");
const momoService = require("../services/momoService");

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
  const { id } = req.params;
  const where = { id: Number(id) };
  
  // Cho phép ADMIN, MANAGER, SUPER_ADMIN xem mọi booking
  const adminRoles = ["ADMIN", "MANAGER", "SUPER_ADMIN"];
  if (!adminRoles.includes(req.user.role)) {
    where.userId = req.user.id;
  }

  const row = await Booking.findOne({
    where,
    include: [
      { model: User, attributes: ["id", "fullName", "email", "phone"] },
      { 
        model: Showtime, 
        include: [
          { model: Movie }, 
          { model: Room, include: [{ model: Cinema }] }
        ] 
      },
      { model: SeatReservation, include: [{ model: Seat }] },
      { model: BookingSnack, include: [{ model: Snack }] },
      { model: Ticket },
      { model: Payment },
    ],
  });

  if (!row) {
    return res.status(404).json({ message: "Booking not found." });
  }

  return res.json({ data: row });
};

const createMomoPayment = async (req, res) => {
  const where = { id: req.params.id, status: "HOLD" };
  
  // Nếu không phải admin thì mới kiểm tra sở hữu đơn hàng
  const adminRoles = ["ADMIN", "MANAGER", "SUPER_ADMIN"];
  const isAdmin = adminRoles.includes(req.user.role);
  if (!isAdmin) {
    where.userId = req.user.id;
  }

  const booking = await Booking.findOne({ where });

  if (!booking) {
    return res.status(404).json({ message: "Không tìm thấy đơn hàng hoặc đơn hàng đã hết hạn." });
  }

  const result = await momoService.createPayment(booking);
  
  // Nếu là admin, ép kiểu payUrl để simulator biết và chuyển hướng đúng
  if (isAdmin && result.payUrl && result.payUrl.includes("momo-simulator")) {
    const urlObj = new URL(result.payUrl);
    const origin = req.get('origin') || 'http://localhost:5173';
    const adminRedirectUrl = `${origin}/admin/bookings?from_momo=true&bookingId=${booking.id}`;
    urlObj.searchParams.set("redirectUrl", adminRedirectUrl);
    result.payUrl = urlObj.toString();
  }

  // LOG để kiểm tra kết quả trả về
  console.log("MOMO API Response:", result);

  return res.json({ data: result });
};

const momoCallback = async (req, res) => {
  console.log("MoMo IPN Callback:", req.body);
  
  // Bỏ qua kiểm tra chữ ký nếu là từ Simulator của chúng ta
  const isSimulator = req.body.partnerCode === "MOMOSIMULATOR";
  
  if (!isSimulator) {
    const isValid = momoService.verifySignature(req.body);
    if (!isValid) {
      console.error("MoMo Callback: Invalid Signature");
      return res.status(400).json({ message: "Invalid Signature" });
    }
  }

  const { orderId, resultCode, transId, amount } = req.body;
  const bookingCode = orderId.split("_")[0]; // Lấy phần booking code trước dấu gạch dưới

  if (resultCode === 0) {
    // Payment success
    const booking = await Booking.findOne({ where: { code: bookingCode } });
    if (booking && booking.status === "HOLD") {
      await confirmPayment({
        bookingId: booking.id,
        userId: booking.userId,
        method: "MOMO",
        transactionRef: transId,
      });
      console.log(`MoMo: Booking ${bookingCode} confirmed with transId ${transId}.`);
    }
  } else {
    console.log(`MoMo: Payment for ${bookingCode} failed with code ${resultCode}.`);
  }

  return res.status(204).send();
};

module.exports = {
  holdBooking,
  confirmBookingPayment,
  cancelMyBooking,
  getBookingDetail,
  createMomoPayment,
  momoCallback,
};
