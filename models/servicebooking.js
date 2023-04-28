'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class ServiceBooking extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      ServiceBooking.belongsToMany(models.Service, {
        through: "StaffServices",
        foreignKey: 'serviceId',
        as: 'service'
      });
    }
  }
  ServiceBooking.init({
    serviceId: DataTypes.INTEGER,
    orderId: DataTypes.INTEGER,
    amount: DataTypes.INTEGER,
    price: DataTypes.DOUBLE,
    unit: DataTypes.STRING,
    serviceName: DataTypes.STRING,
    imageUrl: DataTypes.STRING,
  }, {
    sequelize,
    modelName: 'ServiceBooking',
  });
  return ServiceBooking;
};