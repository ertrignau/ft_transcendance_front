const prisma = require('./prisma');

// POSTS

exports.createOnePost = async (req, res) => {
  try {
    const { userId, content, image, pdf } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required.' });
    }

    if (!content && !image && !pdf) {
      return res.status(400).json({ error: 'At least one of content, image or pdf is required.' });
    }

    const post = await prisma.post.create({
      data: {
        userId,
        content: content ?? null,
        image:   image   ?? null,
        pdf:     pdf     ?? null,
      },
    });

    return res.status(201).json(post);
  }
  catch (error) {
    console.error('❌ [CONTENT-CONTROLLER] createOnePost error:', error.message);
    console.error('❌ [CONTENT-CONTROLLER] Full error:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

exports.getAllPosts = async (req, res) => {
  try {
    const { date, limit, sort } = req.query;

    const parsedLimit = limit ? parseInt(limit) : undefined;
    const parsedDate  = date  ? new Date(date)  : undefined;
    const parsedSort  = sort === 'asc' ? 'asc'  : 'desc';

    if (limit && (isNaN(parsedLimit) || parsedLimit <= 0)) {
      return res.status(400).json({ error: 'Invalid limit value.' });
    }

    if (date && isNaN(parsedDate.getTime())) {
      return res.status(400).json({ error: 'Invalid date value.' });
    }

    const posts = await prisma.post.findMany({
      where: {
        ...(parsedDate && {
          createdAt: { lt: parsedDate },
        }),
      },
      orderBy: { createdAt: parsedSort },
      take:    parsedLimit,
    });

    return res.status(200).json(posts);

  }
  catch (error) {
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

//  date : ISO 8601, exemple : 2025-10-12T15:45:00.000Z

exports.deleteAllPosts = async (req, res) => {
  try {
    await prisma.post.deleteMany();
    return res.sendStatus(200);

  }
  catch (error) {
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

exports.getUserPosts = async (req, res) => {
  try {
    const { userId } = req.params;

    const posts = await prisma.post.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return res.status(200).json(posts);

  }
  catch (error) {
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

exports.deleteUserPosts = async (req, res) => {
  try {
    const { userId } = req.params;

    await prisma.post.deleteMany({
      where: { userId },
    });

    return res.sendStatus(200);

  }
  catch (error) {
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

exports.getUserPostsCount = async (req, res) => {
  try {
    const { userId } = req.params;

    const count = await prisma.post.count({
      where: { userId },
    });

    return res.status(200).json({ count });
  }
  catch (error) {
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

exports.getOnePost = async (req, res) => {
  try {
    const { postId } = req.params;

    const post = await prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      return res.status(404).json({ error: 'Post not found.' });
    }

    return res.status(200).json(post);
  }
  catch (error) {
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

exports.modifyOnePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const { content, image, pdf } = req.body;

    await prisma.post.update({
      where: { id: postId },
      data: {
        ...(content !== undefined && { content }),
        ...(image   !== undefined && { image }),
        ...(pdf     !== undefined && { pdf }),
      },
    });

    return res.sendStatus(200);
  }
  catch (error) {
    switch (error.code) {
      case 'P2025':
        return res.status(404).json({ error: 'Post not found.' });
      default:
        return res.status(500).json({ error: 'Internal server error.' });
    }
  }
};

exports.deleteOnePost = async (req, res) => {
  try {
    const { postId } = req.params;

    await prisma.post.delete({
      where: { id: postId },
    });

    return res.sendStatus(200);
  }
  catch (error) {
    switch (error.code) {
      case 'P2025':
        return res.status(404).json({ error: 'Post not found.' });
      default:
        return res.status(500).json({ error: 'Internal server error.' });
    }
  }
};

// COMMENTS

exports.createOneComment = async (req, res) => {
  try {
    const { userId, postId, content } = req.body;

    if (!userId || !postId || !content) {
      return res.status(400).json({ error: 'userId, postId and content are required.' });
    }

    const comment = await prisma.comment.create({
      data: {
        userId,
        postId,
        content,
      },
    });

    return res.status(201).json(comment);
  }
  catch (error) {
    switch (error.code) {
      case 'P2003':
        return res.status(404).json({ error: 'Post not found.' });
      default:
        return res.status(500).json({ error: 'Internal server error.' });
    }
  }
};

exports.getAllComments = async (req, res) => {
  try {
    const comments = await prisma.comment.findMany();

    return res.status(200).json(comments);
  }
  catch (error) {
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

exports.deleteAllComments = async (req, res) => {
  try {
    await prisma.comment.deleteMany();

    return res.sendStatus(200);
  }
  catch (error) {
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

exports.getUserComments = async (req, res) => {
  try {
    const { userId } = req.params;

    const comments = await prisma.comment.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return res.status(200).json(comments);
  }
  catch (error) {
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

exports.deleteUserComments = async (req, res) => {
  try {
    const { userId } = req.params;

    await prisma.comment.deleteMany({
      where: { userId },
    });

    return res.sendStatus(200);
  }
  catch (error) {
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

exports.getPostComments = async (req, res) => {
  try {
    const { postId } = req.params;
    const { date, limit, sort } = req.query;

    const parsedLimit = limit ? parseInt(limit) : undefined;
    const parsedDate  = date  ? new Date(date)  : undefined;
    const parsedSort  = sort === 'asc' ? 'asc'  : 'desc';

    if (limit && (isNaN(parsedLimit) || parsedLimit <= 0)) {
      return res.status(400).json({ error: 'Invalid limit value.' });
    }

    if (date && isNaN(parsedDate.getTime())) {
      return res.status(400).json({ error: 'Invalid date value.' });
    }

    const comments = await prisma.comment.findMany({
      where: {
        postId,
        ...(parsedDate && {
          createdAt: { lt: parsedDate },
        }),
      },
      orderBy: { createdAt: parsedSort },
      take:    parsedLimit,
    });

    return res.status(200).json(comments);

  }
  catch (error) {
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

exports.deletePostComments = async (req, res) => {
  try {
    const { postId } = req.params;

    await prisma.comment.deleteMany({
      where: { postId },
    });

    return res.sendStatus(200);
  }
  catch (error) {
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

exports.getPostCommentsCount = async (req, res) => {
  try {
    const { postId } = req.params;

    const count = await prisma.comment.count({
      where: { postId },
    });

    return res.status(200).json({ count });
  }
  catch (error) {
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

exports.getOneComment = async (req, res) => {
  try {
    const { commentId } = req.params;

    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      return res.status(404).json({ error: 'Comment not found.' });
    }

    return res.status(200).json(comment);
  }
  catch (error) {
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

exports.modifyOneComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { content, deleted } = req.body;

    await prisma.comment.update({
      where: { id: commentId },
      data: {
        ...(content !== undefined && { content }),
        ...(deleted !== undefined && { deleted }),
      },
    });

    return res.sendStatus(200);
  }
  catch (error) {
    switch (error.code) {
      case 'P2025':
        return res.status(404).json({ error: 'Comment not found.' });
      default:
        return res.status(500).json({ error: 'Internal server error.' });
    }
  }
};

exports.deleteOneComment = async (req, res) => {
  try {
    const { commentId } = req.params;

    await prisma.comment.delete({
      where: { id: commentId },
    });

    return res.sendStatus(200);
  }
  catch (error) {
    switch (error.code) {
      case 'P2025':
        return res.status(404).json({ error: 'Comment not found.' });
      default:
        return res.status(500).json({ error: 'Internal server error.' });
    }
  }
};

// LIKES

exports.createOneLike = async (req, res) => {
  try {
    const { userId, postId } = req.body;

    if (!userId || !postId) {
      return res.status(400).json({ error: 'userId and postId are required.' });
    }

    const like = await prisma.like.create({
      data: {
        userId,
        postId,
      },
    });

    return res.status(201).json(like);
  }
  catch (error) {
    switch (error.code) {
      case 'P2002':
        return res.status(409).json({ error: 'Post already liked.' });
      case 'P2003':
        return res.status(404).json({ error: 'Post not found.' });
      default:
        return res.status(500).json({ error: 'Internal server error.' });
    }
  }
};

exports.getAllLikes = async (req, res) => {
  try {
    const likes = await prisma.like.findMany();

    return res.status(200).json(likes);
  }
  catch (error) {
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

exports.deleteAllLikes = async (req, res) => {
  try {
    await prisma.like.deleteMany();

    return res.sendStatus(200);
  }
  catch (error) {
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

exports.getUserLikes = async (req, res) => {
  try {
    const { userId } = req.params;

    const likes = await prisma.like.findMany({
      where: { userId },
    });

    return res.status(200).json(likes);
  }
  catch (error) {
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

exports.deleteUserLikes = async (req, res) => {
  try {
    const { userId } = req.params;

    await prisma.like.deleteMany({
      where: { userId },
    });

    return res.sendStatus(200);
  }
  catch (error) {
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

exports.getPostLikes = async (req, res) => {
  try {
    const { postId } = req.params;

    const likes = await prisma.like.findMany({
      where: { postId },
    });

    return res.status(200).json(likes);
  }
  catch (error) {
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

exports.deletePostLike = async (req, res) => {
  try {
    const { postId } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required.' });
    }

    await prisma.like.delete({
      where: {
        userId_postId: { userId, postId },
      },
    });

    return res.sendStatus(200);
  }
  catch (error) {
    switch (error.code) {
      case 'P2025':
        return res.status(404).json({ error: 'Like not found.' });
      default:
        return res.status(500).json({ error: 'Internal server error.' });
    }
  }
};

exports.getOneLike = async (req, res) => {
  try {
    const { likeId } = req.params;

    const like = await prisma.like.findUnique({
      where: { id: likeId },
    });

    if (!like) {
      return res.status(404).json({ error: 'Like not found.' });
    }

    return res.status(200).json(like);
  }
  catch (error) {
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

exports.deleteOneLike = async (req, res) => {
  try {
    const { likeId } = req.params;

    await prisma.like.delete({
      where: { id: likeId },
    });

    return res.sendStatus(200);
  }
  catch (error) {
    switch (error.code) {
      case 'P2025':
        return res.status(404).json({ error: 'Like not found.' });
      default:
        return res.status(500).json({ error: 'Internal server error.' });
    }
  }
};

exports.getPostLikesCount = async (req, res) => {
  try {
    const { postId } = req.params;

    const count = await prisma.like.count({
      where: { postId },
    });

    return res.status(200).json({ count });
  }
  catch (error) {
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

// DELETE USER CONTENT

exports.deleteOneUserContent = async (req, res) => {
  try {
    const { userId } = req.params;

    await Promise.all([
      prisma.post.deleteMany({ where: { userId } }),
      prisma.comment.deleteMany({ where: { userId } }),
      prisma.like.deleteMany({ where: { userId } }),
    ]);

    return res.sendStatus(200);
  }
  catch (error) {
    return res.status(500).json({ error: 'Internal server error.' });
  }
};



