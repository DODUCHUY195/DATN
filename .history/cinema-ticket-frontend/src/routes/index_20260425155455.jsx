import { Navigate, Route, Routes } from "react-router-dom";
import AuthLayout from "../layouts/AuthLayout";
import MainLayout from "../layouts/MainLayout";
import AdminLayout from "../layouts/AdminLayout";
import { AdminRoute, ProtectedRoute } from "./guards";
import LoginPage from "../pages/auth/LoginPage";
import RegisterPage from "../pages/auth/RegisterPage";
import HomePage from "../pages/user/HomePage";
import MoviesPage from "../pages/user/MoviesPage";
import MovieDetailPage from "../pages/user/MovieDetailPage";
import ShowtimesPage from "../pages/user/ShowtimesPage";
import BookingFlowPage from "../pages/user/BookingFlowPage";
import ProfilePage from "../pages/user/ProfilePage";
import MyBookingsPage from "../pages/user/MyBookingsPage";
import HistoryPage from "../pages/user/HistoryPage";
import AdminDashboardPage from "../pages/admin/AdminDashboardPage";
import AdminMoviesPage from "../pages/admin/AdminMoviesPage";
import AdminCinemasPage from "../pages/admin/AdminCinemasPage";
import AdminShowtimesPage from "../pages/admin/AdminShowtimesPage";
import AdminBookingsPage from "../pages/admin/AdminBookingsPage";
import AdminUsersPage from "../pages/admin/AdminUsersPage";
import AdminAccessPage from "../pages/admin/AdminAccessPage";
import BookingDetailPage from "../pages/user/BookingDetailPage";

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
          <Route path="/my-bookings/:id" element={<BookingDetailPage />} />
          <Route path="/history" element={<HistoryPage />} />
        </Route>

        <Route element={<AdminRoute />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboardPage />} />
            <Route path="movies" element={<AdminMoviesPage />} />
            <Route path="cinemas" element={<AdminCinemasPage />} />
            <Route path="showtimes" element={<AdminShowtimesPage />} />
            <Route path="bookings" element={<AdminBookingsPage />} />
            <Route path="users" element={<AdminUsersPage />} />
            <Route path="access" element={<AdminAccessPage />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
