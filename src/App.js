import "./App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";

import Home from "./pages/Home";
import Booking from "./pages/Booking";
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentCancel from "./pages/PaymentCancel";

import AdminLogin from "./pages/admin/Login";
import AdminLayout from "./pages/admin/Layout";
import AdminOverview from "./pages/admin/Overview";
import AdminBookings from "./pages/admin/Bookings";
import AdminInbox from "./pages/admin/Inbox";
import AdminCRM from "./pages/admin/CRM";
import AdminMarketing from "./pages/admin/Marketing";
import AdminSettings from "./pages/admin/Settings";
import AdminGallery from "./pages/admin/Gallery"; // Import della nuova pagina

function RequireAuth({ children }) {
    const token = localStorage.getItem("lv_admin_token");
    if (!token) return <Navigate to="/admin/login" replace />;
    return children;
}

function App() {
    return (
        <div className="App">
            <Toaster position="top-right" richColors />
            <BrowserRouter>
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/book" element={<Booking />} />
                    <Route path="/payment/success" element={<PaymentSuccess />} />
                    <Route path="/payment/cancel" element={<PaymentCancel />} />

                    <Route path="/admin/login" element={<AdminLogin />} />
                    <Route
                        path="/admin"
                        element={
                            <RequireAuth>
                                <AdminLayout />
                            </RequireAuth>
                        }
                    >
                        <Route index element={<AdminOverview />} />
                        <Route path="bookings" element={<AdminBookings />} />
                        <Route path="inbox" element={<AdminInbox />} />
                        <Route path="crm" element={<AdminCRM />} />
                        <Route path="marketing" element={<AdminMarketing />} />
                        <Route path="gallery" element={<AdminGallery />} /> {/* Nuova rotta */}
                        <Route path="settings" element={<AdminSettings />} />
                    </Route>
                </Routes>
            </BrowserRouter>
        </div>
    );
}

export default App;
