'use strict';
const {
  Model
} = require('sequelize');
const sequelizePaginate = require("sequelize-paginate");
module.exports = (sequelize, DataTypes) => {
  class Customer extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Customer.belongsTo(models.User, {
        foreignKey: "userId",
        as: "user",
      });
    }
  };
  Customer.init({
    name: DataTypes.STRING,
    birthDay: DataTypes.DATEONLY,
    indetifyNumber: DataTypes.STRING,
    placeIssue: DataTypes.STRING,
    dateIssue: DataTypes.DATEONLY,
    rate: DataTypes.INTEGER,
    phoneFamily: DataTypes.STRING,
    gender: DataTypes.BOOLEAN,
    active: DataTypes.BOOLEAN,
    userId: DataTypes.INTEGER,
    info: DataTypes.TEXT,
    lat: DataTypes.DOUBLE,
    long: DataTypes.DOUBLE
  }, {
    sequelize,
    modelName: 'Customer',
  });
  sequelizePaginate.paginate(Customer);
  return Customer;
};