'use strict';
const {
  Model
} = require('sequelize');
const PROTECTED_ATTRIBUTES = ['password', 'tokens']
const sequelizePaginate = require("sequelize-paginate");
// const Role = require("role");
// console.log(111, Role)
module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    toJSON() {
      // hide protected fields
      let attributes = Object.assign({}, this.get())
      for (let a of PROTECTED_ATTRIBUTES) {
        delete attributes[a]
      }
      return attributes
    }

    static associate(models) {
      User.belongsTo(models.Role, {  //Ten model
        foreignKey: 'roleId', //ten khoa ngoai
        as: 'role' // ten file model
      });
      User.hasOne(models.Owner, {  //Ten model
        foreignKey: 'userId', //ten khoa ngoai
        as: 'owner' // ten file model
      });
    }
    
  };
  User.init(
    {
      name: DataTypes.STRING,
      userName: DataTypes.STRING,
      email: DataTypes.STRING,
      password: DataTypes.STRING,
      urlImage: DataTypes.STRING,
      tokens: DataTypes.JSON,
      roleId: DataTypes.INTEGER,
      active: DataTypes.BOOLEAN,
      phone: DataTypes.STRING,
      numberFailedLogin: DataTypes.INTEGER,
      lockedAt: DataTypes.DATE,
      roleCode: {
        type: DataTypes.VIRTUAL,
        async get() {
          const role = await sequelize.models.Role.findOne({ where: { id: this.roleId } });
          return role ? role.code : null;
        },
        set(value) {
          throw new Error('Không thể đặt giá trị cho trường này');
        }
      },
      totalMoney: DataTypes.DOUBLE
    },
    {
      sequelize,
      modelName: 'User',
    },
  );
  sequelizePaginate.paginate(User);
  return User;
};