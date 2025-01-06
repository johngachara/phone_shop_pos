import { Navigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import authService from '../components/axios/authService';
import sequalizerAuth from '../components/axios/sequalizerAuth';
import { auth } from '../components/firebase/firebase';
import { onAuthStateChanged } from 'firebase/auth';

const PrivateRoute = ({ children }) => {
    const [authState, setAuthState] = useState({
        isChecking: true,
        isAuthenticated: false
    });
    const location = useLocation();

    useEffect(() => {
        let unsubscribe;

        const checkAuthentication = async () => {
            try {
                // Set up Firebase auth state listener
                unsubscribe = onAuthStateChanged(auth, async (user) => {
                    if (!user) {
                        setAuthState({
                            isChecking: false,
                            isAuthenticated: false
                        });
                        return;
                    }

                    try {
                        // Check both auth tokens
                        const [mainToken, sequalToken] = await Promise.all([
                            authService.getAccessToken(),
                            sequalizerAuth.getAccessToken()
                        ]);

                        setAuthState({
                            isChecking: false,
                            isAuthenticated: Boolean(mainToken && sequalToken)
                        });
                    } catch (error) {
                        console.error('Token validation failed:', error);
                        setAuthState({
                            isChecking: false,
                            isAuthenticated: false
                        });
                    }
                });
            } catch (error) {
                console.error('Auth check failed:', error);
                setAuthState({
                    isChecking: false,
                    isAuthenticated: false
                });
            }
        };

        checkAuthentication();

        return () => {
            if (unsubscribe) {
                unsubscribe();
            }
        };
    }, []);

    // Show loading state while checking authentication
    if (authState.isChecking) {
        return null; // or your loading component
    }

    // Redirect to login if not authenticated
    if (!authState.isAuthenticated) {
        // Save the attempted URL
        return <Navigate to="/Login" state={{ from: location }} replace />;
    }

    // Render the protected content if authenticated
    return children;
};
export default PrivateRoute;