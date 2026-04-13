import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import AdminLayout from "./components/layout/AdminLayout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import TrekManagement from "./pages/TrekManagement";
import EnrollmentManagement from "./pages/EnrollmentManagement";
import CategoryManagement from "./pages/CategoryManagement";
import GalleryManagement from "./pages/GalleryManagement";
import ReviewManagement from "./pages/ReviewManagement";
import Inquiries from "./pages/Inquiries";
import AdminSettings from "./pages/AdminSettings";
import SiteContent from "./pages/SiteContent";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<AdminLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/treks" element={<TrekManagement />} />
            <Route path="/enrollments" element={<EnrollmentManagement />} />
            <Route path="/categories" element={<CategoryManagement />} />
            <Route path="/gallery" element={<GalleryManagement />} />
            <Route path="/reviews" element={<ReviewManagement />} />
            <Route path="/inquiries" element={<Inquiries />} />
            <Route path="/site-content" element={<SiteContent />} />
            <Route path="/settings" element={<AdminSettings />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
