/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   Layout.jsx                                         :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: eric <eric@student.42.fr>                  +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2026/02/06 14:00:30 by eric              #+#    #+#             */
/*   Updated: 2026/02/20 09:44:37 by eric             ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

import Navbar from "./Navbar";

export default function Layout({ children })
{
	return (
		<div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex flex-col sm:flex-row transition-colors w-full overflow-x-hidden">
			{/* Sidebar */}
			<Navbar />
			
			{/* Main Content - with top padding on mobile for navbar */}
			<main className="flex-1 p-2 sm:p-4 md:p-8 w-full overflow-x-hidden overflow-y-auto pt-20 sm:pt-0">
				<div className="max-w-6xl mx-auto w-full">
					{children}
				</div>
			</main>
		</div>
	);
}
