const _ = require('lodash');
const { combineResolvers } = require('graphql-resolvers');

const { db } = require('../../database/util');
const { isAuthenticated } = require('./middleware');
const { createAuthToken, comparePassword, hashPassword } = require('../../service/auth');

module.exports = {

    Query: {
        users: async (parent, args, context) => {  // for development sake only
            return await db.select('*').from("public.User");
        },
        user: combineResolvers(isAuthenticated, async (parent, args, context) => {
            try {
                const { jwtUser: { email } } = context;
                const user = await db.select('*').from("public.User").where("email", email).first();
                if (!user) {
                    throw new Error('User not found!');
                }
                return user;
            } catch (error) {
                console.log(error);
                throw error;
            }
        })
    },

    Mutation: {
        signUp: async (parent, args, context) => {
            try {
                const { input: { name, email, password } } = args;
                const user = await db.select('*').from("public.User").where("email", email).first();
                if (user) {
                    throw new Error('Email already in use!!');
                }
                const hashedPassword = await hashPassword(password);
                const returnedData = await db("public.User").returning(['id', 'name', 'email', 'tasks']).insert({ name, email, password: hashedPassword });
                return returnedData[0];
            } catch (error) {
                console.log(error);
                throw error;
            }
        },
        logIn: async (parent, args, context) => {
            try {
                const { input: { email, password } } = args;
                const user = await db.select('*').from("public.User").where("email", email).first();
                if (!user) {
                    throw new Error("User doesn't exist!!");
                }

                const validPassword = await comparePassword(user.password, password);
                if (!validPassword) {
                    throw new Error("Incorrect Password!!");
                }

                const token = await createAuthToken({ id: user.id, email });
                return { token };
            } catch (error) {
                console.log(error);
                throw error;
            }
        },
        updateUser: combineResolvers(isAuthenticated, async (parent, args, context) => {
            try {
                const { input: { name, email, password } } = args;
                const { jwtUser: { id } } = context;
                const user = await db.select('*').from("public.User").where("id", id).first();
                const hashedPassword = password ? await hashPassword(password) : null;
                const updatedUser = await db('public.User').where({ 'id': id }).update({
                    name: name ? name : user.name,
                    email: email ? email : user.email,
                    password: password ? hashedPassword : user.password
                }, ['id', 'name', 'email', 'tasks']);
                return updatedUser[0];
            } catch (error) {
                console.log(error);
                throw error;
            }
        }),
        deleteUser: combineResolvers(isAuthenticated, async (parent, args, context) => {
            try {
                const { jwtUser: { id } } = context;
                const deletedUser = await db('public.User').where({ id: id }).del();
                await db('public.Task').where({ fk_user_id: id }).del();
                return deletedUser == 1 ? true : false;
            } catch (error) {
                console.log(error);
                throw error;
            }
        }),
    },
    User: {
        id: (parent, args, context) => parent.id,
        name: (parent, args, context) => parent.name,
        email: (parent, args, context) => parent.email,
        tasks: async (parent, args, context) => {
            const { tasks: userTasks } = parent;
            const { loaders: { batchTask } } = context;
            let tasks = [];

            if (!_.isEmpty(userTasks)) {
                const taskIds = _.map(userTasks, task => task);
                tasks = await batchTask.loadMany(taskIds);
            }

            return tasks;
        },
    }
};