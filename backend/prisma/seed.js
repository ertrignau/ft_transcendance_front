import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
	console.log('🌱 Seeding database...');

	// Nettoyer la base de données
	await prisma.notification.deleteMany();
	await prisma.message.deleteMany();
	await prisma.follower.deleteMany();
	await prisma.like.deleteMany();
	await prisma.post.deleteMany();
	await prisma.user.deleteMany();

	console.log('🧹 Cleaned database');

	// Créer des utilisateurs de test
	const users = await Promise.all([
		prisma.user.create({
			data: {
				username: 'jdupont',
				email: 'jdupont@student.42.fr',
				firstName: 'Jean',
				lastName: 'Dupont',
				bio: 'Étudiant 42 Paris passionné de code',
				campus: 'Paris',
				cursus: '42cursus',
				level: 12.42,
				avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=jdupont'
			}
		}),
		prisma.user.create({
			data: {
				username: 'smartin',
				email: 'smartin@student.42.fr',
				firstName: 'Sophie',
				lastName: 'Martin',
				bio: 'Full-stack dev | 42 Lyon',
				campus: 'Lyon',
				cursus: '42cursus',
				level: 8.15,
				avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=smartin'
			}
		}),
		prisma.user.create({
			data: {
				username: 'pbernard',
				email: 'pbernard@student.42.fr',
				firstName: 'Alain',
				lastName: 'Akbar',
				bio: 'DevOps enthusiast 🚀',
				campus: 'Paris',
				cursus: '42cursus',
				level: 15.80,
				avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=pbernard'
			}
		}),
		prisma.user.create({
			data: {
				username: 'mgarcia',
				email: 'mgarcia@student.42.fr',
				firstName: 'Marie',
				lastName: 'Garcia',
				bio: 'Cybersecurity & AI',
				campus: 'Nice',
				cursus: '42cursus',
				level: 6.90,
				avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=mgarcia'
			}
		}),
		prisma.user.create({
			data: {
				username: 'lthomas',
				email: 'lthomas@student.42.fr',
				firstName: 'Lucas',
				lastName: 'Thomas',
				bio: 'Game developer | Unity & C++',
				campus: 'Paris',
				cursus: '42cursus',
				level: 10.25,
				avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=lthomas'
			}
		})
	]);

	console.log(`✅ Created ${users.length} users`);

	// Créer des posts
	const posts = await Promise.all([
		prisma.post.create({
			data: {
				content: 'Premier post sur 42Hub ! 🎉 Qui est là pour tester cette nouvelle plateforme ?',
				userId: users[0].id
			}
		}),
		prisma.post.create({
			data: {
				content: 'Quelqu\'un pour m\'aider sur le projet ft_transcendence ? Je galère avec les WebSockets 😅',
				userId: users[1].id
			}
		}),
		prisma.post.create({
			data: {
				content: 'Check out my new portfolio! feedback welcome 🚀\nhttps://example.com/portfolio',
				userId: users[2].id
			}
		}),
		prisma.post.create({
			data: {
				content: 'Viens de passer libft ! Les prochains projets arrivent 💪',
				userId: users[3].id
			}
		}),
		prisma.post.create({
			data: {
				content: 'Qui veut participer à un hackathon ce weekend ? DM me!',
				userId: users[4].id
			}
		}),
		prisma.post.create({
			data: {
				content: 'Rappel : évaluation de philosophers demain matin à 10h. Soyez prêts !',
				userId: users[0].id
			}
		}),
		prisma.post.create({
			data: {
				content: 'Des ressources sympa pour apprendre Docker ? Je débute',
				userId: users[1].id
			}
		}),
		prisma.post.create({
			data: {
				content: 'Level 15 ! 🎊 Prochain objectif : ft_irc',
				userId: users[2].id
			}
		})
	]);

	console.log(`✅ Created ${posts.length} posts`);

	// Créer des likes
	const likes = await Promise.all([
		// User 0 like plusieurs posts
		prisma.like.create({ data: { userId: users[0].id, postId: posts[1].id } }),
		prisma.like.create({ data: { userId: users[0].id, postId: posts[2].id } }),
		prisma.like.create({ data: { userId: users[0].id, postId: posts[4].id } }),
		
		// User 1
		prisma.like.create({ data: { userId: users[1].id, postId: posts[0].id } }),
		prisma.like.create({ data: { userId: users[1].id, postId: posts[3].id } }),
		
		// User 2
		prisma.like.create({ data: { userId: users[2].id, postId: posts[0].id } }),
		prisma.like.create({ data: { userId: users[2].id, postId: posts[1].id } }),
		prisma.like.create({ data: { userId: users[2].id, postId: posts[4].id } }),
		
		// User 3
		prisma.like.create({ data: { userId: users[3].id, postId: posts[0].id } }),
		prisma.like.create({ data: { userId: users[3].id, postId: posts[2].id } }),
		
		// User 4
		prisma.like.create({ data: { userId: users[4].id, postId: posts[1].id } }),
		prisma.like.create({ data: { userId: users[4].id, postId: posts[6].id } })
	]);

	console.log(`✅ Created ${likes.length} likes`);

	// Créer des relations follow
	const followers = await Promise.all([
		// User 0 follow plusieurs personnes
		prisma.follower.create({ data: { followerId: users[0].id, followingId: users[1].id } }),
		prisma.follower.create({ data: { followerId: users[0].id, followingId: users[2].id } }),
		prisma.follower.create({ data: { followerId: users[0].id, followingId: users[4].id } }),
		
		// User 1
		prisma.follower.create({ data: { followerId: users[1].id, followingId: users[0].id } }),
		prisma.follower.create({ data: { followerId: users[1].id, followingId: users[2].id } }),
		
		// User 2
		prisma.follower.create({ data: { followerId: users[2].id, followingId: users[0].id } }),
		prisma.follower.create({ data: { followerId: users[2].id, followingId: users[3].id } }),
		
		// User 3
		prisma.follower.create({ data: { followerId: users[3].id, followingId: users[1].id } }),
		prisma.follower.create({ data: { followerId: users[3].id, followingId: users[4].id } }),
		
		// User 4
		prisma.follower.create({ data: { followerId: users[4].id, followingId: users[0].id } }),
		prisma.follower.create({ data: { followerId: users[4].id, followingId: users[2].id } })
	]);

	console.log(`✅ Created ${followers.length} follow relationships`);

	// Créer des messages
	const messages = await Promise.all([
		// Conversation entre User 0 et User 1
		prisma.message.create({
			data: {
				content: 'Salut ! Tu as fait le projet minishell ?',
				senderId: users[0].id,
				receiverId: users[1].id,
				isRead: true
			}
		}),
		prisma.message.create({
			data: {
				content: 'Oui ! C\'était compliqué mais j\'ai réussi. Tu veux des conseils ?',
				senderId: users[1].id,
				receiverId: users[0].id,
				isRead: true
			}
		}),
		prisma.message.create({
			data: {
				content: 'Carrément ! Surtout pour la gestion des pipes',
				senderId: users[0].id,
				receiverId: users[1].id,
				isRead: false
			}
		}),
		
		// Message entre User 2 et User 0
		prisma.message.create({
			data: {
				content: 'Hey ! Ton portfolio est super clean 👌',
				senderId: users[0].id,
				receiverId: users[2].id,
				isRead: false
			}
		}),
		
		// Message entre User 3 et User 4
		prisma.message.create({
			data: {
				content: 'Tu participes au hackathon ce weekend ?',
				senderId: users[3].id,
				receiverId: users[4].id,
				isRead: true
			}
		}),
		prisma.message.create({
			data: {
				content: 'Ouais ! Je cherche une équipe, t\'es chaud ?',
				senderId: users[4].id,
				receiverId: users[3].id,
				isRead: false
			}
		})
	]);

	console.log(`✅ Created ${messages.length} messages`);

	// Créer des notifications
	const notifications = await Promise.all([
		prisma.notification.create({
			data: {
				type: 'like',
				content: 'Sophie Martin a aimé votre post',
				userId: users[0].id,
				isRead: false
			}
		}),
		prisma.notification.create({
			data: {
				type: 'follow',
				content: 'Pierre Bernard a commencé à vous suivre',
				userId: users[0].id,
				isRead: false
			}
		}),
		prisma.notification.create({
			data: {
				type: 'message',
				content: 'Vous avez un nouveau message de Jean Dupont',
				userId: users[1].id,
				isRead: true
			}
		}),
		prisma.notification.create({
			data: {
				type: 'like',
				content: 'Lucas Thomas a aimé votre post',
				userId: users[2].id,
				isRead: false
			}
		}),
		prisma.notification.create({
			data: {
				type: 'follow',
				content: 'Marie Garcia a commencé à vous suivre',
				userId: users[4].id,
				isRead: true
			}
		})
	]);

	console.log(`✅ Created ${notifications.length} notifications`);

	console.log('\n🎉 Seeding completed successfully!');
	console.log('\n📊 Database summary:');
	console.log(`   - Users: ${users.length}`);
	console.log(`   - Posts: ${posts.length}`);
	console.log(`   - Likes: ${likes.length}`);
	console.log(`   - Followers: ${followers.length}`);
	console.log(`   - Messages: ${messages.length}`);
	console.log(`   - Notifications: ${notifications.length}`);
}

main()
	.catch((e) => {
		console.error('❌ Error seeding database:', e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
