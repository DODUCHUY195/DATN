const calculateSeatPrice = (basePrice, seatType, seatCustomPrice) => {
  const base = Number(basePrice) || 0;

  // Ghế đôi luôn tính theo hệ số 1.8 của giá gốc showtime (tức mỗi ghế trong cặp là 0.9), không cho phép set giá riêng
  if (seatType === "COUPLE") {
    return Math.round(base * 0.9);
  }

  // Ghế đơn mới được phép có giá riêng
  if (seatCustomPrice != null && seatCustomPrice !== "") {
    const custom = Number(seatCustomPrice);
    if (!Number.isNaN(custom) && custom >= 0) {
      return custom;
    }
  }

  return base;
};

module.exports = { calculateSeatPrice };
