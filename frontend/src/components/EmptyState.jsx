function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="empty-state">
      {Icon && <Icon className="empty-state-icon" size={64} strokeWidth={1} />}
      <h3 className="empty-state-title">{title}</h3>
      {description && <p className="empty-state-description">{description}</p>}
      {action && action}
    </div>
  );
}

export default EmptyState;
