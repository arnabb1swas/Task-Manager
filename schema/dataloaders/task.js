const _ = require('lodash');

const { getBatchTasks, getBatchSubTasksId, getBatchUserTasksId } = require('../../database/models/task');

module.exports.batchTasks = async (keys) => {
    try {
        keys = keys.map(Number);
        const tasks = await getBatchTasks({ keys });

        return keys.map(key => tasks.find(task => task.id === key));
    } catch (error) {
        console.log(error);
        throw error;
    }
};

module.exports.batchSubTasksId = async (keys) => {
    try {
        keys = keys.map(Number);
        const userTasksId = await getBatchSubTasksId({ keys });
        return keys.map(key => userTasksId.find(task => task.fk_parent_task_id === key));
    } catch (error) {
        console.log(error);
        throw error;
    }
};

module.exports.batchUserTasksId = async (keys) => {
    try {
        keys = keys.map(Number);
        const userTasksId = await getBatchUserTasksId({ keys });
        const group = _.groupBy(userTasksId, user => user.fk_user_id);
        return keys.map(key => {
            if (group[key]) {
                return group[key];
            }
            return [];
        });
    } catch (error) {
        console.log(error);
        throw error;
    }
};
