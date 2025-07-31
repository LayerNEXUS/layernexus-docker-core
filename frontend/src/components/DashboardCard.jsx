export default function DashboardCard({ title, description, Icon, onClick }) {
    return (
      <button
        onClick={onClick}
        className="flex items-start gap-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 text-left shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-300"
      >
        <Icon className="h-6 w-6 text-gray-600 dark:text-gray-300 mt-1" />
        <div>
          <h3 className="text-base font-medium text-gray-800 dark:text-white mb-1">
            {title}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
        </div>
      </button>
    );
  }
  