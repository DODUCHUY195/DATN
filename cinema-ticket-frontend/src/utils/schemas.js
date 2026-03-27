import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().min(1, "Vui lòng nhập email").email("Email không hợp lệ"),
  password: z.string().min(6, "Mật khẩu tối thiểu 6 ký tự"),
});

export const registerSchema = z.object({
  fullName: z.string().min(2, "Họ tên tối thiểu 2 ký tự"),
  email: z.string().min(1, "Vui lòng nhập email").email("Email không hợp lệ"),
  phone: z.string().optional(),
  password: z.string().min(6, "Mật khẩu tối thiểu 6 ký tự"),
});

export const movieSchema = z.object({
  title: z.string().trim().min(2, "Tên phim tối thiểu 2 ký tự"),
  description: z.string().trim().min(10, "Mô tả tối thiểu 10 ký tự"),
  trailerUrl: z.string().optional(),
  posterUrl: z.string().optional(),
  durationMinutes: z.coerce.number().min(1, "Thời lượng phải lớn hơn 0"),
  releaseDate: z.string().min(1, "Vui lòng chọn ngày phát hành"),
  status: z.enum(["NOW_SHOWING", "COMING_SOON"]),
  posterFile: z.any().optional(),
  trailerFile: z.any().optional(),
});

export const showtimeSchema = z
  .object({
    movieId: z.coerce
      .number({ invalid_type_error: "Vui lòng chọn phim" })
      .min(1, "Vui lòng chọn phim"),
    roomId: z.coerce
      .number({ invalid_type_error: "Vui lòng chọn phòng" })
      .min(1, "Vui lòng chọn phòng"),
    startTime: z.string().min(1, "Vui lòng chọn thời gian bắt đầu"),
    endTime: z.string().min(1, "Vui lòng chọn thời gian kết thúc"),
    basePrice: z.coerce.number().min(1000, "Giá vé tối thiểu 1.000đ"),
    status: z.enum(["ACTIVE", "INACTIVE"]),
  })
  .superRefine((data, ctx) => {
    if (data.startTime && data.endTime) {
      const start = new Date(data.startTime).getTime();
      const end = new Date(data.endTime).getTime();
      if (Number.isFinite(start) && Number.isFinite(end) && end <= start) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["endTime"],
          message: "Thời gian kết thúc phải sau thời gian bắt đầu",
        });
      }
    }
  });
