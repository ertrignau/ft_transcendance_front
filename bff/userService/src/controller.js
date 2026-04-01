const prisma = require('./prisma');
const { v4: uuidv4 } = require('uuid');

exports.createOneUser = async (req, res) => {
  try {
    const { username, firstName, lastName, avatar, theme, langue } = req.body;

    if (!username || !firstName || !lastName) {
      return res.status(400).json({ error: 'Username, firstName and lastName are required.' });
    }

    const newUser = await prisma.user.create({
      data: {
        id: uuidv4(),
        username,
        firstName,
        lastName,
        avatar: avatar ?? null,
        theme:  theme  ?? 'LIGHT',
        langue: langue ?? 'en',
      },
    });
    return res.status(201).json({ id : newUser.id });
  }
  catch (error) {
    switch (error.code) {
      case 'P2002':
        return res.status(409).json({ error: 'Username already in use.' });
      default:
        console.error(error);
        return res.status(500).json({ error: 'Internal server error.' });
    }
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany();
    return res.status(200).json(users);
  }
  catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

exports.deleteAllUsers = async (req, res) => {
  try {
    const { count } = await prisma.user.deleteMany();
    return res.status(200).json({ deleted: count });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

exports.getOneUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }
    return res.status(200).json(user);
  }
  catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

exports.modifyOneUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { username, firstName, lastName, avatar, theme, langue } = req.body;

    await prisma.user.update({
      where: { id: userId },
      data: {
        ...(username  && { username }),
        ...(firstName && { firstName }),
        ...(lastName  && { lastName }),
        ...(avatar    && { avatar }),
        ...(theme     && { theme }),
        ...(langue    && { langue }),
      },
    });
    return res.sendStatus(200);
  }
  catch (error) {
    switch (error.code) {
      case 'P2025':
        return res.status(404).json({ error: 'User not found.' });
      case 'P2002':
        return res.status(409).json({ error: 'Username already in use.' });
      default:
        console.error(error);
        return res.status(500).json({ error: 'Internal server error.' });
    }
  }
};

exports.deleteOneUser = async (req, res) => {
  try {
    const { userId } = req.params;

    await prisma.user.delete({
      where: { id: userId },
    });
    return res.sendStatus(200);
  }
  catch (error) {
    switch (error.code) {
      case 'P2025':
        return res.status(404).json({ error: 'User not found.' });
      default:
        console.error(error);
        return res.status(500).json({ error: 'Internal server error.' });
    }
  }
};

exports.getOneUserByUsername = async (req, res) => {
  try {
    const { username } = req.params;

    const user = await prisma.user.findUnique({
      where: { username: username },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }
    return res.status(200).json(user);
  }
  catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};