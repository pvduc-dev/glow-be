'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Tool extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  };
  Tool.init({
    name: DataTypes.STRING,
    code: DataTypes.STRING,
    data: DataTypes.TEXT,
    value: DataTypes.DOUBLE,
    description: DataTypes.TEXT,
    active: DataTypes.BOOLEAN
  }, {
    sequelize,
    modelName: 'Tool',
  });
  return Tool;
};