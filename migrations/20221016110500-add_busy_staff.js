"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    queryInterface.addColumn(
      "Staffs", // table name
      "busy", // new field name
      {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      }
    ),
      queryInterface.addColumn("Payments", "logoUrl", {
        type: Sequelize.STRING,
        allowNull: true,
      });
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
  },
};
