import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import NotFound from "components/general/NotFound.jsx";
import PrivateRoute from "components/general/ProtectedRoute.jsx";
import Signin from "components/general/Signin.jsx";
import Shopstock from "components/screens/Shopstock.jsx";
import AddScreen from "components/screens/AddScreenModal.jsx";
import SavedOrders from "components/unpaid/SavedOrders.jsx";
import Accessories from "components/accessories/Accessories.jsx";
import AddAccesory from "components/accessories/AddAccesoryModal.jsx";
import LowStock from "components/general/LowStock.jsx";

function App() {
    return (
        <Router basename='/'>
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
        </Router>
    );
}

export default App;