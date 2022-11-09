const _ = require('lodash');
const { combineResolvers } = require('graphql-resolvers');

const { db } = require('../../database/util');
const { encodeToBase64, decodeFromBase64 } = require('../../service/auth');
const { isAuthenticated, isTaskCreator, isAdmin } = require('./middleware');

module.exports = {

    Query: {
        tasks: combineResolvers(isAuthenticated, isAdmin, async (parent, args, context) => {
            try {
                const { filter: { limit, hasDeleted = false, sortBy = 'ASC' }, cursor } = args;

                let query = db.select('*').from("public.task");

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

                let tasks = await query;
                if (!tasks) {
                    throw new Error("No Task Found!!");
                }

                const hasNextPage = tasks.length > limit;
                const nextPageCursor = hasNextPage ? encodeToBase64(tasks[tasks.length - 1].id) : null;
                tasks = hasNextPage ? tasks.slice(0, -1) : tasks;

                return {
                    taskFeed: tasks,
                    pageInfo: { nextPageCursor, hasNextPage }
                };
            } catch (error) {
                console.log(error);
                throw error;
            }
        }),
        userTasks: combineResolvers(isAuthenticated, async (parent, args, context) => {
            try {
                const { jwtUser: { id } } = context;
                const { filter: { limit, sortBy = 'ASC' }, cursor } = args;

                let query = db.select('*').from("public.task").where("fk_user_id", id).whereNull('deleted_at');

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

                let userTasks = await query;
                if (!userTasks) {
                    throw new Error("No Task Found!!");
                }

                const hasNextPage = userTasks.length > limit;
                const nextPageCursor = hasNextPage ? encodeToBase64(userTasks[userTasks.length - 1].id) : null;
                userTasks = hasNextPage ? userTasks.slice(0, -1) : userTasks;

                return {
                    taskFeed: userTasks,
                    pageInfo: { nextPageCursor, hasNextPage }
                };
            } catch (error) {
                console.log(error);
                throw error;
            }
        }),
        task: combineResolvers(isAuthenticated, isTaskCreator, async (parent, args, context) => {
            try {
                const { id } = args;
                const task = await db.select('*').from("public.task").where("id", id).whereNull('deleted_at').first();
                return task;
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
                const { input: { title, taskStatus, parentTaskId } } = args;
                const newTask = await db("public.task").returning(['id', 'title', 'task_status', 'fk_user_id']).insert({ title, task_status: taskStatus, fk_user_id: id });

                if (parentTaskId) {
                    await db("public.map_parent_sub_task").returning(['id', 'fk_parent_task_id', 'fk_sub_task_id']).insert({
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
                const { input: { id, title, taskStatus, parentTaskId } } = args;

                const updateTaskInput = {};
                if (title) {
                    updateTaskInput['title'] = title;
                }
                if (taskStatus) {
                    updateTaskInput['task_status'] = taskStatus;
                }

                const updatedTask = await db('public.task').where({ 'id': id }).update(updateTaskInput, ['id', 'title', 'task_status', 'fk_user_id']);

                if (parentTaskId) {
                    await db('public.map_parent_sub_task')
                        .where({ 'fk_sub_task_id': id })
                        .update({ fk_parent_task_id: parentTaskId }, ['id', 'fk_parent_task_id', 'fk_sub_task_id']);
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
                const deleted_at = new Date(Date.now()).toISOString();
                const deletedTask = await db('public.task').where({ 'id': taskId }).update({ deleted_at }, ['id', 'title', 'task_status', 'fk_user_id']);
                await db('public.map_parent_sub_task').where('fk_sub_task_id', taskId).orWhere('fk_parent_task_id', taskId).update({ deleted_at }, ['id']);

                return deletedTask[0];
            } catch (error) {
                console.log(error);
                throw error;
            }
        }),
    },

    Task: {
        id: (parent, args, context) => parent.id,
        title: (parent, args, context) => parent.title,
        taskStatus: (parent, args, context) => parent.task_status,
        user: async (parent, args, context) => {
            try {
                const { fk_user_id: id } = parent;
                const { loaders: { batchUser } } = context;
                const user = await batchUser.load(id);
                return user;
            } catch (error) {
                console.log(error);
                throw error;
            }
        },
        subTasks: async (parent, args, context) => {
            try {
                const { id: parentTaskId } = parent;
                const { loaders: { batchTask } } = context;
                let tasks = [];

                const subTaskIds = await db.select('fk_sub_task_id').from("public.map_parent_sub_task").where("fk_parent_task_id", parentTaskId).whereNull('deleted_at');
                if (!_.isEmpty(subTaskIds)) {
                    const taskIds = _.map(subTaskIds, task => task.fk_sub_task_id);
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
