function StatCard({ label, value, icon: Icon, onClick }) {
  const content = (
    <>
      {Icon && (
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
          <Icon className="h-6 w-6" />
        </div>
      )}
      <div>
        <p className="text-sm font-medium text-gray-500">{label}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
    </>
  );
  if (onClick) {
    return (
      <button onClick={onClick} className="cursor-pointer w-full text-left flex items-center gap-4 rounded-xl bg-white p-5 shadow-sm border border-gray-100 transition-shadow duration-200 hover:shadow-md hover:border-blue-200 active:bg-blue-50/50">
        {content}
      </button>
    );
  }
  return (
    <div className="flex items-center gap-4 rounded-xl bg-white p-5 shadow-sm border border-gray-100 transition-shadow duration-200 hover:shadow-md">
      {content}
    </div>
  );
}

export default StatCard;
