import { useEffect } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const CRYPTO_CHECKER_URL = 'https://functions.poehali.dev/c6ecf062-a0e0-47bd-8e8e-694cf7eb952b';

const CryptoChecker = () => {
  useEffect(() => {
    const checkPendingPayments = async () => {
      try {
        await fetch(CRYPTO_CHECKER_URL);
      } catch (error) {
        console.error('Error checking crypto payments:', error);
      }
    };

    checkPendingPayments();
    const interval = setInterval(checkPendingPayments, 30000);

    return () => clearInterval(interval);
  }, []);

  return null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <CryptoChecker />
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;