import { Navigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import authService from '../axios/authService.js';
import sequalizerAuth from '../axios/sequalizerAuth.js';
import { auth } from '../firebase/firebase.js';
import { onAuthStateChanged } from 'firebase/auth';
import SkeletonLoader from "components/general/SkeletonLoader.jsx";
import {tokenCleanup} from "components/axios/tokenCleanup.js";

const PrivateRoute = ({ children }) => {
    const [authState, setAuthState] = useState({
        isChecking: true,
        isAuthenticated: false
    });
    const location = useLocation();

    const refreshTokens = async () => {
        try {
            await Promise.all([
                authService.refreshAuth(),
                sequalizerAuth.refreshAuth()
            ]);
            return true;
        } catch (error) {
            console.error('Token refresh failed:', error);
            return false;
        }
    };

    const validateTokens = async () => {
        try {
            const [mainToken, sequalToken] = await Promise.all([
                authService.getAccessToken(),
                sequalizerAuth.getAccessToken()
            ]);

            if (!mainToken || !sequalToken) {
                // Try to refresh tokens if either is missing
                const refreshSuccess = await refreshTokens();
                if (!refreshSuccess) {
                    return false;
                }

                // Verify tokens again after refresh
                const [newMainToken, newSequalToken] = await Promise.all([
                    authService.getAccessToken(),
                    sequalizerAuth.getAccessToken()
                ]);

                return Boolean(newMainToken && newSequalToken);
            }

            return true;
        } catch (error) {
            console.error('Token validation failed:', error);
            return false;
        }
    };

    useEffect(() => {
        let unsubscribe;
        let tokenCheckInterval;

        const checkAuthentication = async () => {
            try {
                unsubscribe = onAuthStateChanged(auth, async (user) => {
                    if (!user) {
                        setAuthState({
                            isChecking: false,
                            isAuthenticated: false
                        });
                        return;
                    }

                    const isValid = await validateTokens();
                    setAuthState({
                        isChecking: false,
                        isAuthenticated: isValid
                    });

                    // Set up periodic token validation
                    if (isValid) {
                        tokenCheckInterval = setInterval(async () => {
                            const stillValid = await validateTokens();
                            if (!stillValid) {
                                setAuthState({
                                    isChecking: false,
                                    isAuthenticated: false
                                });
                                clearInterval(tokenCheckInterval);
                            }
                        }, 5 * 60 * 1000); // Check every 5 minutes
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
        // periodic cleanup
        const cleanupInterval = setInterval(() => {
            tokenCleanup.performFullCleanup();
        }, 30 * 60 * 1000); // Run every 30 minutes

        checkAuthentication();

        return () => {
            if (unsubscribe) {
                unsubscribe();
            }
            if (tokenCheckInterval) {
                clearInterval(tokenCheckInterval);
            }
            clearInterval(cleanupInterval); // Clear cleanup interval
        };
    }, []);

    if (authState.isChecking) {
        return <SkeletonLoader />;
    }

    if (!authState.isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return children;
};

export default PrivateRoute;