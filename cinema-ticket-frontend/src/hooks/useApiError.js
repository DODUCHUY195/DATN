export const getApiErrorMessage = (error, fallback = 'Có lỗi xảy ra, vui lòng thử lại.') =>
  error?.response?.data?.message || error?.message || fallback;
