/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   vite.config.js                                     :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: eric <eric@student.42.fr>                  +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2026/02/20 09:18:33 by eric              #+#    #+#             */
/*   Updated: 2026/04/02 13:43:45 by eric             ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'

export default defineConfig({
  plugins: [react(), basicSsl()],
  server: {
    port: 5173,
    https: true,
    strictPort: true, // Plante proprement si le port est pris, au lieu de chercher un autre
  },
})
