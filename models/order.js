'use strict';
const {
  Model
} = require('sequelize');
const sequelizePaginate = require("sequelize-paginate");

module.exports = (sequelize, DataTypes) => {
  class Order extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Order.belongsTo(models.User, {
        foreignKey: "customerUserId",
        as: 'userCustomer'
      });
      Order.belongsTo(models.User, {
        foreignKey: "handleByUser",
        as: 'handleBy'
      });
      Order.belongsTo(models.Staff, {
        foreignKey: "staffId",
        as: 'staff'
      });
      Order.belongsTo(models.Store, {
        foreignKey: "storeId",
        as: 'store'
      });
      Order.belongsTo(models.Voucher, {
        foreignKey: "voucherId",
        as: 'voucher'
      });
      Order.belongsTo(models.Payment, {
        foreignKey: "paymentMethodId",
        as: 'payment'
      });
      Order.hasMany(models.ServiceBooking, {
        foreignKey: "orderId",
        as: 'booking'
      });
    }
  };
  Order.init({
    storeId: DataTypes.INTEGER,
    staffId: DataTypes.INTEGER,
    voucherId: DataTypes.INTEGER,
    discount: DataTypes.DOUBLE,
    total: DataTypes.DOUBLE,
    totalPay: DataTypes.DOUBLE,
    provinceId: DataTypes.INTEGER,
    districtId: DataTypes.INTEGER,
    communeId: DataTypes.INTEGER,
    address: DataTypes.TEXT,
    lat: DataTypes.DOUBLE,
    long: DataTypes.DOUBLE,
    status: DataTypes.STRING,
    customerUserId: DataTypes.INTEGER,
    handleByUser: DataTypes.INTEGER,
    paymentMethodId: DataTypes.INTEGER,
    fee: DataTypes.DOUBLE,
    code: DataTypes.STRING,
    name: DataTypes.STRING,
    note: DataTypes.TEXT,
    accessTime: DataTypes.DATE,
    successTime: DataTypes.DATE,
    noteReview: DataTypes.TEXT,
    noteFeedback: DataTypes.TEXT,
    rateReview: DataTypes.INTEGER,
    rateFeedback: DataTypes.INTEGER,
    is_paid: DataTypes.BOOLEAN,
    reasonCancel: DataTypes.TEXT,
    timeData: DataTypes.JSON
  }, {
    sequelize,
    modelName: 'Order',
  });
  sequelizePaginate.paginate(Order);
  return Order;
};