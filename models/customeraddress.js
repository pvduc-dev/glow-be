'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class CustomerAddress extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      CustomerAddress.belongsTo(models.Province, {
        foreignKey: "provinceId",
        as: "province",
      });
      CustomerAddress.belongsTo(models.District, {
        foreignKey: "districtId",
        as: "district",
      });
      CustomerAddress.belongsTo(models.Commune, {
        foreignKey: "communeId",
        as: "commune",
      });
    }
  };
  CustomerAddress.init({
    customerName: DataTypes.STRING,
    phone: DataTypes.STRING,
    default: DataTypes.BOOLEAN,
    active: DataTypes.BOOLEAN,
    customerId: DataTypes.INTEGER,
    provinceId: DataTypes.INTEGER,
    districtId: DataTypes.INTEGER,
    communeId: DataTypes.INTEGER,
    address: DataTypes.TEXT,
    lat: DataTypes.DOUBLE,
    long: DataTypes.DOUBLE,
  }, {
    sequelize,
    modelName: 'CustomerAddress',
  });
  return CustomerAddress;
};