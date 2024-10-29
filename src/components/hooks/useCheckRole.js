import { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import {auth,firestore} from "components/firebase/firebase.js";


// Custom hook to check the user's role
const useCheckRole = () => {
    const [role, setRole] = useState(null);  // Store the user's role ("admin" or "user")
    const [loading, setLoading] = useState(true);  // Track loading state
    const [error, setError] = useState(null);  // Track any potential errors

    useEffect(() => {
        const checkUserRole = async (user) => {
            if (!user) {
                setLoading(false);
                setRole(null);
                return;
            }

            const uid = user.uid;  // Get the Firebase UID

            try {
                const userDocRef = doc(firestore, "users", uid);  // Reference to the user's Firestore document
                const userDoc = await getDoc(userDocRef);  // Get the user's document from Firestore

                if (userDoc.exists()) {
                    const userData = userDoc.data();  // Extract user data
                    if (userData.role) {
                        setRole(userData.role);  // Set the role ( "admin" or "user")
                    }else {
                        setRole(null)
                    }
                } else {
                    setError("User not found in Firestore");
                    setRole(null);  // No role found, user might not be in Firestore
                }
            } catch (err) {
                console.error("Error fetching user role:", err);
                setError("Error fetching user role");
                setRole(null);
            } finally {
                setLoading(false);  // Stop loading once the role is fetched or an error occurs
            }
        };

        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setLoading(true);
            checkUserRole(user);
        });

        return () => unsubscribe();  // Clean up the listener on component unmount
    }, []);

    return { role, loading, error };  // Return role, loading, and error states
};

export default useCheckRole;
