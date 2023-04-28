'use strict';
var bcrypt = require("bcryptjs");
const adminRoleCode = require("../constants/roles").adminRoleCode
const Role = require("../models").Role;

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
    await queryInterface.bulkDelete('Users', {}, {
      force: true,
      truncate: true,
      cascade: true,
      restartIdentity: true
    });
    const roleAdmin = await Role.findOne({ where: { code: adminRoleCode } })
    return await queryInterface.bulkInsert('Users', [{
      name: 'Administrator',
      userName: 'admin',
      email: 'admin@email.com',
      password: bcrypt.hashSync('12345678', 10),
      phone: '099999999',
      roleId: roleAdmin.id,
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }], {});

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
