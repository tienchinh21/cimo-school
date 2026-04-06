import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'sonner';
import App from './App';
import './index.css';
import { queryClient } from './lib/query-client';
import { ConfirmDialogProvider } from './components/ui/confirm-dialog-provider';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ConfirmDialogProvider>
        <BrowserRouter>
          <App />
          <Toaster richColors position='top-right' />
        </BrowserRouter>
      </ConfirmDialogProvider>
    </QueryClientProvider>
  </StrictMode>
);
