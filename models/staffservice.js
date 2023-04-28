'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class StaffService extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      StaffService.belongsTo(models.Service, {
        foreignKey: 'serviceId',
        as: 'service'
      });
      StaffService.hasMany(models.StaffServicePrice, {
        foreignKey: 'serviceStaffId',
        as: 'prices'
      });
    }
  };
  StaffService.init({
    staffId: DataTypes.INTEGER,
    serviceId: DataTypes.INTEGER,
    unit: DataTypes.STRING,
    note: DataTypes.TEXT,
    price: DataTypes.DOUBLE,
    active: DataTypes.BOOLEAN,
    originPrice: DataTypes.DOUBLE
  }, {
    sequelize,
    modelName: 'StaffService',
  });
  return StaffService;
};