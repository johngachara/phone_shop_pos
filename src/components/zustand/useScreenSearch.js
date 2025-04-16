import { create } from 'zustand';

const useSearchStore = create((set) => ({
    // State
    searchResults: [],
    loading: false,

    // Actions
    setSearchResults: (results) => set({ searchResults: results }),
    setLoading: (isLoading) => set({ loading: isLoading }),
}));

export default useSearchStore;