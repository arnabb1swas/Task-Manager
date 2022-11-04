const { gql } = require('apollo-server-express');

module.exports = gql`
    extend type Query {
        tasks: [Task!]
        userTasks: [Task!]
        task(id: ID!): Task
    }

    extend type Mutation {
        createTask(input: createTaskInput!): Task
        updateTask(input: updateTaskInput!): Task!
        deleteTask(input: deleteTaskInput!): Boolean!
    }

    type Task {
        id: ID!
        user: User!
        title: String! 
        status: Boolean!
    }

    input createTaskInput {
        title: String!
        status: Boolean!
    }

    input updateTaskInput {
        id: ID!
        title: String
        status: Boolean
    }

    input deleteTaskInput {
        id: ID!
    }
`;