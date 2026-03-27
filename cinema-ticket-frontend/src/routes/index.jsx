import { Navigate, Route, Routes } from 'react-router-dom';
import AuthLayout from '../layouts/AuthLayout';
import MainLayout from '../layouts/MainLayout';
import {  ProtectedRoute } from './guards';
import LoginPage from '../pages/auth/LoginPage';
import RegisterPage from '../pages/auth/RegisterPage';
import HomePage from '../pages/user/HomePage';
import MoviesPage from '../pages/user/MoviesPage';
import MovieDetailPage from '../pages/user/MovieDetailPage';
import ShowtimesPage from '../pages/user/ShowtimesPage';
import BookingFlowPage from '../pages/user/BookingFlowPage';
import ProfilePage from '../pages/user/ProfilePage';
import MyBookingsPage from '../pages/user/MyBookingsPage';
import HistoryPage from '../pages/user/HistoryPage';

export function RouterProvider() {
  return (
    <Routes>
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      <Route element={<MainLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/movies" element={<MoviesPage />} />
        <Route path="/movies/:id" element={<MovieDetailPage />} />
        <Route path="/showtimes" element={<ShowtimesPage />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/booking/:showtimeId" element={<BookingFlowPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/bookings" element={<MyBookingsPage />} />
          <Route path="/history" element={<HistoryPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
