import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { AdminRouteGuard } from "./components/AdminRouteGuard";
import { AdminLayout } from "./components/AdminLayout";
import Dashboard from "./pages/Dashboard";
import Forms from "./pages/Forms";
import CreateForm from "./pages/CreateForm";
import EditForm from "./pages/EditForm";
import Results from "./pages/Results";
import PublicSurvey from "./pages/public/PublicSurvey";
import ThankYou from "./pages/ThankYou";
import Theme from "./pages/Theme";
import Settings from "./pages/Settings";
import AdminLogin from "./pages/AdminLogin";
import Home from "./pages/Home";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public routes - no authentication required */}
            <Route path="/" element={<Home />} />
            <Route path="/pesquisa/:id" element={<PublicSurvey />} />
            <Route path="/obrigado" element={<ThankYou />} />
            <Route path="/tema" element={<Theme />} />
            
            {/* Admin authentication */}
            <Route path="/admin/login" element={<AdminLogin />} />
            
            {/* Protected admin routes */}
            <Route path="/admin" element={
              <AdminRouteGuard>
                <AdminLayout />
              </AdminRouteGuard>
            }>
              <Route index element={<Dashboard />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="forms" element={<Forms />} />
              <Route path="forms/create" element={<CreateForm />} />
              <Route path="forms/:id/edit" element={<EditForm />} />
              <Route path="results" element={<Results />} />
              <Route path="settings" element={<Settings />} />
            </Route>
            
            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
