import React, { useState, useEffect } from 'react';
import {
    useToast
} from '@chakra-ui/react';
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import DashboardPage from "./DashboardPage.jsx";
import useCheckRole from "components/hooks/useCheckRole.js";
import {apiService} from "../apiService.js";
const Dashboard = () => {
    const [data, setData] = useState(null);
    const [accessoryData, setAccessoryData] = useState(null);
    const [loading, setLoading] = useState(true);
    const { role, loading:roleLoading, error } = useCheckRole();
    const toast = useToast();
    const navigate = useNavigate();
    useEffect(()=>{
        const fetchDashboardData = async () => {
            setLoading(true)
            try {
                const token = localStorage.getItem('access');

                const result = await apiService.fetchDashboardData(token);

                if (result.status === 401) {
                    navigate('/Login');
                } else if (result.status !== 'error') {
                    setData(result.data);
                } else {
                    toast({
                        status: 'error',
                        description: result.message,
                    });
                }
            }
            catch (err){
                toast({
                    status:'error',
                    description:err.message
                })
                console.error("Error fetching data");
            }finally {
                setLoading(false)
            }
        }
        fetchDashboardData();
    },[])

    useEffect(() => {
        const fetchAccessoryData = async () => {
            setLoading(true);
            try {
                const result = await apiService.fetchAccessoryDashboardData();

                if (result.status !== 'error') {
                    const formattedData = result.data.monthly_sales.map(item => ({
                        ...item,
                        month: format(new Date(item.month), 'MMM'), // 'MMM' for short month name
                    }));

                    setAccessoryData({ ...result.data, monthly_sales: formattedData });
                } else {
                    toast({
                        status: 'error',
                        description: result.message,
                    });
                }
            } catch (err) {
                toast({
                    status: 'error',
                    description: err.message
                });
            } finally {
                setLoading(false);
            }
        };

        fetchAccessoryData();
    }, []); // Empty dependency array means this effect runs once on mount




    useEffect(() => {
        if (roleLoading) return;  // Don't do anything while loading

        if (error) {
            toast({
                status: "error",
                description: "Error checking your role. Please try again later.",
            });
            navigate('/Login');
            return;
        }

        if (!role) {
            // If no role is found (not logged in or role missing), redirect to login
            navigate('/Login');
        } else if (role !== "admin") {
            // If the role is not admin, show an error and navigate back
            toast({
                status: "error",
                description: "You are not allowed to view this page",
            });
            navigate(-1);  // Navigate back to the previous page
        }
    }, [role, roleLoading, error, navigate, toast]);


    return (
        <DashboardPage
        loading={loading || roleLoading}
        data={data}
        accessoryData={accessoryData}
        />
    );
};

export default Dashboard;
