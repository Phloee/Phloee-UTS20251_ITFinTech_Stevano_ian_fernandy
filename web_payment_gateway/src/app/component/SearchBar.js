"use client";
import { useState, useEffect } from "react";

export default function SearchBar({
  onSearch,
  placeholder = "Search products...",
  className = "",
}) {
  const [query, setQuery] = useState("");

  // Debounce search
  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      onSearch(query);
    }, 300);

    return () => clearTimeout(delayedSearch);
  }, [query, onSearch]);

  return (
    <div className={`relative ${className}`}>
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <span className="text-gray-500">🔍</span>
      </div>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
      {query && (
        <button
          onClick={() => setQuery("")}
          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
        >
          ✕
        </button>
      )}
    </div>
  );
}
