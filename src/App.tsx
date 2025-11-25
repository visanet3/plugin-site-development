import { useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const CRYPTO_CHECKER_URL = 'https://functions.poehali.dev/c6ecf062-a0e0-47bd-8e8e-694cf7eb952b';
const ROLE_UPDATER_URL = 'https://functions.poehali.dev/c31a74a8-f1ec-40ca-8eda-a5dce42fc8dc';

const CryptoChecker = () => {
  useEffect(() => {
    const checkPendingPayments = async () => {
      try {
        const response = await fetch(CRYPTO_CHECKER_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
        if (!response.ok) {
          console.warn('Crypto checker service unavailable');
        }
      } catch (error) {
        // Silently handle connection errors for background task
      }
    };

    const updateUserRoles = async () => {
      try {
        await fetch(ROLE_UPDATER_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (error) {
        // Silently handle connection errors for background task
      }
    };

    checkPendingPayments();
    updateUserRoles();
  }, []);

  return null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Helmet>
        <title>Купить Flash USDT TRC20 | GitCrypto - Флеш USDT криптовалюта</title>
        <meta name="description" content="Купить Flash USDT TRC20 - надежная платформа GitCrypto для покупки флеш криптовалюты. Смарт-контракты на блокчейне TRON, безопасные транзакции. Flash токены USDT TRC20 с мгновенной отправкой. Форум криптосообщества и плагины для разработчиков" />
      </Helmet>
      <CryptoChecker />
      <Toaster />
      <Sonner />
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;