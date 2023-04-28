const User = require("../models").User;
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
class CustomerController {
  getListCustomer = async (req, res, next) => {
    try {
      const page = req.query.page ? req.query.page : 1;
      const perPage = req.query.perPage ? req.query.perPage : 10;
      const search = req.query.search ? req.query.search : null;
      const active = req.query.active ? req.query.active : null;
      var searchQuery = {};
      if (search) {
        searchQuery = { ...searchQuery, name: { [Op.iLike]: `%${search}%` } };
      }

      if (active) {
        searchQuery = { ...searchQuery, active: active };
      }

      const data = await Customer.paginate({
        where: searchQuery,
        page: page, // Default 1
        paginate: perPage, // Default 25
        order: [["updatedAt", "DESC"]],
        include: [
          {
            model: User,
            as: "user",
            attributes: [
              "id",
              "name",
              "userName",
              "phone",
              "email",
              "urlImage",
              "totalMoney",
            ],
          },
        ],
      });

      data.currentPage = page;
      return res.status(200).json(data);
    } catch (error) {
      console.log(error);
    }
  };
  getDetailCustomer = async (req, res, next) => {
    const customerId = req.params.id;
    try {
      const staff = await Customer.findOne({
        where: { id: customerId },
        include: [
          {
            model: User,
            as: "user",
            attributes: ["id", "phone", "urlImage", "email", "userName"],
          },
        ],
      });
      return res.status(200).json(staff);
    } catch (error) {
      console.log(error);
      next(error);
    }
  };
  addCustomer = async (req, res, next) => {
    const t = await sequelize.transaction();
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res
          .status(422)
          .json({ message: "Dữ liệu không hợp lệ!", errors: errors.array() });
      }
      const data = req.body;
      const checkUserName = await User.findOne({
        where: { userName: data.userName },
      });
      const checkEmail = await User.findOne({ where: { email: data.email } });
      const checkPhone = await User.findOne({ where: { phone: data.phone } });
      if (checkPhone) {
        return res
          .status(403)
          .json({ message: "Số điện thoại đã tồn tại", code: 403 });
      }
      if (checkUserName) {
        return res
          .status(403)
          .json({ message: "Tên đăng nhập đã tồn tại", code: 403 });
      }
      if (checkEmail) {
        return res.status(403).json({ message: "Email đã tồn tại", code: 403 });
      }
      const passHashed = bcrypt.hashSync(defaultPassword, 10);
      const customerRole = await Role.findOne({
        where: { code: customerRoleCode },
      });
      const user = await User.create(
        {
          name: data.name,
          userName: data.userName,
          email: data.email,
          password: passHashed,
          urlImage: data.urlImage,
          roleId: customerRole.id,
          phone: data.phone,
        },
        { transaction: t }
      );
      const customer = await Customer.create(
        {
          name: data.name,
          birthDay: data.birthDay,
          indetifyNumber: data.indetifyNumber,
          placeIssue: data.placeIssue,
          dateIssue: data.dateIssue,
          phoneFamily: data.phoneFamily,
          gender: data.gender,
          userId: user.id,
          info: data.info,
        },
        { transaction: t }
      );
      if (data.address && data.address.length) {
        for (const item of data.address) {
          await CustomerAddress.create(
            {
              customerName: item.customerName ? item.customerName : data.name,
              phone: item.phone ? item.phone : data.phone,
              customerId: customer.id,
              provinceId: item.provinceId,
              districtId: item.districtId,
              communeId: item.communeId,
              address: item.address,
            },
            { transaction: t }
          );
        }
      }
      await t.commit();
      return res.status(200).json({ message: "Thêm mới thành công" });
    } catch (error) {
      await t.rollback();
      console.log(error);
      next(error);
    }
  };
  updateCustomer = async (req, res, next) => {
    const user = req.user;
    const data = req.body;
    if (!data.name) {
      return res
        .status(403)
        .json({ message: "Tên nhân viên không được bỏ trống" });
    }
    try {
      const customer = await Customer.findOne({ where: { id: data.id } });
      const userId = customer.userId;
      const checkUserName = await User.findOne({
        where: { userName: data.userName, id: { [Op.not]: userId } },
      });
      const checkEmail = await User.findOne({
        where: { email: data.email, id: { [Op.not]: userId } },
      });
      const checkPhone = await User.findOne({
        where: { phone: data.phone, id: { [Op.not]: userId } },
      });
      if (checkPhone) {
        return res
          .status(403)
          .json({ message: "Số điện thoại đã tồn tại", code: 403 });
      }
      if (checkUserName) {
        return res
          .status(403)
          .json({ message: "Tên đăng nhập đã tồn tại", code: 403 });
      }
      if (checkEmail) {
        return res.status(403).json({ message: "Email đã tồn tại", code: 403 });
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

        // await CustomerAddress.destroy({ where: { customerId: data.id } }, { transaction: t })
        // if (data.address && data.address.length) {
        //     for (const item of data.address) {
        //         await CustomerAddress.create({
        //             customerName: item.customerName ? item.customerName : data.name,
        //             phone: item.phone ? item.phone : data.phone,
        //             customerId: customer.id,
        //             provinceId: item.provinceId,
        //             districtId: item.districtId,
        //             communeId: item.communeId,
        //             address: item.address
        //         }, { transaction: t })
        //     }
        // }
        return "Cập nhật thành công";
      });

      return res.status(200).json({ message: result });
    } catch (error) {
      console.log(error);
      next(error);
    }
  };
  getCustomerAddress = async (req, res, next) => {
    const customerId = req.params.id;
    try {
      const address = await CustomerAddress.findAll({
        where: { customerId: customerId },
        include: [
          { model: District, as: "district", attributes: ["id", "name"] },
          { model: Province, as: "province", attributes: ["id", "name"] },
          { model: Commune, as: "commune", attributes: ["id", "name"] },
        ],
        order: [["createdAt"]],
      });
      return res.status(200).json(address);
    } catch (error) {
      console.log(error);
      next(error);
    }
  };
  setDefaultAddress = async (req, res, next) => {
    const addressId = req.params.id;
    if (!addressId) {
      return res.status(422).json({ message: "ID Địa chỉ không tồn tại" });
    }
    const t = await sequelize.transaction();
    try {
      const address = await CustomerAddress.findOne({
        where: { id: addressId },
      });
      await CustomerAddress.update(
        { default: false },
        { where: { customerId: address.customerId } },
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
    try {
      await CustomerAddress.destroy({
        where: {
          id: addressId,
        },
      });
      return res.status(200).json({ message: "Thành công" });
    } catch (error) {
      console.log(error);
      next(error);
    }
  };
  addCustomerAddress = async (req, res, next) => {
    try {
      const data = req.body;
      if (!data.customerId) {
        return res
          .status(403)
          .json({ message: "ID Khách hàng không tồn tại", code: 403 });
      }
      // if (!data.provinceId) {
      //     return res.status(403).json({ message: "Tỉnh thành không thể bỏ trống", code: 403 });
      // }
      // if (!data.districtId) {
      //     return res.status(403).json({ message: "Quận huyện không thể bỏ trống", code: 403 });
      // }
      if (!data.address) {
        return res
          .status(403)
          .json({ message: "Địa chỉ không thể bỏ trống", code: 403 });
      }
      const customer = await Customer.findOne({
        where: { id: data.customerId },
      });
      if (!customer) {
        return res
          .status(403)
          .json({ message: "Khách hàng không tồn tại", code: 403 });
      }
      const user = await User.findOne({ where: { id: customer.userId } });
      const checkDefault = await CustomerAddress.findOne({
        where: { customerId: data.customerId, default: true },
      });
      CustomerAddress.create({
        customerName: data.name ? data.name : customer.name,
        phone: data.phone ? data.phone : user.phone,
        provinceId: data.provinceId ? data.provinceId : null,
        customerId: data.customerId,
        districtId: data.districtId ? data.districtId : null,
        default: checkDefault ? false : true,
        address: data.address,
      });
      return res.status(200).json({ message: "Thêm mới thành công" });
    } catch (error) {
      console.log(error);
      next(error);
    }
  };
  activeDeactive = async (req, res, next) => {
    const data = req.body;
    if (!data.id) {
      return res.status(422).json({ message: "ID không tồn tại" });
    }
    const t = await sequelize.transaction();
    try {
      const customer = await Customer.findOne({ where: { id: data.id } });
      if (!customer) {
        return res.status(422).json({ message: "Chủ cơ sở không tồn tại" });
      }
      const user = await User.findOne({ where: { id: customer.userId } });
      if (customer.active) {
        await customer.update(
          {
            active: false,
          },
          { transaction: t }
        );
        await user.update(
          {
            active: false,
          },
          { transaction: t }
        );
      } else {
        await customer.update(
          {
            active: true,
          },
          { transaction: t }
        );
        await user.update(
          {
            active: true,
          },
          { transaction: t }
        );
      }
      await t.commit();
      return res.status(200).json({ message: "Thành công" });
    } catch (error) {
      await t.rollback();
      console.log(error);
      next(error);
    }
  };
}

module.exports = new CustomerController();
