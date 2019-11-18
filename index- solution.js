const { ApolloServer, gql } = require("apollo-server");
const { RESTDataSource } = require("apollo-datasource-rest");

class PostsRESTSource extends RESTDataSource {
  async getAllBlogPosts() {
    try {
      const posts = await this.get(
        "https://75f99-3000.sse.codesandbox.io/posts",
        null,
        { cacheOptions: { ttl: 30 } }
      );
      if (posts.length < 1) return [];
      return posts;
    } catch (error) {
      console.log(error);
    }
  }

  async getAllBlogPostByUserId(userId) {
    try {
      const posts = await this.get(
        `https://75f99-3000.sse.codesandbox.io/posts?filter=userId=${userId}`,
        null,
        { cacheOptions: { ttl: 30 } }
      );
      if (posts.length < 1) return [];
      return posts;
    } catch (error) {
      console.log(error);
    }
  }
}

class UsersRESTSource extends RESTDataSource {
  async getAllUsers() {
    try {
      const users = await this.get(
        "https://75f99-3000.sse.codesandbox.io/users",
        null,
        { cacheOptions: { ttl: 30 } }
      );
      if (users.length < 1) return [];
      return users;
    } catch (error) {
      console.log(error);
    }
  }
  async getUserById(id) {
    try {
      const user = await this.get(
        `https://75f99-3000.sse.codesandbox.io/users/${id}`
      );
      return user;
    } catch (error) {
      console.log(error);
    }
  }
}

class CommentsRESTSource extends RESTDataSource {
  async getAllComments() {
    try {
      const comments = await this.get(
        "https://75f99-3000.sse.codesandbox.io/comments",
        null,
        { cacheOptions: { ttl: 30 } }
      );
      if (comments.length < 1) return [];
      return comments;
    } catch (error) {
      console.log(error);
    }
  }

  async getAllCommentsByPostId(postId) {
    try {
      const comments = await this.get(
        `https://75f99-3000.sse.codesandbox.io/comments?postId=${postId}`
      );
      return {
        count: comments.length,
        edges: comments.map(comment => ({
          node: { ...comment }
        }))
      };
    } catch (error) {
      console.log(error);
    }
  }
}

// Construct a schema, using GraphQL schema language
const typeDefs = gql`
  type PostCommentsConnection {
    count: Int
    edges: [CommentEdge]
  }
  type CommentEdge {
    node: Comment
  }
  type Comment {
    id: ID!
    postId: String
    name: String
    email: String
    body: String
  }
  type Company {
    name: String
    catchPhrase: String
    bs: String
  }
  type Coordinate {
    lat: String
    lng: String
  }
  type Address {
    street: String
    suite: String
    city: String
    zipcode: String
    geo: Coordinate
  }
  type User {
    id: ID!
    name: String
    username: String
    address: Address
    phone: String
    website: String
    company: Company
    posts: [BlogPost]
  }
  type BlogPost {
    id: ID!
    title: String
    body: String
    userId: String
    author: User
    comments: PostCommentsConnection
  }
  type Query {
    posts: [BlogPost]
    users: [User]
    comments: [Comment]
    userById(userId: ID!): User
  }
`;

// Provide resolver functions for your schema fields
const resolvers = {
  Query: {
    posts: async (root, args, context) =>
      context.dataSources.postsApi.getAllBlogPosts(),
    users: async (root, args, context) =>
      context.dataSources.usersApi.getAllUsers(),
    comments: async (root, args, context) =>
      context.dataSources.commentsApi.getAllComments(),
    userById: async (root, args, context) =>
      context.dataSources.usersApi.getUserById(args.userId)
  },
  BlogPost: {
    author: async (root, args, context) =>
      context.dataSources.usersApi.getUserById(root.userId),
    comments: async (root, args, context) =>
      context.dataSources.commentsApi.getAllCommentsByPostId(root.id)
  },
  User: {
    // posts: async (root, args, context) =>
    //   // this will will do one request per user
    //   context.dataSources.postsApi.getAllBlogPostByUserId(root.id)
    posts: async (root, args, context) => {
      // reusing cached response
      const allPosts = await context.dataSources.postsApi.getAllBlogPosts();
      const posts = Object.values(allPosts);
      return posts.filter(p => p.userId === root.id);
    }
  }
};

const dataSources = () => ({
  postsApi: new PostsRESTSource(),
  usersApi: new UsersRESTSource(),
  commentsApi: new CommentsRESTSource()
});

const formatError = error => {
  console.log(error);
  return error;
};

const formatResponse = response => {
  return response;
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
  dataSources,
  formatError,
  formatResponse,
  mocks: false
});

server.listen().then(({ url }) => {
  console.log(`🚀 Server ready at ${url}`);
});
