'use strict';
const communes = require("../constants/regions/commune.json");
const District = require("../models").District;
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
     const data = [];
     for (const item of communes) {
       const district = await District.findOne({ where: { code: item.district_code } })
       var commune = {
         name: item.name,
         type: item.type,
         code: item.code,
         centerPoint: item.center_point ? JSON.stringify(item.center_point) : null,
         districtId: district.id
       }
       data.push(commune)
     }
 
     return await queryInterface.bulkInsert('Communes', data);
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
