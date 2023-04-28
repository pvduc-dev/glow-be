'use strict';
const districts = require("../constants/regions/district.json");
const Province = require("../models").Province;

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
    for (const item of districts) {
      const province = await Province.findOne({ where: { code: item.province_code } })
      var district = {
        name: item.name,
        type: item.type,
        code: item.code,
        centerPoint: item.center_point ? JSON.stringify(item.center_point) : null,
        provinceId: province.id
      }
      data.push(district)
    }

    return await queryInterface.bulkInsert('Districts', data);
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
