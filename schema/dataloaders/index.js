const DataLoader = require('dataloader');

const user = require('./user');
const task = require('./task');

module.exports = {
    batchUser: new DataLoader((keys) => user.batchUsers(keys)),
    batchTask: new DataLoader((keys) => task.batchTasks(keys)),
    batchSubTasksId: new DataLoader((keys) => task.batchSubTasksId(keys)),
    batchUserTasksId: new DataLoader((keys) => task.batchUserTasksId(keys)),
}
