import { useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import ChristmasTree from "./pages/ChristmasTree";
import NotFound from "./pages/NotFound";
import { CookieProvider } from "./contexts/CookieContext";


const queryClient = new QueryClient();



const App = () => (
  <QueryClientProvider client={queryClient}>
    <CookieProvider>
      <TooltipProvider>
        <Helmet>
          <title>Купить Flash USDT TRC20 | GitCrypto - Флеш USDT криптовалюта</title>
          <meta name="description" content="Купить Flash USDT TRC20 - надежная платформа GitCrypto для покупки флеш криптовалюты. Смарт-контракты на блокчейне TRON, безопасные транзакции. Flash токены USDT TRC20 с мгновенной отправкой. Форум криптосообщества и плагины для разработчиков" />
        </Helmet>

        <Toaster />
        <Sonner />
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/christmas-tree" element={<ChristmasTree />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </CookieProvider>
  </QueryClientProvider>
);

export default App;