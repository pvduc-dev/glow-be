'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Staffs', {
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
      status: {
        allowNull: true,
        type: Sequelize.STRING
      },
      active: {
        allowNull: false,
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      birthDay: {
        allowNull: true,
        type: Sequelize.DATEONLY
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
        type: Sequelize.DATE
      },
      rate: {
        allowNull: true,
        type: Sequelize.INTEGER
      },
      address: {
        allowNull: true,
        type: Sequelize.STRING
      },
      gender: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
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
    await queryInterface.dropTable('Staffs');
  }
};