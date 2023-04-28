'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('StaffServices', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      staffId: {
        allowNull: false,
        type: Sequelize.INTEGER,
        references: {
          model: 'Staffs', //Tên bảng, không phải tên Model
          key: 'id' //Khóa bên bảng liên kết
        },
        onUpdate: 'cascade',
        onDelete: 'cascade',
      },
      unit: {
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
      active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      note: {
        allowNull: true,
        type: Sequelize.TEXT
      },
      serviceId: {
        allowNull: false,
        type: Sequelize.INTEGER,
        references: {
          model: 'Services', //Tên bảng, không phải tên Model
          key: 'id' //Khóa bên bảng liên kết
        },
        onUpdate: 'cascade',
        onDelete: 'cascade',
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
    await queryInterface.dropTable('StaffServices');
  }
};