'use strict';
const {
  Model
} = require('sequelize');
const sequelizePaginate = require("sequelize-paginate");

module.exports = (sequelize, DataTypes) => {
  class Store extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Store.hasOne(models.Owner, {  //Ten model
        foreignKey: 'storeId', //ten khoa ngoai
        as: 'owner' // ten file model
      });
      Store.belongsToMany(models.Service, {  
        through: "StoreServices",
        foreignKey: 'storeId',
        as: 'services'
      });
    }
  };
  Store.init({
    name: DataTypes.STRING,
    code: DataTypes.STRING,
    email: DataTypes.STRING,
    active: DataTypes.BOOLEAN,
    note: DataTypes.STRING,
    openTime: DataTypes.TIME,
    closeTime: DataTypes.TIME,
    address: DataTypes.STRING,
    phone: DataTypes.STRING,
    provinceId: DataTypes.INTEGER,
    information: DataTypes.TEXT,
    imageUrl: DataTypes.STRING,
    lat: DataTypes.DOUBLE,
    long: DataTypes.DOUBLE,
    taxCode: DataTypes.STRING,
    facebook: DataTypes.STRING,
    companyCode: DataTypes.STRING,
    taxDate: DataTypes.DATEONLY,
    taxProvide: DataTypes.STRING,
  }, {
    sequelize,
    modelName: 'Store',
  });
  sequelizePaginate.paginate(Store);
  return Store;
};