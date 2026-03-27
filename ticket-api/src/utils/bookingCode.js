const dayjs = require("dayjs");

const randomPart = () => Math.random().toString(36).slice(2, 8).toUpperCase();

const generateBookingCode = () =>
  `BK-${dayjs().format("YYYYMMDDHHmmss")}-${randomPart()}`;
const generateTicketCode = () =>
  `TK-${dayjs().format("YYYYMMDDHHmmss")}-${randomPart()}`;

module.exports = {
  generateBookingCode,
  generateTicketCode,
};
