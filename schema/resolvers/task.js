const _ = require('lodash');
const { combineResolvers } = require('graphql-resolvers');

const { db } = require('../../database/util');
const { isAuthenticated, isTaskCreator } = require('./middleware');

module.exports = {
    Query: {
        tasks: async (parent, args, context) => { // for development sake only
            try {
                return await db.select('*').from("public.Task");
            } catch (error) {
                console.log(error);
                throw error;
            }
        },
        userTasks: combineResolvers(isAuthenticated, async (parent, args, context) => {
            try {
                const { jwtUser: { id } } = context;
                return await db.select('*').from("public.Task").where("fk_user_id", id);
            } catch (error) {
                console.log(error);
                throw error;
            }
        }),
        task: combineResolvers(isAuthenticated, isTaskCreator, async (parent, args, context) => {
            try {
                const { id } = args;
                return await db.select('*').from("public.Task").where("id", id).first();
            } catch (error) {
                console.log(error);
                throw error;
            }
        }),
    },
    Mutation: {
        createTask: combineResolvers(isAuthenticated, async (parent, args, context) => {
            try {
                const { jwtUser: { id } } = context;
                const { input: { title, status } } = args;
                const newTask = await db("public.Task").returning(['id', 'title', 'status', 'fk_user_id']).insert({ title, status, fk_user_id: id });

                const user = await db('public.User').where({ id: id }).first();
                const userTasks = _.get(user, 'tasks');
                const newTasks = [...userTasks, newTask[0].id]

                await db('public.User').where({ id: id }).update({ tasks: newTasks });
                return newTask[0];
            } catch (error) {
                console.log(error);
                throw error;
            }
        }),
        updateTask: combineResolvers(isAuthenticated, isTaskCreator, async (parent, args, context) => {
            try {
                const { input: { id, title, status } } = args;
                const task = await db.select('*').from("public.Task").where("id", id).first();
                const updatedTask = await db('public.Task').where({ 'id': id }).update({
                    title: title ? title : task.title,
                    status: status ? status : task.status // resolve this when we are changeing the status to flase it's not working properly
                }, ['id', 'title', 'fk_user_id', 'status']);
                return updatedTask[0];
            } catch (error) {
                console.log(error);
                throw error;
            }
        }),
        deleteTask: combineResolvers(isAuthenticated, isTaskCreator, async (parent, args, context) => {
            try {
                const { input: { id: taskId } } = args;
                const { jwtUser: { id } } = context;
                const deletedTask = await db('public.Task').where({ 'id': taskId }).del();

                const user = await db('public.User').where({ 'id': id }).first();
                const userTasks = _.get(user, 'tasks');
                _.pull(userTasks, _.toInteger(taskId));

                await db('public.User').where({ 'id': id }).update({ tasks: userTasks })
                return deletedTask == 1 ? true : false;
            } catch (error) {
                console.log(error);
                throw error;
            }
        }),
    },
    Task: {
        id: (parent, args, context) => parent.id,
        title: (parent, args, context) => parent.title,
        status: (parent, args, context) => parent.status,
        user: async (parent, args, context) => {
            const { fk_user_id: id } = parent;
            const { loaders: { batchUser } } = context;
            return await batchUser.load(id);
        }
    }
};
