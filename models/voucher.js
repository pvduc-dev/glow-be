'use strict';
const {
  Model
} = require('sequelize');
const sequelizePaginate = require("sequelize-paginate");

module.exports = (sequelize, DataTypes) => {
  class Voucher extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Voucher.belongsTo(models.Store, {  //Ten model
        foreignKey: 'storeId', //ten khoa ngoai
        as: 'store' // ten file model
      });
    }
  };
  Voucher.init({
    name: DataTypes.STRING,
    code: DataTypes.STRING,
    type: DataTypes.STRING,
    status: DataTypes.STRING,
    quantity: DataTypes.INTEGER,
    storeId: DataTypes.INTEGER,
    value: DataTypes.DOUBLE,
    startTime: DataTypes.DATE,
    endTime: DataTypes.DATE,
    minValueOrder: DataTypes.DOUBLE,
    maxReduce: DataTypes.DOUBLE,
    active: DataTypes.BOOLEAN,
    used: DataTypes.INTEGER,
  }, {
    sequelize,
    modelName: 'Voucher',
  });
  sequelizePaginate.paginate(Voucher);
  return Voucher;
};