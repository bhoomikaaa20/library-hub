import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/integrations/supabase/auth";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import StudentBooks from "./pages/student/Books";
import StudentHistory from "./pages/student/History";
import LibrarianBooks from "./pages/librarian/BooksManagement";
import LibrarianDetails from "./pages/librarian/Details";
import LibrarianRequests from "./pages/librarian/RequestHandler";

const queryClient = new QueryClient();

// Protected route wrapper
function ProtectedRoute({ children, allowedRole }: { children: React.ReactNode; allowedRole: 'student' | 'librarian' }) {
  const { user, userRole, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (userRole !== allowedRole) {
    return <Navigate to={userRole === 'student' ? '/student/books' : '/librarian/books'} replace />;
  }

  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            
            {/* Student routes */}
            <Route
              path="/student/books"
              element={
                <ProtectedRoute allowedRole="student">
                  <StudentBooks />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/history"
              element={
                <ProtectedRoute allowedRole="student">
                  <StudentHistory />
                </ProtectedRoute>
              }
            />
            
            {/* Librarian routes */}
            <Route
              path="/librarian/books"
              element={
                <ProtectedRoute allowedRole="librarian">
                  <LibrarianBooks />
                </ProtectedRoute>
              }
            />
            <Route
              path="/librarian/details"
              element={
                <ProtectedRoute allowedRole="librarian">
                  <LibrarianDetails />
                </ProtectedRoute>
              }
            />
            <Route
              path="/librarian/requests"
              element={
                <ProtectedRoute allowedRole="librarian">
                  <LibrarianRequests />
                </ProtectedRoute>
              }
            />
            
            {/* Catch-all routes */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
