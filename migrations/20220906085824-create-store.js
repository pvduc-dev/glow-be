'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Stores', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      name: {
        allowNull: false,
        type: Sequelize.STRING
      },
      code: {
        allowNull: true,
        type: Sequelize.STRING
      },
      email: {
        allowNull: true,
        type: Sequelize.STRING
      },
      note: {
        allowNull: true,
        type: Sequelize.STRING
      },
      openTime: {
        allowNull: true,
        type: Sequelize.TIME
      },
      closeTime: {
        allowNull: true,
        type: Sequelize.TIME
      },
      address: {
        allowNull: true,
        type: Sequelize.STRING
      },
      active: {
        allowNull: true,
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      phone: {
        allowNull: true,
        type: Sequelize.STRING,
      },
      provinceId:{
        allowNull: true,
        type: Sequelize.INTEGER,
      },
      information: {
        allowNull: true,
        type: Sequelize.TEXT,
      },
      imageUrl: {
        allowNull: true,
        type: Sequelize.STRING
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
    await queryInterface.dropTable('Stores');
  }
};