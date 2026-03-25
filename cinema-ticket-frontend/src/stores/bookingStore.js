import { create } from 'zustand';

export const useBookingStore = create((set) => ({
  selectedMovie: null,
  selectedShowtime: null,
  selectedSeats: [],
  selectedSnacks: [],
  heldBooking: null,
  setSelectedMovie: (movie) => set({ selectedMovie: movie }),
  setSelectedShowtime: (showtime) => set({ selectedShowtime: showtime }),
  setSelectedSeats: (selectedSeats) => set({ selectedSeats }),
  toggleSeat: (seat) =>
    set((state) => {
      const exists = state.selectedSeats.some((item) => item.id === seat.id);
      return {
        selectedSeats: exists
          ? state.selectedSeats.filter((item) => item.id !== seat.id)
          : [...state.selectedSeats, seat],
      };
    }),
  updateSnackQuantity: (snack, quantity) =>
    set((state) => {
      const items = state.selectedSnacks.filter((item) => item.snackId !== snack.id);
      if (quantity > 0) items.push({ snackId: snack.id, name: snack.name, price: snack.price, quantity });
      return { selectedSnacks: items };
    }),
  setHeldBooking: (heldBooking) => set({ heldBooking }),
  resetBooking: () =>
    set({
      selectedMovie: null,
      selectedShowtime: null,
      selectedSeats: [],
      selectedSnacks: [],
      heldBooking: null,
    }),
}));
