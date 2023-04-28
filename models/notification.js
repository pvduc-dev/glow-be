'use strict';
const {
  Model
} = require('sequelize');
const sequelizePaginate = require("sequelize-paginate");

module.exports = (sequelize, DataTypes) => {
  class Notification extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Notification.belongsTo(models.Order, {
        foreignKey: 'referenceId',
        as: 'order'
      });
    }
  };
  Notification.init({
    title: DataTypes.STRING,
    content: DataTypes.TEXT,
    type: DataTypes.STRING,
    referenceId: DataTypes.INTEGER,
    time: DataTypes.DATE,
    seen: DataTypes.BOOLEAN,
    seenAt: DataTypes.DATE,
    toUserId: DataTypes.INTEGER,
    status: DataTypes.STRING,
    active: DataTypes.BOOLEAN
  }, {
    sequelize,
    modelName: 'Notification',
  });
  sequelizePaginate.paginate(Notification);
  return Notification;
};