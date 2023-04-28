'use strict';
const sequelizePaginate = require("sequelize-paginate");
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Staff extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Staff.hasMany(models.File, {
        foreignKey: 'referenceId',
        constraints: false,
        as: 'images',
        scope: {
          model: 'staff'
        }
      });
      Staff.hasMany(models.Order, {
        foreignKey: 'staffId',
        constraints: false,
        as: 'reviews'
      });
      Staff.belongsTo(models.Store, {
        foreignKey: "storeId",
        as: 'store'
      });
      Staff.belongsTo(models.User, {
        foreignKey: "userId",
        as: 'user'
      });
      Staff.belongsToMany(models.Service, {
        through: "StaffServices",
        foreignKey: 'staffId',
        as: 'services'
      });
      Staff.hasMany(models.StaffService, {
        foreignKey: 'staffId',
        as: 'staffService'
      });
      Staff.belongsTo(models.Province, {
        foreignKey: "provinceId",
        as: 'province'
      });
      Staff.belongsTo(models.District, {
        foreignKey: "districtId",
        as: 'district'
      });
      Staff.belongsTo(models.Commune, {
        foreignKey: "communeId",
        as: 'commune'
      });
    }
  };
  Staff.init({
    name: DataTypes.STRING,
    code: DataTypes.STRING,
    status: DataTypes.STRING,
    active: DataTypes.BOOLEAN,
    birthDay: DataTypes.DATEONLY,
    userId: DataTypes.INTEGER,
    storeId: DataTypes.INTEGER,
    address: DataTypes.STRING,
    indetifyNumber: DataTypes.STRING,
    placeIssue: DataTypes.STRING,
    dateIssue: DataTypes.DATEONLY,
    phoneFamily: DataTypes.STRING,
    gender: DataTypes.BOOLEAN,
    lat: DataTypes.DOUBLE,
    long: DataTypes.DOUBLE,
    online: DataTypes.BOOLEAN,
    description: DataTypes.TEXT,
    busy: DataTypes.BOOLEAN,
    districtId: DataTypes.INTEGER,
    provinceId: DataTypes.INTEGER,
    communeId: DataTypes.INTEGER,
    rateAvg: DataTypes.DOUBLE,
    countReview: DataTypes.INTEGER,
  }, {
    sequelize,
    modelName: 'Staff',
  });
  sequelizePaginate.paginate(Staff);
  return Staff;
};