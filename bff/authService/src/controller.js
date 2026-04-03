const prisma = require('./prisma');
const { v4: uuidv4 } = require('uuid'); // : permet de renommer la fonction v4 de l'objet retourné

exports.createOneAuth = async (req, res) => {
  try {
    const { email, password, login42, userId } = req.body;
    const normalizedEmail = email.toLowerCase();  // Normalize email to lowercase

    if (!normalizedEmail || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    await prisma.auth.create({
      data: {
        id : uuidv4(),
        userId,
        email: normalizedEmail,
        login42: login42 ?? null,
        password,
      },
    });
    return res.sendStatus(201);
  }
  catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'Email or login42 already in use.' });
    }
    console.error(error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

exports.getAllAuths = async (req, res) => {
  try {
    const auths = await prisma.auth.findMany({
      select: {
        id: true,
        userId: true,
        email: true,
        login42: true,
        createdAt: true,
      },
    });
    return res.status(200).json(auths);
  }
  catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

exports.deleteAllAuths = async (req, res) => {
  try {
    const { count } = await prisma.auth.deleteMany();
    return res.status(200).json({ deleted: count });
  }
  catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

exports.getOneAuth = async (req, res) => {
  try {
    const { authId } = req.params;

    const auth = await prisma.auth.findUnique({
      where: { id: authId }
    });

    if (!auth) {
      return res.status(404).json({ error: 'Auth not found.' });
    }

    return res.status(200).json(auth);

  }
  catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

exports.modifyOneAuth = async (req, res) => {
  try {
    const { authId } = req.params;
    const { email, password, login42 } = req.body;

    await prisma.auth.update({
      where: { id: authId },
      data: {
        ...(email    && { email: email.toLowerCase() }),
        ...(password && { password }),
        ...(login42  && { login42 }),
      },
    });
    return res.sendStatus(200);
  }
  catch (error) {
    switch (error.code) {
      case 'P2025':
        return res.status(404).json({ error: 'Auth not found.' });
      case 'P2002':
        return res.status(409).json({ error: 'Email or login42 already in use.' });
      default:
        console.error(error);
        return res.status(500).json({ error: 'Internal server error.' });
    }
  }
};

exports.deleteOneAuth = async (req, res) => {
  try {
    const { authId } = req.params;

    await prisma.auth.delete({
      where: { id: authId },
    });
    return res.sendStatus(200);
  }
  catch (error) {
    switch (error.code) {
      case 'P2025':
        return res.status(404).json({ error: 'Auth not found.' });
      default:
        console.error(error);
        return res.status(500).json({ error: 'Internal server error.' });
    }
  }
};

exports.getOneAuthByLogin42 = async (req, res) => {
  try {
    const { login42 } = req.params;

    const auth = await prisma.auth.findUnique({
      where: { login42: login42 },
    });

    if (!auth) {
      return res.status(404).json({ error: 'Auth not found.' });
    }
    return res.status(200).json(auth);
  }
  catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

exports.getOneAuthByEmail = async (req, res) => {
  try {
    const { email } = req.params;
    const normalizedEmail = email.toLowerCase();  // Normalize to lowercase

    const auth = await prisma.auth.findUnique({
      where: { email: normalizedEmail },
    });

    if (!auth) {
      return res.status(404).json({ error: 'Auth not found.' });
    }
    return res.status(200).json(auth);
  }
  catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

exports.getOneAuthByUserId = async (req, res) => {
  try {
    const { userId } = req.params;

    const auth = await prisma.auth.findUnique({
      where: { userId },
    });

    if (!auth) {
      return res.status(404).json({ error: 'Auth not found.' });
    }

    return res.status(200).json(auth);

  }
  catch (error) {
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

exports.modifyOneAuthByUserId = async (req, res) => {
  try {
    const { userId } = req.params;
    const { email, password, login42 } = req.body;

    await prisma.auth.update({
      where: { userId },
      data: {
        ...(email    && { email: email.toLowerCase() }),
        ...(password && { password }),
        ...(login42  && { login42 }),
      },
    });

    return res.sendStatus(200);
  }
  catch (error) {
    switch (error.code) {
      case 'P2025':
        return res.status(404).json({ error: 'Auth not found.' });
      case 'P2002':
        return res.status(409).json({ error: 'Email or login42 already in use.' });
      default:
        console.error(error);
        return res.status(500).json({ error: 'Internal server error.' });
    }
  }
};

exports.deleteOneUser = async (req, res) => {
  try {
    const { userId } = req.params;

    await prisma.auth.delete({
      where: { userId },
    });

    return res.sendStatus(200);

  } catch (error) {
    switch (error.code) {
      case 'P2025':
        return res.status(404).json({ error: 'Auth not found.' });
      default:
        console.error(error);
        return res.status(500).json({ error: 'Internal server error.' });
    }
  }
};