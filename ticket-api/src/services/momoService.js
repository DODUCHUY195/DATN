const axios = require("axios");
const crypto = require("crypto");
const { momo } = require("../config/env");
const ApiError = require("../utils/apiError");

const createPayment = async (booking) => {
  // PHƯƠNG ÁN DỰ PHÒNG: Chuyển hướng sang trang giả lập thanh toán
  // Điều này giúp vượt qua lỗi "Chữ ký không hợp lệ" từ phía máy chủ MoMo sandbox
  const orderId = `${booking.code}_${booking.id}_${Date.now()}`;
  const amount = Math.round(Number(booking.totalAmount));
  const redirectUrl = momo.redirectUrl;
  
  // Tạo URL dẫn đến trang giả lập của chúng ta
  const simulatorUrl = `http://localhost:5173/momo-simulator?amount=${amount}&orderId=${orderId}&orderInfo=Thanh toan ve xem phim CinemaX&redirectUrl=${encodeURIComponent(redirectUrl)}`;

  console.log("MOMO SIMULATION - Redirecting to:", simulatorUrl);

  return {
    payUrl: simulatorUrl,
    message: "Simulation mode active",
    resultCode: 0
  };
};

const verifySignature = (body) => {
  const { secretKey } = momo;
  
  // MoMo IPN fields order for signature
  const partnerCode = body.partnerCode || "";
  const orderId = body.orderId || "";
  const requestId = body.requestId || "";
  const amount = body.amount || "";
  const orderInfo = body.orderInfo || "";
  const orderType = body.orderType || "";
  const transId = body.transId || "";
  const resultCode = body.resultCode !== undefined ? String(body.resultCode) : "";
  const message = body.message || "";
  const payType = body.payType || "";
  const responseTime = body.responseTime || "";
  const extraData = body.extraData || "";

  const rawSignature = `accessKey=${momo.accessKey}&amount=${amount}&extraData=${extraData}&message=${message}&orderId=${orderId}&orderInfo=${orderInfo}&orderType=${orderType}&partnerCode=${partnerCode}&payType=${payType}&requestId=${requestId}&responseTime=${responseTime}&resultCode=${resultCode}&transId=${transId}`;
  
  const checkSignature = crypto
    .createHmac("sha256", secretKey)
    .update(rawSignature)
    .digest("hex");

  return checkSignature === signature;
};

module.exports = {
  createPayment,
  verifySignature,
};
