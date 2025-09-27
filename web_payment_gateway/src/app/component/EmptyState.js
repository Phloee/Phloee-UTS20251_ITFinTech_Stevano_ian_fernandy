export default function EmptyState({
  icon = "📦",
  title = "No items found",
  description = "Try adjusting your search or filter criteria.",
  action = null,
}) {
  return (
    <div className="text-center py-12">
      <div className="text-6xl mb-4">{icon}</div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 mb-6">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
