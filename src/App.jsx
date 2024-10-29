import  { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import SkeletonLoader from "components/SkeletonLoader.jsx";
import NotFound from "components/NotFound.jsx";



// Lazy load all route components
const Signin = lazy(() => import("./components/Signin"));
const Shopstock = lazy(() => import("components/screens/Shopstock.jsx"));
const AddScreen = lazy(() => import("components/screens/AddScreenModal.jsx"));
const SavedOrders = lazy(() => import("components/unpaid/SavedOrders.jsx"));
const Accessories = lazy(() => import("components/accessories/Accessories.jsx"));
const AddAccesory = lazy(() => import("components/accessories/AddAccesoryModal.jsx"));
const Dashboard = lazy(() => import("./components/Dashboard"));
const DetailedDataView = lazy(() => import("./components/DetailedDataView"));
const LowStock = lazy(() => import("./components/LowStock"));
function App() {
    return (
        <Router basename='/'>
            <Suspense fallback={<SkeletonLoader />}>
                <Routes>
                    <Route path="/" element={<Shopstock />} />
                    <Route path="/Login" element={<Signin />} />
                    <Route path="/AddScreen" element={<AddScreen />} />
                    <Route path="/SavedOrders" element={<SavedOrders />} />
                    {/*
                    <Route path="/Accessories" element={<Accessories />} />
                    */}
                    <Route path="/Add" element={<AddAccesory />} />
                    <Route path="/Admin" element={<Dashboard />} />
                    <Route path="/detailed" element={<DetailedDataView />} />
                    <Route path='/LowStock' element={<LowStock />} />
                    <Route path="*" element={<NotFound />} />
                </Routes>
            </Suspense>
        </Router>
    );
}

export default App;