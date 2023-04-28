const Store = require("../models").Store;
const User = require("../models").User;
const Staff = require("../models").Staff;
const Owner = require("../models").Owner;
const Service = require("../models").Service;
const ownerRoleCode = require("../constants/roles").ownerRoleCode;
const adminRoleCode = require("../constants/roles").adminRoleCode;
const customerRoleCode = require("../constants/roles").customerRoleCode;
const { sequelize } = require("../models");

const { Op } = require("sequelize");

class StoreController {
  getListStoreAdmin = async (req, res, next) => {
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
      const data = await Store.paginate({
        where: searchQuery,
        page: page, // Default 1
        paginate: perPage, // Default 25
        order: [["updatedAt", "DESC"]],
        include: [
          { model: Owner, as: "owner" },
          { model: Service, as: "services", through: { attributes: [] } },
        ],
      });

      data.currentPage = page;
      return res.status(200).json(data);
    } catch (error) {
      console.log(error);
      next(error);
    }
  };

  getListStore = async (req, res, next) => {
    try {
      const page = req.query.page ? req.query.page : 1;
      const perPage = req.query.perPage ? req.query.perPage : 10;
      const search = req.query.search ? req.query.search : null;
      var searchQuery = { active: true };
      if (search) {
        searchQuery = { ...searchQuery, name: { [Op.iLike]: `%${search}%` } };
      }
      const data = await Store.paginate({
        where: searchQuery,
        page: page, // Default 1
        paginate: perPage, // Default 25
        order: [["updatedAt", "DESC"]],
        include: [
          { model: Owner, as: "owner" },
          { model: Service, as: "services", through: { attributes: [] } },
        ],
        attributes: {
          exclude: ["taxDate", "taxProvide", "companyCode", "taxCode", "code"],
        },
      });

      data.currentPage = page;
      return res.status(200).json(data);
    } catch (error) {
      console.log(error);
      next(error);
    }
  };
  createStore = async (req, res, next) => {
    try {
      const user = req.user;
      const data = req.body;
      const roleCode = await user.roleCode;
      if (roleCode != adminRoleCode) {
        return res
          .status(403)
          .json({ message: "Chức năng chỉ dành cho quản trị viên" });
      }
      if (!data.name) {
        return res
          .status(403)
          .json({ message: "Tên cơ sở không được bỏ trống" });
      }
      Store.create(data);
      return res.status(200).json({ message: "Thêm mới thành công" });
    } catch (error) {
      console.log(error);
      next(error);
    }
  };
  updateStore = async (req, res, next) => {
    try {
      const user = req.user;
      const data = req.body;
      const roleCode = await user.roleCode;
      if (roleCode != adminRoleCode) {
        return res
          .status(403)
          .json({ message: "Chức năng chỉ dành cho quản trị viên" });
      }
      if (!data.id) {
        return res.status(422).json({ message: "Cơ sở không tồn tại" });
      }
      await Store.update(data, { where: { id: data.id } });
      return res.status(200).json({ message: "Cập nhật thành công" });
    } catch (error) {
      console.log(error);
      next(error);
    }
  };
  activeDeactive = async (req, res, next) => {
    const user = req.user;
    const data = req.body;
    if (!data.id) {
      res.status(422).json({ message: "Cơ sở không tồn tại" });
    }
    const roleCode = await user.roleCode;
    if (roleCode != adminRoleCode) {
      return res
        .status(403)
        .json({ message: "Chức năng chỉ dành cho quản trị viên" });
    }
    try {
      const store = await Store.findOne({ where: { id: data.id } });
      if (!store) {
        res.status(422).json({ message: "Cơ sở không tồn tại" });
      }
      if (store.active) {
        await store.update({
          active: false,
        });
        const staffs = await Staff.findAll({ where: { storeId: data.id }, raw: true, nest: true });
        const owners = await Owner.findAll({ where: { storeId: data.id }, raw: true, nest: true });
        for (const staff of staffs) {
          const useStaff = await User.findOne({ where: { id: staff.userId } });
          await useStaff.update({ active: false });
          await Staff.update({ active: false, online: false }, { where: { id: staff.id } })
        }
        for (const owner of owners) {
          const userOWner = await User.findOne({ where: { id: owner.userId } });
          await userOWner.update({ active: false });
          await Owner.update({ active: false }, { where: { id: owner.id } })
        }
      } else {
        store.update({
          active: true,
        });
      }
      return res.status(200).json({ message: "Thành công" });
    } catch (error) {
      console.log(error);
      next(error);
    }
  };
  getDetailStore = async (req, res, next) => {
    try {
      const storeId = req.params.id;
      const user = req.user;
      const roleCode = await user.roleCode;
      if (roleCode == customerRoleCode) {
        return res.status(403).json({
          message: "Chức năng chỉ dành cho chủ cơ sở và quản trị viên",
        });
      }
      const data = await Store.findOne({
        where: { id: storeId },
        include: [
          { model: Owner, as: "owner" },
          { model: Service, as: "services", through: { attributes: [] } },
        ],
      });
      return res.status(200).json(data);
    } catch (error) {
      console.log(error);
      next(error);
    }
  };
}

module.exports = new StoreController();
