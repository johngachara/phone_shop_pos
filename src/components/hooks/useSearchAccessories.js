import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Meilisearch } from 'meilisearch';
import { useToast } from "@chakra-ui/react";
import {setAccessorySearchResults} from "components/redux/actions/shopActions.js";

const client = new Meilisearch({
    host: import.meta.env.VITE_MEILISEARCH_URL,
    apiKey: import.meta.env.VITE_MEILISEARCH_KEY
});

const useSearchAccessories = (searchParam) => {
    const [loading, setLoading] = useState(false);
    const dispatch = useDispatch();
    const searchResults = useSelector(state => state.searchAccessory.results);
    const toast = useToast();

    useEffect(() => {
        const handleSearch = async () => {
            if (!searchParam) {
                dispatch(setAccessorySearchResults([]));
                return;
            }
            if(searchParam.length > 0) {
                setLoading(true)
            }
            try {
                const response = await client.index('Accessories_New').search(searchParam);
                const info = response.hits;
                if (info.length === 0) {
                    toast({
                        title: "No results",
                        position: "top",
                        description: "No item with given name found",
                        status: "warning",
                        duration: 3000,
                        isClosable: true,
                    });
                }
                dispatch(setAccessorySearchResults(info));
            } catch (err) {
                toast({
                    title: "Error",
                    position: "top",
                    description: err.message,
                    status: "error",
                    duration: 3000,
                    isClosable: true,
                });
            } finally {
                setLoading(false);
            }
        };
        const debounceSearch = setTimeout(handleSearch, 300);
        return () => clearTimeout(debounceSearch);
    }, [searchParam, dispatch, toast]);

    return { searchResults, loading };
};

export default useSearchAccessories;