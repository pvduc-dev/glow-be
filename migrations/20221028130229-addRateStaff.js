'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
     return Promise.all([
      queryInterface.addColumn(
        "Staffs", // table name
        "rateAvg", // new field name
        {
          type: Sequelize.DOUBLE,
          allowNull: true,
        }
      ),
      queryInterface.addColumn(
        "Staffs", // table name
        "totalRate", // new field name
        {
          type: Sequelize.INTEGER,
          allowNull: true,
        }
      )
    ]);
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
  }
};
