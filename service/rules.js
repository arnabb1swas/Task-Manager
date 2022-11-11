const validator = require('validator');
const { rule } = require('graphql-shield');

const { getUserById, getTaskById } = require('../database/models');

module.exports.isAuthenticated = rule({ cache: 'contextual' })(async (parent, args, context, info) => {
    const { jwtUser } = context;

    if (!jwtUser || !jwtUser.id) {
        return new Error('ACCESS DENIED! LOGIN TO CONTINUE');
    }

    const user = await getUserById({ id: jwtUser.id });
    if (!user) {
        return new Error("USER NOT FOUND");
    }

    return true;
});

module.exports.isAdmin = rule({ cache: 'contextual' })(async (parent, args, context, info) => {
    const { jwtUser: { role } } = context;
    if (role !== 'ADMIN') {
        return new Error('USER IS NOT AN ADMIN');
    }

    return true;
});

module.exports.isTaskCreator = rule({ cache: 'strict' })(async (parent, args, context, info) => {
    const { jwtUser } = context;
    const { input: { id } } = args;
    const task = await getTaskById({ id });

    if (!task) {
        return new Error('TASK NOT FOUND');
    } else if (jwtUser.id !== task.fk_user_id) {
        return new Error('UNAUTHORIZED TASK CREATOR');
    }

    return true;
});

module.exports.isValidEmail = rule({ cache: 'strict' })(async (parent, args, context, info) => {
    const { input: { email } } = args;
    const isValidEmail = validator.isEmail(email);
    if (!isValidEmail) {
        return new Error("INVALID EMAIL");
    }

    return true;
});
