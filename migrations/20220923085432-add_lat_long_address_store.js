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
        'CustomerAddresses', // table name
        'lat', // new field name
        {
          type: Sequelize.DOUBLE,
          allowNull: true,
        },
      ),
      queryInterface.addColumn(
        'CustomerAddresses',
        'long',
        {
          type: Sequelize.DOUBLE,
          allowNull: true,
        },
      ),
      queryInterface.addColumn(
        'Stores',
        'long',
        {
          type: Sequelize.DOUBLE,
          allowNull: true,
        },
      ),
      queryInterface.addColumn(
        'Stores',
        'lat',
        {
          type: Sequelize.DOUBLE,
          allowNull: true,
        },
      ),
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
     return Promise.all([
      queryInterface.removeColumn('CustomerAddresses', 'lat'),
      queryInterface.removeColumn('CustomerAddresses', 'long'),
      queryInterface.removeColumn('Stores', 'lat'),
      queryInterface.removeColumn('Stores', 'long'),
    ]);
  }
};
