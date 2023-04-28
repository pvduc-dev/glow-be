'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class StaffServicePrice extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  };
  StaffServicePrice.init({
    unit: DataTypes.STRING,
    price: DataTypes.DOUBLE,
    serviceStaffId: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'StaffServicePrice',
  });
  return StaffServicePrice;
};