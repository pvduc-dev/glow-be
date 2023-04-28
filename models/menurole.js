"use strict";
const {Model} = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class MenuRole extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      MenuRole.belongsTo(models.Menu, {
        foreignKey: "menuId",
        as: "Menu",
      });
      MenuRole.belongsTo(models.Role, {
        foreignKey: "roleId",
        as: "Role",
      });
    }
  }
  MenuRole.init(
    {
      roleId: DataTypes.INTEGER,
      menuId: DataTypes.INTEGER,
    },
    {
      sequelize,
      modelName: "MenuRole",
    }
  );
  return MenuRole;
};
