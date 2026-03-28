const { Op } = require("sequelize");
const dayjs = require("dayjs");
const QRCode = require("qrcode");
const env = require("../config/env");
const ApiError = require("../utils/apiError");
const {
  generateBookingCode,
  generateTicketCode,
} = require("../utils/bookingCode");
const {
  sequelize,
  Booking,
  Showtime,
  Seat,
  SeatReservation,
  Snack,
  BookingSnack,
  Payment,
  Ticket,
  Movie,
  Room,
} = require("../models");

const cleanupExpiredReservations = async (transaction) => {
  const now = new Date();

  await SeatReservation.update(
    { status: "EXPIRED" },
    {
      where: {
        status: "HELD",
        expiresAt: { [Op.lt]: now },
      },
      transaction,
    },
  );

  await Booking.update(
    { status: "EXPIRED" },
    {
      where: {
        status: "HOLD",
        expiresAt: { [Op.lt]: now },
      },
      transaction,
    },
  );
};

const calculateSeatPrice = (basePrice, seatType) => {
  if (seatType === "COUPLE") {
    return Number(basePrice) * 1.8;
  }
  return Number(basePrice);
};

const holdSeats = async ({ userId, showtimeId, seatIds, snacks = [] }) => {
  if (!seatIds || seatIds.length === 0) {
    throw new ApiError(400, "seatIds là bắt buộc.");
  }

  return sequelize.transaction(async (transaction) => {
    await cleanupExpiredReservations(transaction);

    const showtime = await Showtime.findByPk(showtimeId, {
      include: [{ model: Room }],
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!showtime) {
      throw new ApiError(404, "Không tìm thấy lịch chiếu.");
    }

    if (dayjs(showtime.startTime).isBefore(dayjs())) {
      throw new ApiError(400, "Không thể đặt vé cho suất chiếu đã bắt đầu.");
    }

    const seats = await Seat.findAll({
      where: {
        id: seatIds,
        roomId: showtime.roomId,
        isActive: true,
      },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (seats.length !== seatIds.length) {
      throw new ApiError(400, "Một số ghế không hợp lệ trong phòng này.");
    }

    const now = new Date();
    const conflicts = await SeatReservation.findAll({
      where: {
        showtimeId,
        seatId: seatIds,
        [Op.or]: [
          { status: "BOOKED" },
          {
            status: "HELD",
            expiresAt: { [Op.gt]: now },
          },
        ],
      },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (conflicts.length > 0) {
      throw new ApiError(409, "Một số ghế đã được đặt trước.");
    }

    const expiresAt = dayjs().add(env.seatHoldMinutes, "minute").toDate();

    const booking = await Booking.create(
      {
        userId,
        showtimeId,
        code: generateBookingCode(),
        status: "HOLD",
        paymentStatus: "PENDING",
        expiresAt,
      },
      { transaction },
    );

    let total = 0;

    for (const seat of seats) {
      const seatPrice = calculateSeatPrice(showtime.basePrice, seat.type);
      total += seatPrice;
      await SeatReservation.create(
        {
          showtimeId,
          seatId: seat.id,
          bookingId: booking.id,
          status: "HELD",
          expiresAt,
          price: seatPrice,
        },
        { transaction },
      );
    }

    if (snacks.length > 0) {
      const snackIds = snacks.map((item) => item.snackId);
      const snackRows = await Snack.findAll({
        where: {
          id: snackIds,
          isActive: true,
        },
        transaction,
      });

      for (const item of snacks) {
        const snack = snackRows.find((s) => s.id === item.snackId);
        if (!snack) {
          throw new ApiError(400, `Snack ${item.snackId} is invalid.`);
        }
        const quantity = Number(item.quantity || 1);
        const snackPrice = Number(snack.price) * quantity;
        total += snackPrice;

        await BookingSnack.create(
          {
            bookingId: booking.id,
            snackId: snack.id,
            quantity,
            price: snack.price,
          },
          { transaction },
        );
      }
    }

    booking.totalAmount = total;
    await booking.save({ transaction });

    return booking;
  });
};

const confirmPayment = async ({ bookingId, userId, method = "DEMO" }) => {
  return sequelize.transaction(async (transaction) => {
    await cleanupExpiredReservations(transaction);

    const booking = await Booking.findByPk(bookingId, {
      include: [
        {
          model: SeatReservation,
          include: [{ model: Seat }],
        },
        {
          model: Showtime,
          include: [{ model: Movie }, { model: Room }],
        },
        {
          model: BookingSnack,
          include: [{ model: Snack }],
        },
        { model: Ticket },
      ],
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!booking || booking.userId !== userId) {
      throw new ApiError(404, "Booking not found.");
    }

    if (booking.status !== "HOLD") {
      throw new ApiError(400, "Booking cannot be confirmed.");
    }

    if (booking.expiresAt && dayjs(booking.expiresAt).isBefore(dayjs())) {
      throw new ApiError(400, "Booking hold has expired.");
    }

    await SeatReservation.update(
      { status: "BOOKED", expiresAt: null },
      {
        where: { bookingId: booking.id, status: "HELD" },
        transaction,
      },
    );

    booking.status = "CONFIRMED";
    booking.paymentStatus = "PAID";
    booking.expiresAt = null;
    await booking.save({ transaction });

    await Payment.create(
      {
        bookingId: booking.id,
        method,
        status: "SUCCESS",
        transactionRef: `DEMO-${Date.now()}`,
        paidAt: new Date(),
        amount: booking.totalAmount,
      },
      { transaction },
    );

    let ticket = booking.Ticket;
    if (!ticket) {
      const ticketCode = generateTicketCode();
      const qrPayload = {
        ticketCode,
        bookingCode: booking.code,
        movie: booking.Showtime.Movie.title,
        showtime: booking.Showtime.startTime,
        room: booking.Showtime.Room.name,
      };

      const qrCodeData = await QRCode.toDataURL(JSON.stringify(qrPayload));
      ticket = await Ticket.create(
        {
          bookingId: booking.id,
          ticketCode,
          qrCodeData,
          status: "VALID",
        },
        { transaction },
      );
    }

    return {
      booking,
      ticket,
    };
  });
};

const cancelBooking = async ({ bookingId, userId, isAdmin = false }) => {
  return sequelize.transaction(async (transaction) => {
    const booking = await Booking.findByPk(bookingId, {
      include: [{ model: Showtime }],
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!booking || (!isAdmin && booking.userId !== userId)) {
      throw new ApiError(404, "Booking not found.");
    }

    if (booking.status === "CANCELED") {
      return booking;
    }

    if (
      !isAdmin &&
      booking.status === "CONFIRMED" &&
      dayjs(booking.Showtime.startTime).diff(dayjs(), "hour") < 2
    ) {
      throw new ApiError(400, "Too late to cancel booking.");
    }

    booking.status = "CANCELED";
    if (booking.paymentStatus === "PAID") {
      booking.paymentStatus = "REFUNDED";
    }
    booking.expiresAt = null;
    await booking.save({ transaction });

    await SeatReservation.update(
      { status: "CANCELED", expiresAt: null },
      { where: { bookingId: booking.id }, transaction },
    );

    await Ticket.update(
      { status: "CANCELED" },
      { where: { bookingId: booking.id }, transaction },
    );

    return booking;
  });
};

module.exports = {
  holdSeats,
  confirmPayment,
  cancelBooking,
  cleanupExpiredReservations,
};
