const { gql } = require('apollo-server-express');

module.exports = gql`
    extend type Query {
        tasks: [Task!]
        userTasks: [Task!]
        task(id: Int!): Task
    }

    extend type Mutation {
        createTask(input: createTaskInput!): Task
        updateTask(input: updateTaskInput!): Task!
        deleteTask(input: deleteTaskInput!): Boolean!
    }

    type Task {
        id: Int!
        title: String! 
        status: Boolean!
        user: User!
        subTasks: [Task!]
    }

    input createTaskInput {
        title: String!
        status: Boolean!
        parentTaskId: Int
    }

    input updateTaskInput {
        id: Int!
        title: String
        status: Boolean
        parentTaskId: ID
    }

    input deleteTaskInput {
        id: Int!
    }
`;
