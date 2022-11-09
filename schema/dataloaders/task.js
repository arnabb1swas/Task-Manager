const _ = require('lodash');
const { db } = require('../../database/util');

module.exports.batchTasks = async (keys) => {
    try {
        keys = keys.map(Number);
        const tasks = await db("public.task").select("*").whereIn("id", keys).whereNull('deleted_at');
        return keys.map(key => tasks.find(task => task.id === key));
    } catch (error) {
        console.log(error);
        throw error;
    }
};

module.exports.batchSubTasksId = async (keys) => {
    try {
        keys = keys.map(Number);
        const userTasksId = await db("public.map_parent_sub_task").select("*").whereIn("fk_parent_task_id", keys).whereNull('deleted_at');
        return keys.map(key => userTasksId.find(task => task.fk_parent_task_id === key));
    } catch (error) {
        console.log(error);
        throw error;
    }
};

module.exports.batchUserTasksId = async (keys) => {
    try {
        keys = keys.map(Number);
        const userTasksId = await db("public.task").select("id", "fk_user_id").whereIn("fk_user_id", keys).whereNull('deleted_at');
        const group = _.groupBy(userTasksId, user => user.fk_user_id);
        return _.map(keys, key => group[key]);
    } catch (error) {
        console.log(error);
        throw error;
    }
};
