import { useTranslation } from "react-i18next";
import { FiArrowUp, FiArrowDown } from "react-icons/fi";

export default function SearchSort({ sortBy, setSortBy, sortOrder, setSortOrder }) {
	const { t } = useTranslation();

	return (
		<div className="flex gap-2 px-4 py-2 flex-wrap items-center">
			{/* Tri par */}
			<select
				value={sortBy}
				onChange={(e) => setSortBy(e.target.value)}
				className="px-3 py-1 rounded text-xs font-medium bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white border-none cursor-pointer hover:bg-gray-300 dark:hover:bg-gray-600 transition"
			>
				<option value="name">{t('search.sort.by_name')}</option>
				<option value="level">{t('search.sort.by_level')}</option>
				<option value="campus">{t('search.sort.by_campus')}</option>
			</select>

			{/* Direction du tri */}
			<button
				onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
				className="px-3 py-1 rounded text-xs font-medium bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600 transition flex items-center gap-1"
			>
				{sortOrder === "asc" ? (
					<>
						<FiArrowUp className="text-sm" />
						{t('search.sort.ascending')}
					</>
				) : (
					<>
						<FiArrowDown className="text-sm" />
						{t('search.sort.descending')}
					</>
				)}
			</button>
		</div>
	);
}
