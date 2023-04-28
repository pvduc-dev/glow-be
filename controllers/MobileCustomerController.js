const User = require("../models").User;
const Staff = require("../models").Staff;
const Owner = require("../models").Owner;
const Customer = require("../models").Customer;
const CustomerAddress = require("../models").CustomerAddress;
const Role = require("../models").Role;
var bcrypt = require("bcryptjs");
const { validationResult } = require("express-validator");
const { sequelize } = require("../models");
const defaultPassword = "12345678";
const Op = require("sequelize").Op;
const customerRoleCode = require("../constants/roles").customerRoleCode;
const Province = require("../models").Province;
const District = require("../models").District;
const Commune = require("../models").Commune;
const adminRoleCode = require("../constants/roles").adminRoleCode;
const axios = require("axios");
var https = require("https");

class MobileCustomerController {
  updateMobileProfile = async (req, res, next) => {
    const user = req.user;
    const userId = user.id;
    const data = req.body;
    if (!data.name) {
      return res.status(403).json({ message: "Tên không được bỏ trống" });
    }
    if (data.userName) {
      const checkUserName = await User.findOne({
        where: { userName: data.userName, id: { [Op.not]: userId } },
      });
      if (checkUserName) {
        return res
          .status(403)
          .json({ message: "Tên đăng nhập đã tồn tại", code: 403 });
      }
    }
    if (data.email) {
      const checkEmail = await User.findOne({
        where: { email: data.email, id: { [Op.not]: userId } },
      });
      if (checkEmail) {
        return res.status(403).json({ message: "Email đã tồn tại", code: 403 });
      }
    }
    if (!data.phone) {
      return res
        .status(403)
        .json({ message: "Số điện thoại không được bỏ trống" });
    }
    try {
      const customer = await Customer.findOne({ where: { userId: userId } });
      const owner = await Owner.findOne({ where: { userId: userId } });
      const staff = await Staff.findOne({ where: { userId: userId } });
      if (!customer && !owner && !staff) {
        return res
          .status(403)
          .json({ message: "Người dùng không tồn tại", code: 403 });
      }
      const checkPhone = await User.findOne({
        where: { phone: data.phone, id: { [Op.not]: userId } },
      });
      if (checkPhone) {
        return res
          .status(403)
          .json({ message: "Số điện thoại đã tồn tại", code: 403 });
      }

      const result = await sequelize.transaction(async (t) => {
        const user = await User.findOne({ where: { id: userId } });
        await user.update(
          {
            name: data.name,
            userName: data.userName,
            email: data.email,
            urlImage: data.urlImage,
            phone: data.phone,
          },
          { transaction: t }
        );

        if (customer) {
          await customer.update(
            {
              name: data.name,
              birthDay: data.birthDay,
              indetifyNumber: data.indetifyNumber,
              placeIssue: data.placeIssue,
              dateIssue: data.dateIssue,
              phoneFamily: data.phoneFamily,
              gender: data.gender,
              info: data.info,
            },
            { transaction: t }
          );
          return "Cập nhật thành công";
        }
        if (owner) {
          await owner.update(
            {
              name: data.name,
              birthDay: data.birthDay,
              indetifyNumber: data.indetifyNumber,
              placeIssue: data.placeIssue,
              dateIssue: data.dateIssue,
              phoneFamily: data.phoneFamily,
              gender: data.gender,
            },
            { transaction: t }
          );
          return "Cập nhật thành công";
        }
        if (staff) {
          await staff.update(
            {
              name: data.name,
              birthDay: data.birthDay,
              indetifyNumber: data.indetifyNumber,
              placeIssue: data.placeIssue,
              dateIssue: data.dateIssue,
              phoneFamily: data.phoneFamily,
              gender: data.gender,
            },
            { transaction: t }
          );
          return "Cập nhật thành công";
        }
      });

      return res.status(200).json({ message: result });
    } catch (error) {
      console.log(error);
      next(error);
    }
  };
  getProfileCustomer = async (req, res, next) => {
    try {
      const user = req.user;
      const customer = await Customer.findOne({
        where: { userId: user.id },
        include: [
          {
            model: User,
            as: "user",
            attributes: ["id", "phone", "urlImage", "email", "userName"],
          },
        ],
      });
      const owner = await Owner.findOne({
        where: { userId: user.id },
        include: [
          {
            model: User,
            as: "user",
            attributes: ["id", "phone", "urlImage", "email", "userName"],
          },
        ],
      });
      const staff = await Staff.findOne({
        where: { userId: user.id },
        include: [
          {
            model: User,
            as: "user",
            attributes: ["id", "phone", "urlImage", "email", "userName"],
          },
        ],
      });
      var data = null;
      if (staff) {
        data = staff;
      }
      if (owner) {
        data = owner;
      }
      if (customer) {
        data = customer;
      }
      return res.status(200).json(data);
    } catch (error) {
      console.log(error);
      next(error);
    }
  };
  getCustomerAddress = async (req, res, next) => {
    try {
      const user = req.user;
      const customer = await Customer.findOne({
        where: { userId: user.id },
      });
      const address = await CustomerAddress.findAll({
        where: { customerId: customer.id },
        include: [
          { model: District, as: "district", attributes: ["id", "name"] },
          { model: Province, as: "province", attributes: ["id", "name"] },
          { model: Commune, as: "commune", attributes: ["id", "name"] },
        ],
      });
      return res.status(200).json(address);
    } catch (error) {
      console.log(error);
      next(error);
    }
  };
  setDefaultAddress = async (req, res, next) => {
    const user = req.user;
    const addressId = req.params.id;
    if (!addressId) {
      return res.status(422).json({ message: "ID Địa chỉ không tồn tại" });
    }
    const t = await sequelize.transaction();
    try {
      const customer = await Customer.findOne({ where: { userId: user.id } });
      if (!customer) {
        return res.status(422).json({ message: "Khách hàng không tồn tại" });
      }
      const address = await CustomerAddress.findOne({
        where: { id: addressId, customerId: customer.id },
      });
      if (!address) {
        return res.status(422).json({ message: "Địa chỉ không tồn tại" });
      }
      await CustomerAddress.update(
        { default: false },
        { where: { customerId: customer.id } },
        { transaction: t }
      );
      await address.update({ default: true }, { transaction: t });
      await t.commit();
      return res.status(200).json({ message: "Thành công" });
    } catch (error) {
      await t.rollback();
      console.log(error);
      next(error);
    }
  };
  removeAddress = async (req, res, next) => {
    const addressId = req.params.id;
    const user = req.user;
    if (!addressId) {
      return res.status(422).json({ message: "ID Địa chỉ không tồn tại" });
    }
    const t = await sequelize.transaction();
    try {
      const customer = await Customer.findOne({ where: { userId: user.id } });
      if (!customer) {
        return res.status(422).json({ message: "Khách hàng không tồn tại" });
      }
      const address = CustomerAddress.findOne({
        where: { id: addressId, customerId: customer.id },
      });
      if (!address) {
        return res.status(422).json({ message: "Địa chỉ không tồn tại" });
      }
      await CustomerAddress.destroy(
        {
          where: {
            id: addressId,
          },
        },
        { transaction: t }
      );
      if (address.default) {
        const newDeaultAddress = CustomerAddress.findOne({
          where: { customerId: customer.id },
        });
        if (newDeaultAddress) {
          newDeaultAddress.update({ default: true }, { transaction: t });
        }
      }
      await t.commit();
      return res.status(200).json({ message: "Thành công" });
    } catch (error) {
      await t.rollback();
      console.log(error);
      next(error);
    }
  };

  addCustomerAddress = async (req, res, next) => {
    try {
      const data = req.body;
      const user = req.user;
      if (!data.address) {
        return res
          .status(403)
          .json({ message: "Địa chỉ không thể bỏ trống", code: 403 });
      }
      const customer = await Customer.findOne({ where: { userId: user.id } });
      if (!customer) {
        return res
          .status(403)
          .json({ message: "Khách hàng không tồn tại", code: 403 });
      }
      const checkDefault = await CustomerAddress.findOne({
        where: { customerId: customer.id, default: true },
      });
      if (data.default && checkDefault) {
        CustomerAddress.update(
          {
            default: false,
          },
          { where: { customerId: customer.id } }
        );
      }
      await CustomerAddress.create({
        customerName: data.name ? data.name : customer.name,
        phone: data.phone ? data.phone : user.phone,
        provinceId: data.provinceId ? data.provinceId : null,
        customerId: customer.id,
        districtId: data.districtId ? data.districtId : null,
        default: checkDefault ? data.default : true,
        address: data.address,
        lat: data.lat ? data.lat : null,
        long: data.long ? data.long : null,
      });

      return res.status(200).json({ message: "Thêm mới thành công" });
    } catch (error) {
      console.log(error);
      next(error);
    }
  };
  updateCustomerAddress = async (req, res, next) => {
    try {
      const data = req.body;
      const user = req.user;
      if (!data.address) {
        return res
          .status(403)
          .json({ message: "Địa chỉ không thể bỏ trống", code: 403 });
      }
      if (!data.id) {
        return res
          .status(403)
          .json({ message: "ID địa điểm không tồn tại", code: 403 });
      }
      const customer = await Customer.findOne({ where: { userId: user.id } });
      if (!customer) {
        return res
          .status(403)
          .json({ message: "Khách hàng không tồn tại", code: 403 });
      }
      const checkDefault = await CustomerAddress.findOne({
        where: {
          customerId: customer.id,
          default: true,
          id: { [Op.not]: data.id },
        },
      });
      if (data.default && checkDefault) {
        CustomerAddress.update(
          {
            default: false,
          },
          { where: { customerId: customer.id } }
        );
      }
      const address = await CustomerAddress.findOne({ where: { id: data.id } });
      await address.update({
        customerName: data.name ? data.name : customer.name,
        phone: data.phone ? data.phone : user.phone,
        provinceId: data.provinceId,
        customerId: customer.id,
        districtId: data.districtId ? data.districtId : null,
        default: checkDefault ? data.default : true,
        address: data.address,
        lat: data.lat ? data.lat : null,
        long: data.long ? data.long : null,
      });

      return res.status(200).json({ message: "Cập nhật thành công" });
    } catch (error) {
      console.log(error);
      next(error);
    }
  };

  getAddressByLatLong = async (lat, lng) => {
    const httpsAgent = new https.Agent({
      rejectUnauthorized: false,
    });
    try {
      const respon = await axios.get(
        `https://pccc.sful.vn/geocoding/geocoding/reverse?lat=${lat}&lng=${lng}`,
        { httpsAgent }
      );
      const data = respon.data;
      var province = {};
      var district = {};
      var commune = {};

      if (data.admin1) {
        province = await Province.findOne({ where: { name: data.admin1 } });
      }
      if (data.admin2) {
        district = await District.findOne({ where: { name: data.admin2 } });
      }
      if (data.admin3) {
        commune = await Commune.findOne({ where: { name: data.admin3 } });
      }
      return { ...data, province, district, commune };
    } catch (error) {
      console.log(error);
      next(error);
    }
  };

  deactiveMyAccount = async (req, res, next) => {
    const user = req.user;
    const roleCode = await user.roleCode;
    if (roleCode != customerRoleCode) {
      return res
        .status(403)
        .json({ message: "Chức năng chỉ dành cho khách hàng" });
    }
    try {
      await user.update({
        active: false,
        tokens: null,
      });
      return res.status(200).json({ message: "Thành công" });
    } catch (error) {
      console.log(error);
      next(error);
    }
  };

  updateMyCurrentLocation = async (req, res, next) => {
    const user = req.user;
    const data = req.body;
    try {
      if (data.lat && data.long) {
        const staff = await Staff.findOne({ where: { userId: user.id } });
        const customer = await Customer.findOne({ where: { userId: user.id } });
        if (staff) {
          await staff.update({
            lat: data.lat,
            long: data.long,
          });
        }
        if (customer) {
          await customer.update({
            lat: data.lat,
            long: data.long,
          });
        }
        if (!staff && !customer) {
          return res.status(400).json({ message: "Người dùng không tồn tại" });
        }
        return res.status(200).json({ message: "Thành công" });
      }
    } catch (error) {
      console.log(error);
      next(error);
    }
  };
}

module.exports = new MobileCustomerController();
