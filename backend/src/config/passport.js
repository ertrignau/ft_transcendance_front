/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   passport.js                                        :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: eric <eric@student.42.fr>                  +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2026/02/15 12:15:38 by eric              #+#    #+#             */
/*   Updated: 2026/02/17 14:28:04 by eric             ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

import passport from "passport";
import { Strategy as FortyTwoStrategy } from 'passport-42';
import prisma from './database.js';

passport.use(new FortyTwoStrategy(
	{
		clientID: process.env.FT_CLIENT_ID,
		clientSecret: process.env.FT_CLIENT_SECRET,
		callbackURL: process.env.FT_CALLBACK_URL,
	},
	async (accessToken, refreshToken, profile, done) => {
		try {
			const ftData = profile._json;
			
			// Trouve le cursus principal (42cursus ou Web3)
			const mainCursus = ftData.cursus_users?.find(
				cu => cu.cursus?.slug === '42cursus' || cu.cursus?.slug === 'web3'
			) || ftData.cursus_users?.[0];
			
			// Chercher par ftId OU intraId (compatibilité)
			let user = await prisma.user.findFirst({
				where: {
					OR: [
						{ ftId: ftData.id },
						{ intraId: ftData.id.toString() },
					]
				}
			});

			if (user) {
				// USER EXISTANT → mettre à jour level/cursus, NE PAS écraser avatar si personnalisé
				user = await prisma.user.update({
					where: { id: user.id },
					data: {
						level:  mainCursus?.level || user.level,
						cursus: mainCursus?.cursus?.name || user.cursus,
						// Ne pas écraser l'avatar si l'user l'a personnalisé
						avatar: user.avatar || ftData.image?.link || null,
					}
				});
				// Passer isNewUser = false pour que le callback génère un vrai JWT
				user.isNewUser = false;
			} else {
				// NOUVEL USER → passer les données 42 brutes, pas encore créé en DB
				// Le callback redirigera vers /register/42 pour confirmation
				user = {
					isNewUser:  true,
					ftId:       ftData.id,
					intraId:    ftData.id.toString(),
					username:   ftData.login,
					email:      ftData.email,
					firstName:  ftData.first_name,
					lastName:   ftData.last_name,
					avatar:     ftData.image?.link || null,
					campus:     ftData.campus?.[0]?.name || null,
					cursus:     mainCursus?.cursus?.name || null,
					level:      mainCursus?.level || 0,
				};
			}
			return done(null, user);
		} catch (error) {
			return done (error, null);
		}
	}
));

export default passport;