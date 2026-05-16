const bcrypt = require("bcryptjs");
const dayjs = require("dayjs");
const {
  User,
  Snack,
  Cinema,
  Room,
  Seat,
  Movie,
  Showtime,
} = require("../models");

const createSeatsForRoom = async (roomId, rowCount, colCount) => {
  const rows = [];
  for (let r = 0; r < rowCount; r += 1) {
    const rowLabel = String.fromCharCode(65 + r);
    for (let c = 1; c <= colCount; c += 1) {
      rows.push({
        roomId,
        rowLabel,
        seatNumber: c,
        type: "SINGLE",
      });
    }
  }
  await Seat.bulkCreate(rows);
};

const seedDefaults = async () => {
  const adminEmail = "admin@gmail.com";
  const admin = await User.findOne({ where: { email: adminEmail } });

  if (!admin) {
    const passwordHash = await bcrypt.hash("admin123", 10);
    await User.create({
      fullName: "System Admin",
      email: adminEmail,
      passwordHash,
      role: "ADMIN",
    });
  }

  const snackCount = await Snack.count();
  if (snackCount === 0) {
    await Snack.bulkCreate([
      { name: "Popcorn S", price: 45000 },
      { name: "Popcorn L", price: 65000 },
      { name: "Coke", price: 30000 },
      { name: "Combo 1", price: 90000 },
    ]);
  }

  const cinemaCount = await Cinema.count();
  if (cinemaCount === 0) {
    const cinema = await Cinema.create({
      name: "Galaxy Nguyen Du",
      address: "116 Nguyen Du, Quan 1, TP.HCM",
    });

    const roomA = await Room.create({
      cinemaId: cinema.id,
      name: "Room A",
      rowCount: 8,
      colCount: 12,
    });

    const roomB = await Room.create({
      cinemaId: cinema.id,
      name: "Room B",
      rowCount: 10,
      colCount: 14,
    });

    await createSeatsForRoom(roomA.id, roomA.rowCount, roomA.colCount);
    await createSeatsForRoom(roomB.id, roomB.rowCount, roomB.colCount);
  }

  const movieCount = await Movie.count();
  if (movieCount === 0) {
    await Movie.bulkCreate([
      {
        title: "Avengers: Infinity War",
        description:
          "Nhom Avengers doi dau voi Thanos trong cuoc chien vo cuc.",
        trailerUrl: "https://www.youtube.com/watch?v=6ZfuNTqbHE8",
        durationMinutes: 149,
        releaseDate: "2018-04-27",
        status: "NOW_SHOWING",
      },
      {
        title: "Dune: Part Two",
        description:
          "Hanh trinh cua Paul Atreides tiep tuc tren hanh tinh Arrakis.",
        trailerUrl: "https://www.youtube.com/watch?v=Way9Dexny3w",
        durationMinutes: 166,
        releaseDate: "2024-03-01",
        status: "NOW_SHOWING",
      },
      {
        title: "Inside Out 2",
        description: "Riley buoc vao tuoi teen voi nhung cam xuc moi.",
        trailerUrl: "https://www.youtube.com/watch?v=LEjhY15eCx0",
        durationMinutes: 96,
        releaseDate: "2024-06-14",
        status: "COMING_SOON",
      },
      {
        title: "Deadpool & Wolverine",
        description: "Bo doi Marvel gay bao phong ve voi nhieu bat ngo.",
        trailerUrl: "https://www.youtube.com/watch?v=73_1biulkYk",
        durationMinutes: 127,
        releaseDate: "2024-07-26",
        status: "COMING_SOON",
      },
    ]);
  }

  const showtimeCount = await Showtime.count();
  if (showtimeCount === 0) {
    const nowShowingMovies = await Movie.findAll({
      where: { status: "NOW_SHOWING" },
    });
    const rooms = await Room.findAll({ order: [["id", "ASC"]] });

    if (nowShowingMovies.length > 0 && rooms.length > 0) {
      const baseStart = dayjs()
        .add(1, "day")
        .hour(9)
        .minute(0)
        .second(0)
        .millisecond(0);
      const showtimes = [];

      for (let dayOffset = 0; dayOffset < 3; dayOffset += 1) {
        for (let roomIndex = 0; roomIndex < rooms.length; roomIndex += 1) {
          const room = rooms[roomIndex];
          for (let slot = 0; slot < 3; slot += 1) {
            const movie =
              nowShowingMovies[(roomIndex + slot) % nowShowingMovies.length];
            const start = baseStart
              .add(dayOffset, "day")
              .add(roomIndex * 20, "minute")
              .add(slot * 240, "minute");
            const end = start.add(movie.durationMinutes, "minute");

            showtimes.push({
              movieId: movie.id,
              roomId: room.id,
              startTime: start.toDate(),
              endTime: end.toDate(),
              basePrice: 90000 + slot * 10000,
              status: "ACTIVE",
            });
          }
        }
      }

      await Showtime.bulkCreate(showtimes);
    }
  }
};

module.exports = {
  seedDefaults,
};
