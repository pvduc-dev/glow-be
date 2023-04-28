'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Orders', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      storeId: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      staffId: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      voucherId: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      discount: {
        type: Sequelize.DOUBLE,
        defaultValue: 0
      },
      total: {
        type: Sequelize.DOUBLE,
        defaultValue: 0
      },
      totalPay: {
        type: Sequelize.DOUBLE,
        defaultValue: 0
      },
      rewardPoint: {
        type: Sequelize.DOUBLE,
        allowNull: true,
        defaultValue: 0
      },
      provinceId: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      districtId: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      communeId: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      address: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      lat: {
        type: Sequelize.DOUBLE,
        allowNull: true,
      },
      long: {
        type: Sequelize.DOUBLE,
        allowNull: true,
      },
      status: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      customerUserId: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      handleByUser: {
        type: Sequelize.INTEGER,
      },
      paymentMethodId: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      fee: {
        type: Sequelize.DOUBLE,
        defaultValue: 0
      },
      code: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      note: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      noteReview: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      rateReview: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      rateFeedback: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      noteFeedback: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      accessTime: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      successTime: {
        type: Sequelize.DATE,
        allowNull: true,
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
    await queryInterface.dropTable('Orders');
  }
};