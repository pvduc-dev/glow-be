"use strict";
const {Model} = require("sequelize");
const PROTECTED_ATTRIBUTES = ["createdAt", "updatedAt", "active"];
const sequelizePaginate = require("sequelize-paginate");

module.exports = (sequelize, DataTypes) => {
  class Menu extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    toJSON() {
      // hide protected fields
      let attributes = Object.assign({}, this.get());
      for (let a of PROTECTED_ATTRIBUTES) {
        delete attributes[a];
      }
      return attributes;
    }
    static associate(models) {
      Menu.belongsTo(models.Menu, {
        foreignKey: 'parentId',
        as: 'Parent',
      });
      Menu.hasMany(models.Menu, {
        foreignKey: "parentId",
        as: "children",
      });
      Menu.hasMany(models.MenuRole, {
        foreignKey: "menuId",
        as: "roles",
      });
    }
  }
  Menu.init(
    {
      parentId: DataTypes.INTEGER,
      name: DataTypes.STRING,
      routerLink: DataTypes.STRING,
      icon: DataTypes.STRING,
      active: DataTypes.BOOLEAN,
      order: DataTypes.INTEGER,
      hidden: DataTypes.BOOLEAN,
    },
    {
      sequelize,
      modelName: "Menu",
    }
  );
  sequelizePaginate.paginate(Menu);
  return Menu;
};
