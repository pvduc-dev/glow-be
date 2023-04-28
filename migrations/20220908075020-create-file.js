'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Files', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      fieldname: {
        allowNull: true,
        type: Sequelize.STRING
      },
      originalname: {
        allowNull: true,
        type: Sequelize.STRING
      },
      encoding: {
        allowNull: true,
        type: Sequelize.STRING
      },
      mimetype: {
        allowNull: true,
        type: Sequelize.STRING
      },
      destination: {
        allowNull: true,
        type: Sequelize.STRING
      },
      filename: {
        allowNull: true,
        type: Sequelize.STRING
      },
      path: {
        allowNull: false,
        type: Sequelize.STRING
      },
      size: {
        allowNull: true,
        type: Sequelize.DOUBLE
      },
      model: {
        type: Sequelize.STRING
      },
      referenceId: {
        allowNull: true,
        type: Sequelize.INTEGER
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: new Date()
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: new Date()
      }
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('Files');
  }
};