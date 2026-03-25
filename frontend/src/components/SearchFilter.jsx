import { useTranslation } from "react-i18next";

export default function SearchFilter({ filter, setFilter }) {
	const { t } = useTranslation();

	return (
		<div className="flex gap-2">
			<button
				onClick={() => setFilter("all")}
				className={`px-3 py-1 rounded-full text-xs font-medium transition ${
					filter === "all"
						? "bg-blue-500 text-white"
						: "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
				}`}
			>
				{t('search.filter.all')}
			</button>
			<button
				onClick={() => setFilter("local")}
				className={`px-3 py-1 rounded-full text-xs font-medium transition ${
					filter === "local"
						? "bg-blue-500 text-white"
						: "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
				}`}
			>
				{t('search.filter.local')}
			</button>
			<button
				onClick={() => setFilter("intra")}
				className={`px-3 py-1 rounded-full text-xs font-medium transition ${
					filter === "intra"
						? "bg-blue-500 text-white"
						: "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
				}`}
			>
				{t('search.filter.intra')}
			</button>
		</div>
	);
}
