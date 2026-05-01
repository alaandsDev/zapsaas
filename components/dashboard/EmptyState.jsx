export default function EmptyState({ icon = "📭", title, desc, action }) {
  return (
    <div className="card p-12 text-center">
      <div className="text-5xl mb-4">{icon}</div>
      <h3 className="font-semibold text-lg">{title}</h3>
      {desc && <p className="text-ink-300 mt-2 max-w-md mx-auto">{desc}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
