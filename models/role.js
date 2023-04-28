"use strict";
const {Model} = require("sequelize");
const PROTECTED_ATTRIBUTES = ["createdAt", "updatedAt"];

module.exports = (sequelize, DataTypes) => {
  class Role extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    toJSON () {
      // hide protected fields
      let attributes = Object.assign({}, this.get())
      for (let a of PROTECTED_ATTRIBUTES) {
        delete attributes[a]
      }
      return attributes
    }
    static associate(models) {
      Role.hasMany(models.User, {
        foreignKey: "roleId",
        as: "user",
      });
      Role.hasMany(models.MenuRole, {
        foreignKey: "roleId",
        as: "MenuRoles",
      });
    }
  }
  Role.init(
    {
      name: DataTypes.STRING,
      code: DataTypes.STRING,
      description: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: "Role",
    }
  );
  return Role;
};
