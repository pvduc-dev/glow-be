'use strict';
const provinces = require("../constants/regions/province.json");

module.exports = {
  up: async (queryInterface, Sequelize) => {
    /**
     * Add seed commands here.
     *
     * Example:
     * await queryInterface.bulkInsert('People', [{
     *   name: 'John Doe',
     *   isBetaMember: false
     * }], {});
    */
   const data = provinces.map(el => {
    return {
      name: el.name,
      type: el.type,
      code: el.code,
      centerPoint: el.center_point ? JSON.stringify(el.center_point) : null
    }
   });
   return await queryInterface.bulkInsert('Provinces', data);
  },

  down: async (queryInterface, Sequelize) => {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */
  }
};
