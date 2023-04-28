'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Owners', {
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
      gender: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      address: {
        allowNull: true,
        type: Sequelize.STRING
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
      rate: {
        allowNull: true,
        type: Sequelize.INTEGER
      },
      phoneFamily: {
        allowNull: true,
        type: Sequelize.STRING
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
      storeId: {
        allowNull: true,
        type: Sequelize.INTEGER,
        references: {
          model: 'Stores', //Tên bảng, không phải tên Model
          key: 'id' //Khóa bên bảng liên kết
        },
        onUpdate: 'cascade',
        onDelete: 'SET NULL',
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
    await queryInterface.dropTable('Owners');
  }
};