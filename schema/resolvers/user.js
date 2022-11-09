const _ = require('lodash');
const { combineResolvers } = require('graphql-resolvers');

const { db } = require('../../database/util');
const { isAuthenticated, isAdmin } = require('./middleware');
const { createAuthToken, comparePassword, hashPassword, encodeToBase64, decodeFromBase64 } = require('../../service/auth');

module.exports = {

    Query: {
        users: combineResolvers(isAuthenticated, isAdmin, async (parent, args, context) => {
            try {
                const { filter: { limit, hasDeleted = false, sortBy = 'ASC' }, cursor } = args;

                let query = db.select('id', 'name', 'email').from("public.user");

                if (!hasDeleted) {
                    query.whereNull('deleted_at')
                }
                if (cursor) {
                    const operator = sortBy === 'ASC' ? '>=' : '<=';
                    query.andWhere('id', operator, decodeFromBase64(cursor))
                }
                if (limit) {
                    query.limit(limit + 1)
                }
                if (sortBy) {
                    query.orderBy('id', _.toLower(sortBy))
                }

                let users = await query;
                if (!users) {
                    throw new Error('User not found!');
                }

                const hasNextPage = users.length > limit;
                const nextPageCursor = hasNextPage ? encodeToBase64(users[users.length - 1].id) : null;
                users = hasNextPage ? users.slice(0, -1) : users;

                return {
                    userFeed: users,
                    pageInfo: { nextPageCursor, hasNextPage }
                };
            } catch (error) {
                console.log(error);
                throw error;
            }
        }),
        user: combineResolvers(isAuthenticated, async (parent, args, context) => {
            try {
                const { jwtUser: { id } } = context;
                const user = await db.select('*').from("public.user").where("id", id).whereNull('deleted_at').first();
                if (!user) {
                    throw new Error('User not found!');
                }
                return user;
            } catch (error) {
                console.log(error);
                throw error;
            }
        }),
    },

    Mutation: {
        signUp: async (parent, args, context) => {
            try {
                const { input: { name, email, password, role } } = args;
                const user = await db.select('*').from("public.user").where("email", email).whereNull('deleted_at').first();
                if (user) {
                    throw new Error('Email already in use!!');
                }
                const hashedPassword = await hashPassword(password);
                const returnedData = await db("public.user").returning(['id', 'name', 'email', 'role']).insert({ name, email, password: hashedPassword, role });
                const token = await createAuthToken({ id: returnedData[0].id, role: returnedData[0].role });

                return { token, user: returnedData[0] };
            } catch (error) {
                console.log(error);
                throw error;
            }
        },
        logIn: async (parent, args, context) => {
            try {
                const { input: { email, password } } = args;
                const user = await db.select('*').from("public.user").where("email", email).whereNull('deleted_at').first();
                if (!user) {
                    throw new Error("User doesn't exist!!");
                }

                const validPassword = await comparePassword(user.password, password);
                if (!validPassword) {
                    throw new Error("Incorrect Password!!");
                }

                const token = await createAuthToken({ id: user.id, role: user.role });
                return { token, user };
            } catch (error) {
                console.log(error);
                throw error;
            }
        },
        updateUser: combineResolvers(isAuthenticated, async (parent, args, context) => {
            try {
                const { input: { name, email, password } } = args;
                const { jwtUser: { id } } = context;
                const updateUserInput = {};
                if (name) {
                    updateUserInput['name'] = name;
                }
                if (email) {
                    updateUserInput['email'] = email;
                }
                if (password) {
                    updateUserInput['password'] = await hashPassword(password);
                }

                const updatedUser = await db('public.user').where({ 'id': id }).update(updateUserInput, ['id', 'name', 'email']);
                return updatedUser[0];
            } catch (error) {
                console.log(error);
                throw error;
            }
        }),
        deleteUser: combineResolvers(isAuthenticated, async (parent, args, context) => {
            try {
                const { jwtUser: { id } } = context;
                const deleted_at = new Date(Date.now()).toISOString();
                const deletedUser = await db('public.user').where({ 'id': id }).update({ deleted_at }, ['id', 'name', 'email', 'deleted_at']);
                if (_.isNull(deletedUser[0].deleted_at)) {
                    return false;
                }

                const tasksId = await db('public.task').where({ 'fk_user_id': id }).update({ deleted_at }, ['id']);
                const taskIds = _.map(tasksId, task => task.id);
                await db('public.map_parent_sub_task').whereIn('fk_sub_task_id', taskIds).orWhereIn('fk_parent_task_id', taskIds).update({ deleted_at }, ['id']);

                return true;
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
            try {
                const { id } = parent;
                const { loaders: { batchTask, batchUserTasksId } } = context;
                let tasks = [];

                const userTaskIds = await batchUserTasksId.load(id);
                if (!_.isEmpty(userTaskIds)) {
                    const taskIds = _.map(userTaskIds, task => task.id);
                    tasks = await batchTask.loadMany(taskIds);
                }

                return tasks;
            } catch (error) {
                console.log(error);
                throw error;
            }
        },
    }
};
