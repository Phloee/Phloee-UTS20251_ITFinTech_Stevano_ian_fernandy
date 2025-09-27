import { CATEGORIES } from "../utils/constants";

export default function CategoryFilter({
  selectedCategory,
  onCategoryChange,
  className = "",
}) {
  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {CATEGORIES.map((category) => (
        <button
          key={category.value}
          onClick={() => onCategoryChange(category.value)}
          className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
            selectedCategory === category.value
              ? "bg-blue-600 text-white shadow-md"
              : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 hover:border-gray-400"
          }`}
        >
          {category.label}
        </button>
      ))}
    </div>
  );
}
