'use strict';
const sequelizePaginate = require("sequelize-paginate");
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Owner extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Owner.belongsTo(models.Store, {
        foreignKey: "storeId",
        as: 'store'
      });
      Owner.belongsTo(models.User, {
        foreignKey: "userId",
        as: "user",
      });
    }
  };
  Owner.init({
    name: DataTypes.STRING,
    address: DataTypes.STRING,
    birthDay: DataTypes.DATEONLY,
    indetifyNumber: DataTypes.STRING,
    placeIssue: DataTypes.STRING,
    dateIssue: DataTypes.DATEONLY,
    rate: DataTypes.INTEGER,
    phoneFamily: DataTypes.STRING,
    gender: DataTypes.BOOLEAN,
    active: DataTypes.BOOLEAN,
    userId: DataTypes.INTEGER,
    storeId: DataTypes.INTEGER,
    description: DataTypes.TEXT,
  }, {
    sequelize,
    modelName: 'Owner',
  });
  sequelizePaginate.paginate(Owner);
  return Owner;
};