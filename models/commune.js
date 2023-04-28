'use strict';
const {
  Model
} = require('sequelize');
const sequelizePaginate = require("sequelize-paginate");

module.exports = (sequelize, DataTypes) => {
  class Commune extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  };
  Commune.init({
    name: DataTypes.STRING,
    code: DataTypes.STRING,
    type: DataTypes.STRING,
    centerPoint: DataTypes.JSON,
    rank: DataTypes.INTEGER,
    districtId: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'Commune',
  });
  sequelizePaginate.paginate(Commune);
  return Commune;
};