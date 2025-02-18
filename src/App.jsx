import { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import SkeletonLoader from "components/general/SkeletonLoader.jsx";
import NotFound from "components/general/NotFound.jsx";
import PrivateRoute from "components/general/ProtectedRoute.jsx"


const Signin = lazy(() => import("components/general/Signin.jsx"));
const Shopstock = lazy(() => import("components/screens/Shopstock.jsx"));
const AddScreen = lazy(() => import("components/screens/AddScreenModal.jsx"));
const SavedOrders = lazy(() => import("components/unpaid/SavedOrders.jsx"));
const Accessories = lazy(() => import("components/accessories/Accessories.jsx"));
const AddAccesory = lazy(() => import("components/accessories/AddAccesoryModal.jsx"));
const LowStock = lazy(() => import("components/general/LowStock.jsx"));

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

                    {
                        /*
                        * mount only when users need help registering new passkeys
                        * <Route
                        path="/passkeys"
                        element={
                                <AdminPasskeyManager />
                        }
                    />
                        *
                        * */
                    }
                </Routes>
            </Suspense>
        </Router>
    );
}
export default App