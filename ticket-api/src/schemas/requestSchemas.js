const Joi = require("joi");

const common = {
  idParam: {
    id: Joi.number().integer().positive().required(),
  },
};

const authSchemas = {
  register: {
    body: {
      fullName: Joi.string().min(2).max(120).required(),
      email: Joi.string().email().max(160).required(),
      password: Joi.string().min(6).max(100).required(),
      phone: Joi.string().max(20).allow("", null),
    },
  },
  login: {
    body: {
      email: Joi.string().email().max(160).required(),
      password: Joi.string().min(6).max(100).required(),
    },
  },
};

const userSchemas = {
  updateProfile: {
    body: {
      fullName: Joi.string().min(2).max(120).optional(),
      phone: Joi.string().max(20).allow("", null).optional(),
      avatarUrl: Joi.string().uri().max(255).allow("", null).optional(),
    },
  },
};

const movieSchemas = {
  listMovies: {
    query: {
      status: Joi.string().valid("NOW_SHOWING", "COMING_SOON").optional(),
    },
  },
  movieIdParam: {
    params: {
      id: Joi.number().integer().positive().required(),
    },
  },
  listShowtimes: {
    query: {
      date: Joi.date().iso().optional(),
      roomId: Joi.number().integer().positive().optional(),
      movieId: Joi.number().integer().positive().optional(),
      timeSlot: Joi.string()
        .pattern(/^\d{1,2}-\d{1,2}$/)
        .optional(),
    },
  },
};

const bookingSchemas = {
  holdSeats: {
    body: {
      showtimeId: Joi.number().integer().positive().required(),
      seatIds: Joi.array()
        .items(Joi.number().integer().positive())
        .min(1)
        .required(),
      snacks: Joi.array()
        .items(
          Joi.object({
            snackId: Joi.number().integer().positive().required(),
            quantity: Joi.number().integer().min(1).max(20).required(),
          }),
        )
        .optional(),
    },
  },
  confirmPayment: {
    params: common.idParam,
    body: {
      method: Joi.string().valid("DEMO", "CARD", "CASH").optional(),
    },
  },
  bookingIdParam: {
    params: common.idParam,
  },
};

const adminSchemas = {
  userIdParam: {
    params: common.idParam,
  },
  lockUser: {
    params: common.idParam,
    body: {
      isLocked: Joi.boolean().required(),
    },
  },
  createCinema: {
    body: {
      name: Joi.string().min(2).max(120).required(),
      address: Joi.string().min(2).max(255).required(),
    },
  },
  createRoom: {
    body: {
      cinemaId: Joi.number().integer().positive().required(),
      name: Joi.string().min(1).max(80).required(),
      rowCount: Joi.number().integer().min(1).max(50).required(),
      colCount: Joi.number().integer().min(1).max(50).required(),
    },
  },
  configureSeats: {
    params: {
      roomId: Joi.number().integer().positive().required(),
    },
    body: {
      seats: Joi.array()
        .items(
          Joi.object({
            rowLabel: Joi.string().max(4).required(),
            seatNumber: Joi.number().integer().positive().required(),
            type: Joi.string().valid("SINGLE", "COUPLE").optional(),
            isActive: Joi.boolean().optional(),
          }),
        )
        .min(1)
        .required(),
    },
  },
  createShowtime: {
    body: {
      movieId: Joi.number().integer().positive().required(),
      roomId: Joi.number().integer().positive().required(),
      startTime: Joi.date().iso().required(),
      endTime: Joi.date().iso().required(),
      basePrice: Joi.number().min(0).optional(),
      status: Joi.string().valid("ACTIVE", "INACTIVE").optional(),
    },
  },
  updateShowtime: {
    params: common.idParam,
    body: {
      movieId: Joi.number().integer().positive().optional(),
      roomId: Joi.number().integer().positive().optional(),
      startTime: Joi.date().iso().optional(),
      endTime: Joi.date().iso().optional(),
      basePrice: Joi.number().min(0).optional(),
      status: Joi.string().valid("ACTIVE", "INACTIVE").optional(),
    },
  },
  createMovie: {
    body: {
      title: Joi.string().min(1).max(160).required(),
      description: Joi.string().allow("", null).optional(),
      trailerUrl: Joi.string().max(255).allow("", null).optional(),
      posterUrl: Joi.string().max(255).allow("", null).optional(),
      durationMinutes: Joi.number().integer().positive().required(),
      releaseDate: Joi.date().iso().optional(),
      status: Joi.string().valid("NOW_SHOWING", "COMING_SOON").required(),
    },
  },
  updateMovie: {
    params: common.idParam,
    body: {
      title: Joi.string().min(1).max(160).optional(),
      description: Joi.string().allow("", null).optional(),
      trailerUrl: Joi.string().max(255).allow("", null).optional(),
      posterUrl: Joi.string().max(255).allow("", null).optional(),
      durationMinutes: Joi.number().integer().positive().optional(),
      releaseDate: Joi.date().iso().optional(),
      status: Joi.string().valid("NOW_SHOWING", "COMING_SOON").optional(),
    },
  },
};

module.exports = {
  authSchemas,
  userSchemas,
  movieSchemas,
  bookingSchemas,
  adminSchemas,
};
