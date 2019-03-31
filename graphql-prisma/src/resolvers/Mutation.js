import uuidv4 from 'uuid/v4';

const Mutation = {
  async createUser(parent, args, {
    prisma
  }, info) {
    // const emailTaken = await prisma.exists.User({
    //   email: args.data.email
    // });

    // if (emailTaken) throw new Error("Email taken");

    // code above not necessary, left for reference sake

    // info ensures that whatever selection set was asked for comes back
    const user = await prisma.mutation.createUser({
      data: args.data
    }, info)

    return user;
  },

  async deleteUser(parent, args, {
    prisma
  }, info) {
    // const userExists = await prisma.exists.User({
    //   id: args.id
    // });

    // if (!userExists) throw new Error("User not found");

    // code above not necessary, left for reference sake

    return await prisma.mutation.deleteUser({
      where: {
        id: args.id
      }
    }, info);
  },

  updateUser(parent, args, {
    prisma
  }, info) {
    return prisma.mutation.updateUser({
      where: {
        id: args.id
      },
      data: args.data
    }, info)
  },

  createPost(parent, args, {
    prisma,
  }, info) {

    return prisma.mutation.createPost({
      data: {
        title: args.data.title,
        body: args.data.body,
        published: args.data.published,
        author: {
          connect: {
            id: args.data.author
          }
        }
      }
    }, info)

  },

  async deletePost(parent, args, {
    prisma
  }, info) {
    return await prisma.mutation.deletePost({
      where: {
        id: args.id
      }
    }, info)
  },

  updatePost(parent, {
    id,
    data
  }, {
    prisma
  }, info) {
    return prisma.mutation.updatePost({
      where: {
        id: args.id
      },
      data: args.data
    }, info)
  },

  createComment(parent, args, {
    db,
    pubsub
  }, info) {
    const userExists = db.users.some(user => user.id === args.data.author);
    const postExists = db.posts.some(post => post.id === args.data.post && post.published)

    if (!userExists) throw new Error("User not found");
    if (!postExists) throw new Error("Post not found");

    const comment = {
      id: uuidv4(),
      ...args.data
    };

    db.comments.push(comment);
    // pubsub.publish takes in the channel name and a property which matches the subscription name and the value being the latest update e.g. const comment
    pubsub.publish(`comment ${args.data.post}`, {
      comment: {
        mutation: 'CREATED',
        data: comment
      }
    });

    return comment;
  },

  deleteComment(parent, args, {
    db,
    pubsub
  }, info) {
    const commentIndex = db.comments.findIndex(comment => comment.id === args.id);

    if (commentIndex === -1) throw new Error("Comment not found");

    const [deletedComment] = db.comments.splice(commentIndex, 1);

    pubsub.publish(`comment ${deletedComment.post}`, {
      comment: {
        mutation: "DELETED",
        data: deletedComment
      }
    });

    return deletedComment;
  },

  updateComment(parent, {
    id,
    data
  }, {
    db,
    pubsub
  }, info) {
    const comment = db.comments.find(comment => comment.id === id);

    if (!comment) throw new Error("Comment not found");

    if (typeof data.text === "string") comment.text = data.text;

    pubsub.publish(`comment ${comment.post}`, {
      comment: {
        mutation: 'UPDATED',
        data: comment
      }
    })
    return comment;
  }
};

export {
  Mutation as
  default
};