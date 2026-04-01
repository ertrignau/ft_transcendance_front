exports.getPosts = async (req, res) => {
  try {
    const { date, limit } = req.query;

    const params = new URLSearchParams();
    if (date)  params.append('date',  date);
    if (limit) params.append('limit', limit);
    params.append('sort', 'desc');

    const postsResponse = await fetch(`${process.env.CONTENT_SERVICE_URL}/post?${params}`);

    if (!postsResponse.ok) {
      return res.status(503).json({ error: 'Content service unavailable.' });
    }

    const posts = await postsResponse.json();

    if (posts.length === 0) {
      return res.status(200).json([]);
    }

    const countsResponses = await Promise.all(
      posts.map(post =>
        Promise.all([
          fetch(`${process.env.CONTENT_SERVICE_URL}/comment/count/post/${post.id}`).then(r => r.json()),
          fetch(`${process.env.CONTENT_SERVICE_URL}/like/count/post/${post.id}`).then(r => r.json()),
        ])
      )
    );

    const result = posts.map((post, index) => {
      const [commentsCount, likesCount] = countsResponses[index];

      return {
        id: post.id,
        content: post.content ?? null,
        image: post.image ?? null,
        pdf: post.pdf ?? null,
        userId: post.userId,
        createdAt: post.createdAt,
        modifiedAt: post.modifiedAt,
        commentsCount: commentsCount?.count ?? 0,
        likesCount: likesCount?.count ?? 0,
      };
    });

    return res.status(200).json(result);

  }
  catch (error) {
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

exports.createOnePost = async (req, res) => {
  try {
    let post = {};
    if (req.body.post) {
      try {
        post = JSON.parse(req.body.post);
      }
      catch {
        return res.status(400).json({ error: 'Invalid post data format.' });
      }
    }

    const { content } = post;

    if (!content && !req.file) {
      return res.status(400).json({ error: 'Content or media is required.' });
    }

    const image = req.file && req.file.mimetype !== 'application/pdf'
      ? `${process.env.BFF_URL}/uploads/images/${req.file.filename}`
      : null;

    const pdf = req.file && req.file.mimetype === 'application/pdf'
      ? `${process.env.BFF_URL}/uploads/pdfs/${req.file.filename}`
      : null;

    const postResponse = await fetch(`${process.env.CONTENT_SERVICE_URL}/post/`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId:  req.userId,
        content: content ?? null,
        image,
        pdf,
      }),
    });

    if (!postResponse.ok) {
      return res.status(503).json({ error: 'Content service unavailable.' });
    }

    return res.sendStatus(201);

  }
  catch (error) {
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

exports.getOnePost = async (req, res) => {
  try {
    const { postId } = req.params;

    const [postResponse, commentsCount, likesCount] = await Promise.all([
      fetch(`${process.env.CONTENT_SERVICE_URL}/post/${postId}`),
      fetch(`${process.env.CONTENT_SERVICE_URL}/comment/count/post/${postId}`).then(r => r.json()),
      fetch(`${process.env.CONTENT_SERVICE_URL}/like/count/post/${postId}`).then(r => r.json()),
    ]);

    if (postResponse.status === 404) {
      return res.status(404).json({ error: 'Post not found.' });
    }

    if (!postResponse.ok) {
      return res.status(503).json({ error: 'Content service unavailable.' });
    }

    const post = await postResponse.json();

    return res.status(200).json({
      id: post.id,
      content: post.content ?? null,
      image: post.image ?? null,
      pdf: post.pdf ?? null,
      userId: post.userId,
      createdAt: post.createdAt,
      modifiedAt: post.modifiedAt,
      commentsCount: commentsCount?.count ?? 0,
      likesCount: likesCount?.count ?? 0,
    });

  }
  catch (error) {
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

exports.modifyOnePost = async (req, res) => {
  try {
    const { postId } = req.params;

    const postCheckResponse = await fetch(`${process.env.CONTENT_SERVICE_URL}/post/${postId}`);

    if (postCheckResponse.status === 404) {
      return res.status(404).json({ error: 'Post not found.' });
    }

    if (!postCheckResponse.ok) {
      return res.status(503).json({ error: 'Content service unavailable.' });
    }

    const post = await postCheckResponse.json();

    if (post.userId !== req.userId) {
      return res.status(403).json({ error: 'Forbidden.' });
    }

    let postData = {};
    if (req.body.post) {
      try {
        postData = JSON.parse(req.body.post);
      }
      catch {
        return res.status(400).json({ error: 'Invalid post data format.' });
      }
    }

    const { content } = postData;

    const image = req.file && req.file.mimetype !== 'application/pdf'
      ? `${process.env.BFF_URL}/uploads/images/${req.file.filename}`
      : undefined;

    const pdf = req.file && req.file.mimetype === 'application/pdf'
      ? `${process.env.BFF_URL}/uploads/pdfs/${req.file.filename}`
      : undefined;

    const updateResponse = await fetch(`${process.env.CONTENT_SERVICE_URL}/post/${postId}`, {
      method:  'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...(content !== undefined && { content }),
        ...(image   !== undefined && { image }),
        ...(pdf     !== undefined && { pdf }),
      }),
    });

    if (!updateResponse.ok) {
      return res.status(503).json({ error: 'Content service unavailable.' });
    }

    return res.sendStatus(200);

  }
  catch (error) {
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

exports.deleteOnePost = async (req, res) => {
  try {
    const { postId } = req.params;

    const postCheckResponse = await fetch(`${process.env.CONTENT_SERVICE_URL}/post/${postId}`);

    if (postCheckResponse.status === 404) {
      return res.status(404).json({ error: 'Post not found.' });
    }

    if (!postCheckResponse.ok) {
      return res.status(503).json({ error: 'Content service unavailable.' });
    }

    const post = await postCheckResponse.json();

    if (post.userId !== req.userId) {
      return res.status(403).json({ error: 'Forbidden.' });
    }

    const postResponse = await fetch(`${process.env.CONTENT_SERVICE_URL}/post/${postId}`, { method: 'DELETE' });

    if (!postResponse.ok) {
      return res.status(503).json({ error: 'Content service unavailable.' });
    }

    return res.sendStatus(200);

  }
  catch (error) {
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

exports.getCommentsFromPost = async (req, res) => {
  try {
    const { postId } = req.params;
    const { date, limit } = req.query;

    const params = new URLSearchParams();
    if (date)  params.append('date',  date);
    if (limit) params.append('limit', limit);
    params.append('sort', 'desc');

    const commentsResponse = await fetch(`${process.env.CONTENT_SERVICE_URL}/comment/post/${postId}?${params}`);

    if (commentsResponse.status === 404) {
      return res.status(404).json({ error: 'Post not found.' });
    }

    if (!commentsResponse.ok) {
      return res.status(503).json({ error: 'Content service unavailable.' });
    }

    const comments = await commentsResponse.json();

    return res.status(200).json(comments);

  }
  catch (error) {
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

exports.createOneComment = async (req, res) => {
  try {
    const { postId } = req.params;
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'Content is required.' });
    }

    const postCheckResponse = await fetch(`${process.env.CONTENT_SERVICE_URL}/post/${postId}`);

    if (postCheckResponse.status === 404) {
      return res.status(404).json({ error: 'Post not found.' });
    }

    if (!postCheckResponse.ok) {
      return res.status(503).json({ error: 'Content service unavailable.' });
    }

    const commentResponse = await fetch(`${process.env.CONTENT_SERVICE_URL}/comment/`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: req.userId,
        postId,
        content,
      }),
    });

    if (!commentResponse.ok) {
      return res.status(503).json({ error: 'Content service unavailable.' });
    }

    return res.sendStatus(201);

  }
  catch (error) {
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

exports.modifyOneComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'Content is required.' });
    }

    const commentCheckResponse = await fetch(`${process.env.CONTENT_SERVICE_URL}/comment/${commentId}`);

    if (commentCheckResponse.status === 404) {
      return res.status(404).json({ error: 'Comment not found.' });
    }

    if (!commentCheckResponse.ok) {
      return res.status(503).json({ error: 'Content service unavailable.' });
    }

    const comment = await commentCheckResponse.json();

    if (comment.userId !== req.userId) {
      return res.status(403).json({ error: 'Forbidden.' });
    }

    const updateResponse = await fetch(`${process.env.CONTENT_SERVICE_URL}/comment/${commentId}`, {
      method:  'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    });

    if (!updateResponse.ok) {
      return res.status(503).json({ error: 'Content service unavailable.' });
    }

    return res.sendStatus(200);

  }
  catch (error) {
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

exports.deleteOneComment = async (req, res) => {
  try {
    const { commentId } = req.params;

    const commentCheckResponse = await fetch(`${process.env.CONTENT_SERVICE_URL}/comment/${commentId}`);

    if (commentCheckResponse.status === 404) {
      return res.status(404).json({ error: 'Comment not found.' });
    }

    if (!commentCheckResponse.ok) {
      return res.status(503).json({ error: 'Content service unavailable.' });
    }

    const comment = await commentCheckResponse.json();

    if (comment.userId !== req.userId) {
      return res.status(403).json({ error: 'Forbidden.' });
    }

    const deleteResponse = await fetch(`${process.env.CONTENT_SERVICE_URL}/comment/${commentId}`, {
      method:  'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deleted: true }),
    });

    if (!deleteResponse.ok) {
      return res.status(503).json({ error: 'Content service unavailable.' });
    }

    return res.sendStatus(200);

  }
  catch (error) {
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

exports.getLikesFromPost = async (req, res) => {
  try {
    const { postId } = req.params;

    const likesResponse = await fetch(`${process.env.CONTENT_SERVICE_URL}/like/post/${postId}`);

    if (likesResponse.status === 404) {
      return res.status(404).json({ error: 'Post not found.' });
    }

    if (!likesResponse.ok) {
      return res.status(503).json({ error: 'Content service unavailable.' });
    }

    const likes = await likesResponse.json();

    const result = likes.map(like => ({ userId: like.userId }));

    return res.status(200).json(result);
  }
  catch (error) {
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

exports.likeOnePost = async (req, res) => {
  try {
    const { postId } = req.body;

    if (!postId) {
      return res.status(400).json({ error: 'postId is required.' });
    }

    const postCheckResponse = await fetch(`${process.env.CONTENT_SERVICE_URL}/post/${postId}`);

    if (postCheckResponse.status === 404) {
      return res.status(404).json({ error: 'Post not found.' });
    }

    if (!postCheckResponse.ok) {
      return res.status(503).json({ error: 'Content service unavailable.' });
    }

    const likeResponse = await fetch(`${process.env.CONTENT_SERVICE_URL}/like/`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: req.userId,
        postId,
      }),
    });

    if (likeResponse.status === 409) {
      return res.status(409).json({ error: 'Post already liked.' });
    }

    if (!likeResponse.ok) {
      return res.status(503).json({ error: 'Content service unavailable.' });
    }

    return res.sendStatus(201);
  }
  catch (error) {
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

exports.deleteLikeFromPost = async (req, res) => {
  try {
    const { postId } = req.params;

    const postCheckResponse = await fetch(`${process.env.CONTENT_SERVICE_URL}/post/${postId}`);

    if (postCheckResponse.status === 404) {
      return res.status(404).json({ error: 'Post not found.' });
    }

    if (!postCheckResponse.ok) {
      return res.status(503).json({ error: 'Content service unavailable.' });
    }

    const deleteResponse = await fetch(`${process.env.CONTENT_SERVICE_URL}/like/post/${postId}`, {
      method:  'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ userId: req.userId }),
    });

    if (deleteResponse.status === 404) {
      return res.status(404).json({ error: 'Like not found.' });
    }

    if (!deleteResponse.ok) {
      return res.status(503).json({ error: 'Content service unavailable.' });
    }

    return res.sendStatus(200);
  }
  catch (error) {
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

