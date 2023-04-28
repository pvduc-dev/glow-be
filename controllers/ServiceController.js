const Service = require("../models").Service;
const User = require("../models").User;
const Staff = require("../models").Staff;
const Store = require("../models").Store;
const File = require("../models").File;
const customerRoleCode = require("../constants/roles").customerRoleCode;
const StoreService = require("../models").StoreService;
const StaffService = require("../models").StaffService;
const { Op } = require("sequelize");
const { sequelize } = require("../models");
const adminRoleCode = require("../constants/roles").adminRoleCode;
const STATUS = require("../constants/status");
const { staffRoleCode } = require("../constants/roles");

class ServiceController {
  getListService = async (req, res, next) => {
    const page = req.query.page ? req.query.page : 1;
    const perPage = req.query.perPage ? req.query.perPage : 10;
    const search = req.query.search ? req.query.search : null;
    const active = req.query.active ? req.query.active : null;
    const storeIds = req.query.storeIds ? req.query.storeIds : null;
    var searchQuery = {};
    if (search) {
      searchQuery = { ...searchQuery, name: { [Op.iLike]: `%${search}%` } };
    }

    if (active) {
      searchQuery = { ...searchQuery, active: active };
    }
    if (storeIds && storeIds.length) {
      let serviceIds = await StoreService.findAll({
        attributes: ["serviceId"],
        where: {
          storeId: {
            [Op.in]: storeIds,
          },
        },
      });
      serviceIds = serviceIds.map((el) => el.serviceId);
      searchQuery = {
        ...searchQuery,
        id: {
          [Op.in]: serviceIds,
        },
      };
    }
    const data = await Service.paginate({
      where: searchQuery,
      page: page, // Default 1
      paginate: perPage, // Default 25
      order: [["updatedAt", "DESC"]],
      include: [
        {
          model: Store,
          as: "stores",
          through: { attributes: [] },
          attributes: ["id", "name"],
        },
        {
          model: User,
          as: "createdByUser",
          attributes: ["id", "name", "userName", "email"],
        },
        {
          model: User,
          as: "handleByUser",
          attributes: ["id", "name", "userName", "email"],
        },
      ],
    });

    data.currentPage = page;
    return res.status(200).json(data);
  };
  getDetailService = async (req, res, next) => {
    const serviceId = req.params.id;
    try {
      const service = await Service.findOne({
        where: { id: serviceId },
        include: [
          { model: File, as: "images" },
          {
            model: Staff,
            as: "staffs",
            through: { attributes: ["price", "unit", "note"] },
            include: [
              { model: Store, as: "store", attributes: ["id", "name"] },
              {
                model: User,
                as: "user",
                attributes: ["id", "phone", "urlImage", "email", "userName"],
              },
            ],
          },
          { model: Store, as: "stores", through: { attributes: [] } },
          {
            model: User,
            as: "createdByUser",
            attributes: ["id", "name", "userName", "email"],
          },
          {
            model: User,
            as: "handleByUser",
            attributes: ["id", "name", "userName", "email"],
          },
        ],
      });
      return res.status(200).json(service);
    } catch (error) {
      console.log(error);
      next(error);
    }
  };
  createService = async (req, res, next) => {
    try {
      const user = req.user;
      const roleCode = await user.roleCode;
      const status = this.checkStatusbyRole(roleCode);
      const handleByUserId = roleCode == adminRoleCode ? user.id : null;
      if (roleCode == customerRoleCode || roleCode == staffRoleCode) {
        return res.status(403).json({
          message: "Chức năng chỉ dành cho chủ cơ sở và quản trị viên",
        });
      }
      const data = req.body;
      if (!data.name) {
        return res
          .status(403)
          .json({ message: "Tên dịch vụ không được bỏ trống" });
      }
      if (!data.price || !data.unit) {
        return res
          .status(403)
          .json({ message: "Đơn vị tính và giá bán không thể bỏ trống" });
      }
      const result = await sequelize.transaction(async (t) => {
        const service = await Service.create(
          {
            name: data.name,
            code: data.code,
            price: data.price,
            imageUrl: data.imageUrl,
            status: status,
            description: data.description,
            unit: data.unit,
            handleByUserId: handleByUserId,
            createdByUserId: user.id,
          },
          { transaction: t }
        );
        if (data.images && data.images.length) {
          for (const item of data.images) {
            await File.create(
              {
                fieldname: item.originalname,
                originalname: item.originalname,
                encoding: item.encoding,
                mimetype: item.mimetype,
                destination: item.destination,
                filename: item.filename,
                path: item.path,
                size: item.size,
                model: "service",
                referenceId: service.id,
              },
              { transaction: t }
            );
          }
        }
        if (data.stores && data.stores.length) {
          for (const item of data.stores) {
            await StoreService.create(
              {
                storeId: item.id,
                serviceId: service.id,
              },
              { transaction: t }
            );
          }
        }
        return "Thêm mới thành công";
      });

      return res.status(200).json({ message: result });
    } catch (error) {
      console.log(error);
      next(error);
    }
  };
  updateService = async (req, res, next) => {
    try {
      const data = req.body;
      if (!data.name) {
        return res
          .status(403)
          .json({ message: "Tên dịch vụ không được bỏ trống" });
      }
      if (!data.id) {
        return res
          .status(403)
          .json({ message: "ID dịch vụ không được bỏ trống" });
      }
      if (!data.price || !data.unit) {
        return res
          .status(403)
          .json({ message: "Đơn vị tính và giá bán không thể bỏ trống" });
      }
      const user = req.user;
      const roleCode = await user.roleCode;
      if (roleCode == customerRoleCode) {
        return res.status(403).json({
          message: "Chức năng chỉ dành cho chủ cơ sở và quản trị viên",
        });
      }
      const result = await sequelize.transaction(async (t) => {
        const service = await Service.findOne({ where: { id: data.id } });
        await service.update(
          {
            name: data.name,
            code: data.code,
            price: data.price,
            imageUrl: data.imageUrl,
            description: data.description,
            unit: data.unit,
          },
          { transaction: t }
        );
        await File.destroy(
          { where: { referenceId: data.id, model: "service" } },
          { transaction: t }
        );
        if (data.images && data.images.length) {
          for (const item of data.images) {
            await File.create(
              {
                fieldname: item.originalname,
                originalname: item.originalname,
                encoding: item.encoding,
                mimetype: item.mimetype,
                destination: item.destination,
                filename: item.filename,
                path: item.path,
                size: item.size,
                model: "service",
                referenceId: data.id,
              },
              { transaction: t }
            );
          }
        }
        await StoreService.destroy(
          { where: { serviceId: data.id } },
          { transaction: t }
        );
        if (data.stores && data.stores.length) {
          for (const item of data.stores) {
            await StoreService.create(
              {
                storeId: item.id,
                serviceId: service.id,
              },
              { transaction: t }
            );
          }
        }
        // await StaffService.destroy({ where: { serviceId: data.id } }, { transaction: t })
        // if (data.staffs && data.staffs.length) {
        //     for (const item of data.staffs) {
        //         await StaffService.create({
        //             staffId: item.id,
        //             serviceId: data.id,
        //             price: item.price,
        //             unit: item.unit,
        //             note: item.note ? item.note : null
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
  activeDeactive = async (req, res, next) => {
    const data = req.body;
    if (!data.id) {
      res.status(422).json({ message: "Dịch vụ không tồn tại" });
    }
    try {
      const service = await Service.findOne({ where: { id: data.id } });
      if (!service) {
        res.status(422).json({ message: "Dịch vụ không tồn tại" });
      }
      if (service.active) {
        service.update({
          active: false,
        });
      } else {
        service.update({
          active: true,
        });
      }
      return res.status(200).json({ message: "Thành công" });
    } catch (error) {
      console.log(error);
      next(error);
    }
  };
  removeImage = async (req, res, next) => {
    const idImage = req.params.id;
    try {
      if (!idImage) {
        return res
          .status(403)
          .json({ message: "ID hình ảnh không thể bỏ trống" });
      }
      const image = await File.findOne({ where: { id: idImage } });
      if (!image) {
        return res.status(403).json({ message: "Hình ảnh không tồn tại" });
      }
      await image.destroy();
      return res.status(200).json({ message: "Thành công" });
    } catch (error) {
      console.log(error);
      next(error);
    }
  };
  handleStatus = async (req, res, next) => {
    try {
      const status = req.body.status;
      const idService = req.body.id;
      if (!STATUS[status]) {
        return res.status(500).json({ message: "Trạng thái không hợp lệ" });
      }
      const user = req.user;
      const roleCode = await user.roleCode;
      if (adminRoleCode != roleCode) {
        return res.status(422).json({ message: "Bạn không có quyền này" });
      }
      await Service.update(
        {
          status: status,
          handleByUserId: req.user.id,
        },
        { where: { id: idService } }
      );

      return res.status(200).json({ message: "Thành công" });
    } catch (error) {
      console.log(error);
      next(error);
    }
  };
  checkStatusbyRole = (roleCode) => {
    try {
      if (roleCode == adminRoleCode) {
        return STATUS.APPROVED;
      }
      return STATUS.PENDING;
    } catch (error) {
      console.log(error);
      return res.status(500).json({ message: "Người dùng không tồn tại" });
    }
  };
}

module.exports = new ServiceController();
