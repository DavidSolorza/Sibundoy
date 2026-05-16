function Card({ className = "", children, ...props }) {
  return (
    <div
      className={`bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

function CardHeader({ className = "", children, ...props }) {
  return (
    <div className={`mb-4 ${className}`} {...props}>
      {children}
    </div>
  );
}

function CardTitle({ className = "", children, ...props }) {
  return (
    <h3 className={`text-lg font-semibold text-gray-900 ${className}`} {...props}>
      {children}
    </h3>
  );
}

export { Card, CardHeader, CardTitle };
