const _ = require('lodash');
const { combineResolvers } = require('graphql-resolvers');

const { db } = require('../../database/util');
const { isAuthenticated, isTaskCreator } = require('./middleware');

module.exports = {
    Query: {

        // tasks: async (parent, args, context) => { // for development sake only
        //     try {
        //         return await db.select('*').from("public.task");
        //     } catch (error) {
        //         console.log(error);
        //         throw error;
        //     }
        // },

        task: combineResolvers(isAuthenticated, isTaskCreator, async (parent, args, context) => {
            try {
                const { id } = args;
                return await db.select('*').from("public.task").where("id", id).first();
            } catch (error) {
                console.log(error);
                throw error;
            }
        }),
        userTasks: combineResolvers(isAuthenticated, async (parent, args, context) => {
            try {
                const { jwtUser: { id } } = context;
                return await db.select('*').from("public.task").where("fk_user_id", id);
            } catch (error) {
                console.log(error);
                throw error;
            }
        })
    },
    Mutation: {
        createTask: combineResolvers(isAuthenticated, async (parent, args, context) => {
            try {
                const { jwtUser: { id } } = context;
                const { input: { title, status, parentTaskId } } = args;
                const newTask = await db("public.task").returning(['id', 'title', 'status', 'fk_user_id']).insert({ title, status, fk_user_id: id });

                if (parentTaskId) {
                    await db("public.map_task_tasks").returning(['id', 'fk_parent_task_id', 'fk_sub_task_id']).insert({
                        fk_parent_task_id: parentTaskId,
                        fk_sub_task_id: newTask[0].id
                    });
                }

                return newTask[0];
            } catch (error) {
                console.log(error);
                throw error;
            }
        }),

        updateTask: combineResolvers(isAuthenticated, isTaskCreator, async (parent, args, context) => {
            try {
                const { input: { id, title, status, parentTaskId } } = args;
                const task = await db.select('*').from("public.task").where("id", id).first();
                const updatedTask = await db('public.task').where({ 'id': id }).update({
                    title: title ? title : task.title,
                    status: status ? status : task.status // resolve this when we are changeing the status to flase it's not working properly
                }, ['id', 'title', 'status', 'fk_user_id']);

                if (parentTaskId) {
                    await db('public.map_task_tasks').where({ 'fk_sub_task_id': id }).update({ fk_parent_task_id: parentTaskId }, ['id', 'fk_parent_task_id', 'fk_sub_task_id']);
                }

                return updatedTask[0];
            } catch (error) {
                console.log(error);
                throw error;
            }
        }),

        deleteTask: combineResolvers(isAuthenticated, isTaskCreator, async (parent, args, context) => {
            try {
                const { input: { id: taskId } } = args;
                const deletedTask = await db('public.task').where({ 'id': taskId }).del();
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
        },
        subTasks: async (parent, args, context) => {
            const { id: parentTaskId } = parent;
            const { loaders: { batchTask } } = context;
            let tasks = [];

            const subTaskIds = await db.select('fk_sub_task_id').from("public.map_task_tasks").where("fk_parent_task_id", parentTaskId);
            if (!_.isEmpty(subTaskIds)) {
                const taskIds = _.map(subTaskIds, task => task.fk_sub_task_id);
                tasks = await batchTask.loadMany(taskIds);
            }

            return tasks;
        },
    }
};
