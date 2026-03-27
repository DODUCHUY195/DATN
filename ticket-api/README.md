# Cinema Ticket API (Node.js + MySQL + Swagger)

Backend API dat ve xem phim voi cac module user/admin, su dung:

- Node.js + Express
- MySQL + Sequelize
- JWT Auth
- Swagger UI

## 1) Cai dat

```bash
npm install
copy .env.example .env
# Sua thong tin DB trong .env
npm run db:migrate
npm run dev
```

Swagger: `http://localhost:3000/api-docs`

Tai khoan admin mac dinh (tu dong seed):

- Email: `admin@gmail.com`
- Password: `admin123`

Du lieu mau cung duoc seed tu dong khi chay server lan dau:

- 1 rap phim, 2 phong chieu
- seat layout (ghe SINGLE + COUPLE)
- 4 phim mau
- lich chieu mau cho 3 ngay tiep theo
- menu bong nuoc/combo

## 1.1) Migration MySQL

Project da co migration runner bang Umzug.

Len migration moi:

```bash
npm run db:migrate
```

Xem trang thai migration:

```bash
npm run db:migrate:status
```

Rollback 1 migration gan nhat:

```bash
npm run db:migrate:undo
```

Migration da them file:

- `src/db/migrations/202603230001-add-missing-columns.js`

Migration nay dung de cap nhat cac cot moi vao MySQL (vi du: `avatarUrl`, `trailerUrl`, `expiresAt`, `paymentStatus`, ...).

Luu y:

- `DB_SYNC_ON_START=true` (mac dinh) de khoi dong nhanh tren local.
- Khi deploy production, nen dat `DB_SYNC_ON_START=false` va chi dung migration.

## 2) Chuc nang da co

### USER

- Dang ky / dang nhap / dang xuat (demo)
- Xem va cap nhat profile
- Xem phim dang chieu / sap chieu, chi tiet phim
- Xem lich chieu theo ngay, phong, khung gio
- Xem seat map (ghe AVAILABLE/HELD/BOOKED)
- Xem danh sach bong nuoc/combo
- Dat ghe tam thoi (`hold`) voi timeout 5-10 phut
- Chot thanh toan demo, tao ma ve + QR code
- Xem ve da dat, lich su dat ve, huy ve

### ADMIN

- CRUD phim (co upload poster)
- Quan ly rap, phong, seat layout
- Quan ly suat chieu + chan trung lich phong
- Quan ly booking (xem danh sach, confirm, cancel)
- Quan ly user (xem danh sach, khoa/mo khoa)
- Dashboard (tong ve ban, doanh thu, suat chieu pho bien)

## 2.1) Validate request + response format chuan

Da them validate dau vao bang Joi cho cac route chinh:

- Auth: register/login
- User: update profile
- Movie/Showtime: query + params
- Booking: hold/confirm/cancel/detail
- Admin: lock user, cinema/room/seat/showtime CRUD chinh, booking actions

Response duoc chuan hoa theo format:

```json
{
  "success": true,
  "message": "...",
  "data": {}
}
```

Khi loi:

```json
{
  "success": false,
  "message": "Validation error.",
  "errors": ["..."]
}
```

## 3) Logic quan trong

- Chong dat trung ghe:
  - Bang `seat_reservations` co unique `(showtimeId, seatId)`
  - Kiem tra va lock bang transaction truoc khi tao hold
- Giu ghe tam thoi:
  - `Booking.status = HOLD`, `expiresAt`
  - Qua han se chuyen `EXPIRED` khi co request moi
- Thanh toan demo:
  - Xac nhan booking => chuyen ghe `HELD -> BOOKED`
  - Tao `payments` + `ticket` + `qrCodeData`

## 4) Cau truc chinh

- `src/models/index.js`: model + associations
- `src/services/bookingService.js`: hold/confirm/cancel logic
- `src/services/bootstrapService.js`: seed du lieu mau
- `src/middlewares/validate.js`: Joi validation middleware
- `src/middlewares/responseFormatter.js`: chuan hoa response JSON
- `src/routes/*.js`: API routes + swagger annotations
- `src/docs/swagger.js`: cau hinh OpenAPI
- `src/db/migrate.js`: lenh chay migration
- `src/db/migrations/*.js`: cac file migration

## 5) API nhanh

- Auth: `/api/auth/*`
- User: `/api/users/*`
- Movies: `/api/movies/*`
- Showtimes: `/api/showtimes/*`
- Snacks: `/api/snacks`
- Bookings: `/api/bookings/*`
- Admin: `/api/admin/*`
