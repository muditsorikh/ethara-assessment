function LoadingSpinner({ size = 'default', message = 'Loading...' }) {
  return (
    <div className="loading-container">
      <div className={`spinner ${size === 'large' ? 'spinner-lg' : ''}`}></div>
      {message && <p className="text-muted">{message}</p>}
    </div>
  );
}

export default LoadingSpinner;
