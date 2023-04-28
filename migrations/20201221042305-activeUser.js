'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    await queryInterface.addColumn(
      'Users', //table name
      'active', // new column,
      {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      })
  },

  down: async (queryInterface, Sequelize) => {
    queryInterface.removeColumn('Users', 'active')
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
  }
};
