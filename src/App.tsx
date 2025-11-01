import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route } from "react-router-dom"; // ✅ Changed BrowserRouter → HashRouter
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedAdminRoute } from "@/components/ProtectedAdminRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import OrganizationRegister from "./pages/OrganizationRegister";
import OrganizationAuth from "./pages/OrganizationAuth";
import OrganizationProfile from "./pages/OrganizationProfile";
import RecruiterDashboard from "./pages/RecruiterDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        {/* ✅ Use HashRouter instead of BrowserRouter */}
        <HashRouter basename="/">
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/recruiter/auth" element={<OrganizationAuth />} />
            <Route
              path="/recruiter/register"
              element={<OrganizationRegister />}
            />
            <Route
              path="/recruiter/profile"
              element={<OrganizationProfile />}
            />
            <Route
              path="/recruiter/dashboard"
              element={<RecruiterDashboard />}
            />
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedAdminRoute>
                  <AdminDashboard />
                </ProtectedAdminRoute>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </HashRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
