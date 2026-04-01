const prisma = require('./prisma');
const { v4: uuidv4 } = require('uuid');

exports.createOneSocial = async (req, res) => {
  try {
    const { userId, friendId } = req.body;

    if (!userId || !friendId) {
      return res.status(400).json({ error: 'userId and friendId are required.' });
    }

    if (userId === friendId) {
      return res.status(400).json({ error: 'userId and friendId cannot be the same.' });
    }

    await prisma.social.create({
      data: {
        id: uuidv4(),
        userId,
        friendId,
      },
    });
    return res.sendStatus(201);
  }
  catch (error) {
    switch (error.code) {
      case 'P2002':
        return res.status(409).json({ error: 'This friendship already exists.' });
      default:
        console.error(error);
        return res.status(500).json({ error: 'Internal server error.' });
    }
  }
};

exports.getAllSocials = async (req, res) => {
  try {
    const socials = await prisma.social.findMany();
    return res.status(200).json(socials);
  }
  catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

exports.deleteAllSocials = async (req, res) => {
  try {
    await prisma.social.deleteMany();
    return res.sendStatus(200);
  }
  catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

exports.getOneSocial = async (req, res) => {
  try {
    const { socialId } = req.params;

    const social = await prisma.social.findUnique({
      where: { id: socialId },
    });

    if (!social) {
      return res.status(404).json({ error: 'Social not found.' });
    }
    return res.status(200).json(social);
  }
  catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

exports.deleteOneSocial = async (req, res) => {
  try {
    const { socialId } = req.params;

    await prisma.social.delete({
      where: { id: socialId },
    });
    return res.sendStatus(200);
  }
  catch (error) {
    switch (error.code) {
      case 'P2025':
        return res.status(404).json({ error: 'Social not found.' });
      default:
        console.error(error);
        return res.status(500).json({ error: 'Internal server error.' });
    }
  }
};

exports.getUserFriends = async (req, res) => {
  try {
    const { userId } = req.params;

    const friends = await prisma.social.findMany({
      where: { userId },
    });
    return res.status(200).json(friends);
  }
  catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

exports.getUserFollowers = async (req, res) => {
  try {
    const { userId } = req.params;

    const followers = await prisma.social.findMany({
      where: { friendId: userId },
    });
    return res.status(200).json(followers);
  }
  catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

exports.deleteOneUserSocials = async (req, res) => {
  try {
    const { userId } = req.params;

    await prisma.social.deleteMany({
      where: {
        OR: [
          { userId },
          { friendId: userId },
        ],
      },
    });
    return res.sendStatus(200);
  }
  catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

exports.getUserFriendsCount = async (req, res) => {
  try {
    const { userId } = req.params;

    const { count } = await prisma.social.count({
      where: { userId },
    });
    return res.status(200).json({ count });
  }
  catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

exports.getUserFollowersCount = async (req, res) => {
  try {
    const { userId } = req.params;

    const { count } = await prisma.social.count({
      where: { friendId: userId },
    });
    return res.status(200).json({ count });
  }
  catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

exports.deleteOneSocialByUserAndFriend = async (req, res) => {
  try {
    const { userId, friendId } = req.params;

    await prisma.social.delete({
      where: {
        userId_friendId: { userId, friendId },
      },
    });

    return res.sendStatus(200);
  }
  catch (error) {
    switch (error.code) {
      case 'P2025':
        return res.status(404).json({ error: 'Social not found.' });
      default:
        console.error(error);
        return res.status(500).json({ error: 'Internal server error.' });
    }
  }
};