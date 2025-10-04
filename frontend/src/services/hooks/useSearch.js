import { useState, useEffect, useRef } from "react";
import axiosInstance from "../../features/admin/services/axiosInstance";

export default function useSearch() {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState({ products: [], posts: [] });
  const [showSuggestions, setShowSuggestions] = useState(false);
  const containerRef = useRef();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };

    if (showSuggestions) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showSuggestions]);

  const handleSearchChange = async (e) => {
    const value = e.target.value;
    setSearch(value);

    if (value.trim() === "") {
      setResults({ products: [], posts: [] });
      setShowSuggestions(false);
      return;
    }

    try {
      const res = await axiosInstance.get(`/products/search/`, {
        params: { q: value },
      });
      setResults(res.data);
      setShowSuggestions(true);
    } catch {
      setResults({ products: [], posts: [] });
      setShowSuggestions(false);
    }
  };

  return {
    // current search value and setter (export setter so consumers can programmatically set it)
    search,
    setSearch,

    // keep original name used in some consumers
    results,

    // also export under the name some files expect
    searchResults: results,

    showSuggestions,
    setShowSuggestions,

    // ref for the container (alias to searchRef for compatibility)
    containerRef,
    searchRef: containerRef,

    handleSearchChange,
  };
}
