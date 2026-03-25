import { api } from './client';

export const authApi = {
  register: (payload) => api.post('/auth/register', payload),
  login: (payload) => api.post('/auth/login', payload),
  logout: () => api.post('/auth/logout'),
};

export const usersApi = {
  me: () => api.get('/users/me'),
  updateMe: (payload) => api.put('/users/me', payload),
  bookings: () => api.get('/users/me/bookings'),
  history: () => api.get('/users/me/history'),
};

export const moviesApi = {
  list: (params) => api.get('/movies', { params }),
  detail: (id) => api.get(`/movies/${id}`),
};

export const showtimesApi = {
  list: (params) => api.get('/showtimes', { params }),
  seats: (id) => api.get(`/showtimes/${id}/seats`),
};

export const snacksApi = {
  list: () => api.get('/snacks'),
};

export const bookingsApi = {
  hold: (payload) => api.post('/bookings/hold', payload),
  confirmPayment: (id, payload) => api.post(`/bookings/${id}/confirm-payment`, payload),
  detail: (id) => api.get(`/bookings/${id}`),
  cancel: (id) => api.patch(`/bookings/${id}/cancel`),
};

export const adminApi = {
  users: () => api.get('/admin/users'),
  lockUser: (id, payload) => api.patch(`/admin/users/${id}/lock`, payload),
  movies: () => api.get('/admin/movies'),
  createMovie: (payload) => api.post('/admin/movies', payload, { headers: { 'Content-Type': 'multipart/form-data' } }),
  updateMovie: (id, payload) => api.put(`/admin/movies/${id}`, payload, { headers: { 'Content-Type': 'multipart/form-data' } }),
  deleteMovie: (id) => api.delete(`/admin/movies/${id}`),
  cinemas: () => api.get('/admin/cinemas'),
  createCinema: (payload) => api.post('/admin/cinemas', payload),
  rooms: () => api.get('/admin/rooms'),
  createRoom: (payload) => api.post('/admin/rooms', payload),
  configureSeats: (roomId, payload) => api.post(`/admin/rooms/${roomId}/seats/configure`, payload),
  showtimes: () => api.get('/admin/showtimes'),
  createShowtime: (payload) => api.post('/admin/showtimes', payload),
  updateShowtime: (id, payload) => api.put(`/admin/showtimes/${id}`, payload),
  deleteShowtime: (id) => api.delete(`/admin/showtimes/${id}`),
  bookings: () => api.get('/admin/bookings'),
  confirmBooking: (id) => api.patch(`/admin/bookings/${id}/confirm`),
  cancelBooking: (id) => api.patch(`/admin/bookings/${id}/cancel`),
  dashboard: () => api.get('/admin/dashboard'),
};
