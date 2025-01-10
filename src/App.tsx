import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { SessionContextProvider } from '@supabase/auth-helpers-react';
import { useState, useEffect } from 'react';
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import SignUp from "./pages/SignUp";
import Module from "./pages/Module";
import GeneratedLesson from "./pages/GeneratedLesson";
import { supabase } from "@/integrations/supabase/client";

const queryClient = new QueryClient();

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session);
    });
  }, []);

  if (isAuthenticated === null) {
    return <div>Loading...</div>;
  }

  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <SessionContextProvider supabaseClient={supabase}>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <Routes>
              <Route
                path="/"
                element={
                  isAuthenticated ? (
                    <Navigate to="/dashboard" replace />
                  ) : (
                    <Index />
                  )
                }
              />
              <Route
                path="/dashboard"
                element={
                  isAuthenticated ? (
                    <Dashboard />
                  ) : (
                    <Navigate to="/" replace />
                  )
                }
              />
              <Route
                path="/signup"
                element={
                  isAuthenticated ? (
                    <Navigate to="/dashboard" replace />
                  ) : (
                    <SignUp />
                  )
                }
              />
              <Route
                path="/module/:moduleId"
                element={
                  isAuthenticated ? (
                    <Module />
                  ) : (
                    <Navigate to="/" replace />
                  )
                }
              />
              <Route
                path="/generated-lesson/:lessonId"
                element={
                  isAuthenticated ? (
                    <GeneratedLesson />
                  ) : (
                    <Navigate to="/" replace />
                  )
                }
              />
            </Routes>
          </TooltipProvider>
        </SessionContextProvider>
      </QueryClientProvider>
    </BrowserRouter>
  );
}

export default App;