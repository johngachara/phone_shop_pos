import { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import SkeletonLoader from "components/SkeletonLoader.jsx";
import NotFound from "components/NotFound.jsx";
import PrivateRoute from "components/ProtectedRoute.jsx"

// Lazy load components (unchanged)
const Signin = lazy(() => import("./components/Signin"));
const Shopstock = lazy(() => import("components/screens/Shopstock.jsx"));
const AddScreen = lazy(() => import("components/screens/AddScreenModal.jsx"));
const SavedOrders = lazy(() => import("components/unpaid/SavedOrders.jsx"));
const Accessories = lazy(() => import("components/accessories/Accessories.jsx"));
const AddAccesory = lazy(() => import("components/accessories/AddAccesoryModal.jsx"));
const LowStock = lazy(() => import("./components/LowStock"));

function App() {
    return (
        <Router basename='/'>
            <Suspense fallback={<SkeletonLoader />}>
                <Routes>
                    {/* Public route */}
                    <Route path="/Login" element={<Signin />} />

                    {/* Protected routes */}
                    <Route path="/" element={
                        <PrivateRoute>
                            <Shopstock />
                        </PrivateRoute>
                    } />
                    <Route path="/AddScreen" element={
                        <PrivateRoute>
                            <AddScreen />
                        </PrivateRoute>
                    } />
                    <Route path="/SavedOrders" element={
                        <PrivateRoute>
                            <SavedOrders />
                        </PrivateRoute>
                    } />
                    <Route path="/Add" element={
                        <PrivateRoute>
                            <AddAccesory />
                        </PrivateRoute>
                    } />
                    <Route path='/Accessories' element={
                        <PrivateRoute>
                            <Accessories />
                        </PrivateRoute>
                    } />
                    <Route path='/LowStock' element={
                        <PrivateRoute>
                            <LowStock />
                        </PrivateRoute>
                    } />
                    <Route path="*" element={<NotFound />} />
                </Routes>
            </Suspense>
        </Router>
    );
}
export default App