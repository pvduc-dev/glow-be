'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Services', {
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
      price: {
        allowNull: false,
        type: Sequelize.DOUBLE
      },
      originPrice: {
        allowNull: true,
        type: Sequelize.DOUBLE
      },
      imageUrl: {
        allowNull: true,
        type: Sequelize.STRING
      },
      active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      status: {
        allowNull: true,
        type: Sequelize.STRING
      },
      createdByUserId: {
        allowNull: true,
        type: Sequelize.INTEGER,
        references: {
          model: 'Users', //Tên bảng, không phải tên Model
          key: 'id' //Khóa bên bảng liên kết
        },
        onUpdate: 'cascade',
        onDelete: 'SET NULL',
      },
      handleByUserId: {
        allowNull: true,
        type: Sequelize.INTEGER,
        references: {
          model: 'Users', //Tên bảng, không phải tên Model
          key: 'id' //Khóa bên bảng liên kết
        },
        onUpdate: 'cascade',
        onDelete: 'SET NULL',
      },
      description: {
        allowNull: true,
        type: Sequelize.TEXT
      },
      unit: {
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
    await queryInterface.dropTable('Services');
  }
};