exports.getFollowers = async (req, res) => {
  try {
    const followersResponse = await fetch(`${process.env.SOCIAL_SERVICE_URL}/followers/${req.userId}`);

    if (!followersResponse.ok) {
      return res.status(503).json({ error: 'Social service unavailable.' });
    }

    const followers = await followersResponse.json();

    if (followers.length === 0) {
      return res.status(200).json([]);
    }

    const usersResponses = await Promise.all(
      followers.map(follower =>
        fetch(`${process.env.USER_SERVICE_URL}/${follower.userId}`).then(r => r.json())
      )
    );

    const result = usersResponses.map(user => ({
      id:        user.id,
      username:  user.username,
      firstName: user.firstName,
      lastName:  user.lastName,
      avatar:    user.avatar,
    }));

    return res.status(200).json(result);

  }
  catch (error) {
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

exports.getFriends = async (req, res) => {
  try {
    const friendsResponse = await fetch(`${process.env.SOCIAL_SERVICE_URL}/friends/${req.userId}`);

    if (!friendsResponse.ok) {
      return res.status(503).json({ error: 'Social service unavailable.' });
    }

    const friends = await friendsResponse.json();

    if (friends.length === 0) {
      return res.status(200).json([]);
    }

    const usersResponses = await Promise.all(
      friends.map(friend =>
        fetch(`${process.env.USER_SERVICE_URL}/${friend.friendId}`).then(r => r.json())
      )
    );

    const result = usersResponses.map(user => ({
      id:        user.id,
      username:  user.username,
      firstName: user.firstName,
      lastName:  user.lastName,
      avatar:    user.avatar,
    }));

    return res.status(200).json(result);

  }
  catch (error) {
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

exports.followUser = async (req, res) => {
  try {
    const { userId } = req.params;

    if (req.userId === userId) {
      return res.status(400).json({ error: 'You cannot follow yourself.' });
    }

    const userCheckResponse = await fetch(`${process.env.USER_SERVICE_URL}/${userId}`);

    if (userCheckResponse.status === 404) {
      return res.status(404).json({ error: 'User not found.' });
    }

    if (!userCheckResponse.ok) {
      return res.status(503).json({ error: 'User service unavailable.' });
    }

    const socialResponse = await fetch(`${process.env.SOCIAL_SERVICE_URL}/`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId:   req.userId,
        friendId: userId,
      }),
    });

    if (socialResponse.status === 409) {
      return res.status(409).json({ error: 'Already following this user.' });
    }

    if (!socialResponse.ok) {
      return res.status(503).json({ error: 'Social service unavailable.' });
    }

    return res.sendStatus(201);

  }
  catch (error) {
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

exports.unfollowUser = async (req, res) => {
  try {
    const { userId: friendId } = req.params;

    if (req.userId === friendId) {
      return res.status(400).json({ error: 'You cannot unfollow yourself.' });
    }

    const socialResponse = await fetch(`${process.env.SOCIAL_SERVICE_URL}/user/${req.userId}/friend/${friendId}`, {
      method: 'DELETE',
    });

    if (socialResponse.status === 404) {
      return res.status(404).json({ error: 'You are not following this user.' });
    }

    if (!socialResponse.ok) {
      return res.status(503).json({ error: 'Social service unavailable.' });
    }

    return res.sendStatus(200);
  }
  catch (error) {
    return res.status(500).json({ error: 'Internal server error.' });
  }
};