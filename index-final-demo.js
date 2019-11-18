const { ApolloServer, gql } = require("apollo-server");
const { RESTDataSource } = require("apollo-datasource-rest");

class PostsRESTSource extends RESTDataSource {
  async getAllBlogPosts() {
    try {
      const posts = await this.get(
        "https://75f99-3000.sse.codesandbox.io/posts",
        null,
        { cacheOptions: { ttl: 3600 } }
      );
      if (posts.length < 1) return [];
      return posts;
    } catch (error) {
      console.log(error);
    }
  }
}

// Construct a schema, using GraphQL schema language
const typeDefs = gql`
  type BlogPost {
    id: ID!
    title: String
    body: String
  }
  type Query {
    posts: [BlogPost]
  }
`;

// Provide resolver functions for your schema fields
const resolvers = {
  Query: {
    getBlogPosts: async (root, args, context) =>
      context.dataSources.postsApi.getAllBlogPosts()
  }
};

const dataSources = () => ({
  postsApi: new PostsRESTSource()
});

const server = new ApolloServer({
  typeDefs,
  resolvers,
  dataSources,
  mocks: false
});

server.listen().then(({ url }) => {
  console.log(`🚀 Server ready at ${url}`);
});
