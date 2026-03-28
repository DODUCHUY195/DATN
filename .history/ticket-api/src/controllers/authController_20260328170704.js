const bcrypt = require("bcryptjs");
const { User } = require("../models");
const ApiError = require("../utils/apiError");
const { signToken } = require("../utils/jwt");

const register = async (req, res) => {
  const { fullName, email, password, phone } = req.body;

  if (!fullName || !email || !password) {
    throw new ApiError(400, "fullName, email và password là bắt buộc.");
  }

  const existingUser = await User.findOne({ where: { email } });
  if (existingUser) {
    throw new ApiError(409, "email đã tồn tại.");
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({
    fullName,
    email,
    passwordHash,
    phone: phone || null,
    role: "USER",
  });

  return res.status(201).json({
    message: "Register successfully.",
    data: {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
    },
  });
};

const login = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ where: { email } });
  if (!user) {
    throw new ApiError(401, "Email hoặc mật khẩu không hợp lệ.");
  }

  if (user.isLocked) {
    throw new ApiError(403, "Tài khoản đã bị khoá.");
  }

  const isValid = await bcrypt.compare(password || "", user.passwordHash);
  if (!isValid) {
    throw new ApiError(401, "Email or password is invalid.");
  }

  const token = signToken(user);

  return res.json({
    message: "Login successfully.",
    data: {
      accessToken: token,
      tokenType: "Bearer",
      note: "Swagger Authorize: dan token raw, khong them chu Bearer.",
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
      },
    },
  });
};

const logout = async (req, res) => {
  return res.json({ message: "Logout successfully (stateless JWT demo)." });
};

module.exports = {
  register,
  login,
  logout,
};
