'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Customers', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      name: {
        type: Sequelize.STRING
      },
      gender: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      birthDay: {
        allowNull: true,
        type: Sequelize.DATEONLY
      },
      indetifyNumber: {
        allowNull: true,
        type: Sequelize.STRING
      },
      placeIssue: {
        allowNull: true,
        type: Sequelize.STRING
      },
      dateIssue: {
        allowNull: true,
        type: Sequelize.DATEONLY
      },
      phoneFamily: {
        allowNull: true,
        type: Sequelize.STRING
      },
      info: {
        allowNull: true,
        type: Sequelize.TEXT
      },
      rate: {
        allowNull: true,
        type: Sequelize.INTEGER
      },
      userId: {
        allowNull: true,
        type: Sequelize.INTEGER,
        references: {
          model: 'Users', //Tên bảng, không phải tên Model
          key: 'id' //Khóa bên bảng liên kết
        },
        onUpdate: 'cascade',
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
    await queryInterface.dropTable('Customers');
  }
};