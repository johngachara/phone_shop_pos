import {onAuthStateChanged} from "firebase/auth";
import {useEffect, useState} from "react";
import {auth} from "components/firebase/firebase.js";

const useAuthCheck = () => {
    const [authState, setAuthState] = useState({
        isLoading: true,
        isAuthenticated: false,
        error: null
    });

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth,
            (user) => {
                setAuthState({
                    isLoading: false,
                    isAuthenticated: !!user,
                    error: null
                });
            },
            (error) => {
                setAuthState({
                    isLoading: false,
                    isAuthenticated: false,
                    error
                });
            }
        );

        return unsubscribe;
    }, []);

    return authState;
};
export default useAuthCheck