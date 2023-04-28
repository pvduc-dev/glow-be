'use strict';
const {
  Model
} = require('sequelize');
const sequelizePaginate = require("sequelize-paginate");

module.exports = (sequelize, DataTypes) => {
  class Province extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  };
  Province.init({
    name: DataTypes.STRING,
    code: DataTypes.STRING,
    type: DataTypes.STRING,
    centerPoint: DataTypes.JSON,
    rank: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'Province',
  });
  sequelizePaginate.paginate(Province);
  return Province;
};