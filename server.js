const cors = require('cors');
const dotEnv = require('dotenv');
const express = require('express');
const DataLoader = require('dataloader');
const { ApolloServer } = require('apollo-server-express');

const typeDefs = require('./schema/queryType');
const resolvers = require('./schema/resolvers');
const loaders = require('./schema/dataloaders');
const { verifyUserAuth } = require('./service/auth');

// set env variables
dotEnv.config();

const app = express();

//cors
app.use(cors());

// body parser middleware
app.use(express.json());

const apolloServer = new ApolloServer({
    typeDefs,
    resolvers,
    context: async ({ req }) => {
        const jwtUser = await verifyUserAuth(req);
        return {
            jwtUser: jwtUser,
            loaders: {
                batchUser: new DataLoader((keys) => loaders.user.batchUsers(keys)),
                batchTask: new DataLoader((keys) => loaders.task.batchTasks(keys)),
            }
        }
    }
});

apolloServer.applyMiddleware({ app, path: '/graphql' });

const PORT = process.env.PORT || 4000;

app.use('/', (req, res, next) => {
    res.send({ message: `Go to http://localhost:${PORT}${apolloServer.graphqlPath}` });
});

app.listen(PORT, () => {
    console.log(`🚀 Server Running on http://localhost:${PORT}`);
    console.log(`🚀 Graphql Endpoint: http://localhost:${PORT}${apolloServer.graphqlPath}`);
});
