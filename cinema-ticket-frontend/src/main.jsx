import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App';
import './index.css';
import { queryClient } from './app/queryClient';
import { useThemeStore } from './stores/themeStore';

document.documentElement.classList.toggle('dark', useThemeStore.getState().theme === 'dark');

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
      <Toaster position="top-right" toastOptions={{ duration: 3000, style: { borderRadius: '18px', background: '#0f172a', color: '#f8fafc', border: '1px solid rgba(255,255,255,0.08)' } }} />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  </React.StrictMode>,
);
