'use strict';
const {
  Model
} = require('sequelize');
const sequelizePaginate = require("sequelize-paginate");
module.exports = (sequelize, DataTypes) => {
  class Service extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Service.hasMany(models.File, {
        foreignKey: 'referenceId',
        constraints: false,
        as: 'images',
        scope: {
          model: 'service'
        }
      });
      Service.belongsTo(models.User, {
        foreignKey: 'createdByUserId',
        as: 'createdByUser'
      });
      Service.belongsTo(models.User, {
        foreignKey: 'handleByUserId',
        as: 'handleByUser'
      });
      Service.belongsToMany(models.Store, {
        through: "StoreServices",
        foreignKey: 'serviceId',
        as: 'stores'
      });
      Service.belongsToMany(models.Staff, {
        through: "StaffServices",
        foreignKey: 'serviceId',
        as: 'staffs'
      });
    }
  };
  Service.init({
    name: DataTypes.STRING,
    code: DataTypes.STRING,
    price: DataTypes.DOUBLE,
    imageUrl: DataTypes.STRING,
    active: DataTypes.BOOLEAN,
    status: DataTypes.STRING,
    description: DataTypes.TEXT,
    unit: DataTypes.STRING,
    createdByUserId: DataTypes.INTEGER,
    handleByUserId: DataTypes.INTEGER,
    originPrice: DataTypes.DOUBLE
  }, {
    sequelize,
    modelName: 'Service',
  });
  sequelizePaginate.paginate(Service);
  return Service;
};