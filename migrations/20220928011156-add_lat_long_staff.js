'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    return Promise.all([
      queryInterface.addColumn(
        'Staffs', // table name
        'lat', // new field name
        {
          type: Sequelize.DOUBLE,
          allowNull: true,
        },
      ),
      queryInterface.addColumn(
        'Staffs',
        'long',
        {
          type: Sequelize.DOUBLE,
          allowNull: true,
        },
      ),
      queryInterface.addColumn(
        'Customers', // table name
        'lat', // new field name
        {
          type: Sequelize.DOUBLE,
          allowNull: true,
        },
      ),
      queryInterface.addColumn(
        'Customers',
        'long',
        {
          type: Sequelize.DOUBLE,
          allowNull: true,
        },
      )
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
  }
};
