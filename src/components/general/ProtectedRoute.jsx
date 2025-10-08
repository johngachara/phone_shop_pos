import { Navigate, useLocation } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
import authService from '../axios/authService.js';
import sequalizerAuth from '../axios/sequalizerAuth.js';
import { auth } from '../firebase/firebase.js';
import { onAuthStateChanged } from 'firebase/auth';
import SkeletonLoader from "components/general/SkeletonLoader.jsx";
import { tokenCleanup } from "components/axios/tokenCleanup.js";

const PrivateRoute = ({ children }) => {
    const [authState, setAuthState] = useState({
        isChecking: true,
        isAuthenticated: false
    });
    const location = useLocation();
    const tokenCheckIntervalRef = useRef(null);
    const cleanupIntervalRef = useRef(null);
    const isInitialMount = useRef(true);
    const lastTokenCheck = useRef(0);

    // Memoize token refresh to prevent duplicate calls
    const refreshTokens = async () => {
        try {
            const results = await Promise.all([
                authService.refreshAuth(),
                sequalizerAuth.refreshAuth()
            ]);
            return results.every(result => result);
        } catch (error) {
            console.error('Token refresh failed:', error);
            return false;
        }
    };

    const validateTokens = async (forceRefresh = false) => {
        // Skip frequent checks (throttle to once per minute)
        const now = Date.now();
        if (!forceRefresh && now - lastTokenCheck.current < 60000) {
            const [mainToken, sequalToken] = await Promise.all([
                authService.getAccessToken(),
                sequalizerAuth.getAccessToken()
            ]);
            return Boolean(mainToken && sequalToken);
        }

        lastTokenCheck.current = now;

        try {
            const [mainToken, sequalToken] = await Promise.all([
                authService.getAccessToken(),
                sequalizerAuth.getAccessToken()
            ]);

            if (!mainToken || !sequalToken || forceRefresh) {
                const refreshSuccess = await refreshTokens();
                if (!refreshSuccess) {
                    console.log('🔴 Token refresh failed - user not authenticated');
                    return false;
                }

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

                    const isValid = await validateTokens(isInitialMount.current);
                    setAuthState({
                        isChecking: false,
                        isAuthenticated: isValid
                    });

                    // Only set up interval if authenticated
                    if (isValid) {
                        if (tokenCheckIntervalRef.current) {
                            clearInterval(tokenCheckIntervalRef.current);
                        }

                        tokenCheckIntervalRef.current = setInterval(async () => {
                            const stillValid = await validateTokens();
                            if (!stillValid) {
                                setAuthState({
                                    isChecking: false,
                                    isAuthenticated: false
                                });
                                clearInterval(tokenCheckIntervalRef.current);
                            }
                        }, 15 * 60 * 1000);
                    }
                });

                isInitialMount.current = false;
            } catch (error) {
                console.error('Auth check failed:', error);
                setAuthState({
                    isChecking: false,
                    isAuthenticated: false
                });
            }
        };

        checkAuthentication();

        // Set up cleanup interval only once
        if (!cleanupIntervalRef.current) {
            cleanupIntervalRef.current = setInterval(() => {
                tokenCleanup.performFullCleanup();
            }, 60 * 60 * 1000);
        }

        return () => {
            if (unsubscribe) {
                unsubscribe();
            }
            if (tokenCheckIntervalRef.current) {
                clearInterval(tokenCheckIntervalRef.current);
            }
        };
    }, []);

    // Clean up all intervals on component unmount
    useEffect(() => {
        return () => {
            if (cleanupIntervalRef.current) {
                clearInterval(cleanupIntervalRef.current);
                cleanupIntervalRef.current = null;
            }
        };
    }, []);

    if (authState.isChecking) {
        console.log('⏳ Still checking - showing loader');
        return <SkeletonLoader message="Ensuring that you are signed in..." mode="auth"/>;
    }

    if (!authState.isAuthenticated) {
        console.log('🚪 Not authenticated - redirecting to /login');
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    console.log('✅ Authenticated - rendering protected content');
    return children;
};

export default PrivateRoute;