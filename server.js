const cors = require('cors');
const dotEnv = require('dotenv');
const express = require('express');
const { applyMiddleware } = require('graphql-middleware');
const { ApolloServer, makeExecutableSchema } = require('apollo-server-express');

const typeDefs = require('./schema/queryType');
const loaders = require('./schema/dataloaders');
const resolvers = require('./schema/resolvers');
const { verifyUserAuth } = require('./service/auth');
const { permissions } = require('./service/permissions');

// set env variables
dotEnv.config();

const app = express();

//cors
app.use(cors());

// body parser middleware
app.use(express.json());

const schema = makeExecutableSchema({ typeDefs, resolvers });
const schemaWithPermissions = applyMiddleware(schema, permissions);

const apolloServer = new ApolloServer({
    schema: schemaWithPermissions,
    context: async ({ req }) => {
        const jwtUser = await verifyUserAuth(req);
        return { jwtUser, loaders }
    }
});

apolloServer.applyMiddleware({ app, path: '/graphql' });

const PORT = process.env.PORT || 4000;

app.use('/', (req, res) => {
    res.send(`<form action="http://localhost:${PORT}${apolloServer.graphqlPath}"><input type="submit" value="GraphQL" style="width:100px" /></form>`);
});

app.listen(PORT, () => {
    console.log(`🚀 Server Running on http://localhost:${PORT}`);
    console.log(`🚀 Graphql Endpoint: http://localhost:${PORT}${apolloServer.graphqlPath}`);
});
