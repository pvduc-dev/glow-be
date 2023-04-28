const Staff = require("../models").Staff;
const Service = require("../models").Service;
const User = require("../models").User;
const Role = require("../models").Role;
const Order = require("../models").Order;
const StaffServicePrice = require("../models").StaffServicePrice;
const customerRoleCode = require("../constants/roles").customerRoleCode;
const ownerRoleCode = require("../constants/roles").ownerRoleCode;
const Store = require("../models").Store;
const StaffService = require("../models").StaffService;
const File = require("../models").File;
const { Op } = require("sequelize");
const { sequelize } = require("../models");
const defaultPassword = "12345678";
const staffRoleCode = require("../constants/roles").staffRoleCode;
const Owner = require("../models").Owner;

var bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const JWT_CONFiG = require("../config/jwt");
const { adminRoleCode } = require("../constants/roles");
const Province = require("../models").Province;
const District = require("../models").District;
const Commune = require("../models").Commune;
class StaffController {
  createStaff = async (req, res, next) => {
    const user = req.user;
    const data = req.body;
    if (!data.name) {
      return res
        .status(403)
        .json({ message: "Tên nhân viên không được bỏ trống" });
    }
    try {

      const checkEmail = await User.findOne({ where: { email: data.email } });
      const checkPhone = await User.findOne({ where: { phone: data.phone } });
      if (checkPhone) {
        return res
          .status(403)
          .json({ message: "Số điện thoại đã tồn tại", code: 403 });
      }
      if (data.userName) {
        const checkUserName = await User.findOne({
          where: { userName: data.userName },
        });
        if (checkUserName) {
          return res
            .status(403)
            .json({ message: "Tên đăng nhập đã tồn tại", code: 403 });
        }
      }
      if (checkEmail) {
        return res.status(403).json({ message: "Email đã tồn tại", code: 403 });
      }
      const roleCode = await user.roleCode;
      if (roleCode == customerRoleCode || roleCode == staffRoleCode) {
        return res.status(403).json({
          message: "Chức năng chỉ dành cho chủ cơ sở và quản trị viên",
        });
      }
      var storeId = null;
      if (roleCode == ownerRoleCode) {
        var owner = await Owner.findOne({ where: { userId: user.id } });
        storeId = owner.storeId
      }
      if (!storeId && !data.storeId) {
        return res.status(403).json({
          message: "Vui lòng cung cấp store",
        });
      }
      const result = await sequelize.transaction(async (t) => {
        const passHashed = bcrypt.hashSync(defaultPassword, 10);
        const staffRole = await Role.findOne({
          where: { code: staffRoleCode },
        });
        const user = await User.create(
          {
            name: data.name,
            userName: data.userName,
            email: data.email,
            password: passHashed,
            urlImage: data.urlImage,
            roleId: staffRole.id,
            phone: data.phone,
          },
          { transaction: t }
        );

        const staff = await Staff.create(
          {
            name: data.name,
            code: data.code,
            birthDay: data.birthDay,
            storeId: storeId ? storeId : data.storeId,
            address: data.address,
            indetifyNumber: data.indetifyNumber,
            placeIssue: data.placeIssue,
            dateIssue: data.dateIssue,
            phoneFamily: data.phoneFamily,
            gender: data.gender,
            userId: user.id,
            description: data.description,
            districtId: data.districtId,
            provinceId: data.provinceId,
            communeId: data.communeId,
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
                model: "staff",
                referenceId: staff.id,
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
  updateStaff = async (req, res, next) => {
    const user = req.user;
    const data = req.body;
    if (!data.name) {
      return res
        .status(403)
        .json({ message: "Tên nhân viên không được bỏ trống" });
    }
    if (!data.id) {
      return res
        .status(403)
        .json({ message: "ID nhân viên không được bỏ trống" });
    }
    try {
      const roleCode = await user.roleCode;
      if (roleCode == customerRoleCode || roleCode == staffRoleCode) {
        return res.status(403).json({
          message: "Chức năng chỉ dành cho chủ cơ sở và quản trị viên",
        });
      }
      const staff = await Staff.findOne({ where: { id: data.id } });
      if (roleCode == ownerRoleCode) {
        var owner = await Owner.findOne({ where: { userId: user.id } });
        if (staff.storeId != owner.storeId) {
          return res.status(403).json({
            message: "Nhân viên không thuộc quản lý của bạn",
          });
        }
      }
      const userId = staff.userId;

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

        await staff.update(
          {
            name: data.name,
            code: data.code,
            birthDay: data.birthDay,
            storeId: data.storeId,
            address: data.address,
            indetifyNumber: data.indetifyNumber,
            placeIssue: data.placeIssue,
            dateIssue: data.dateIssue,
            phoneFamily: data.phoneFamily,
            gender: data.gender,
            description: data.description,
            districtId: data.districtId,
            provinceId: data.provinceId,
            communeId: data.communeId,
          },
          { transaction: t }
        );
        await File.destroy(
          { where: { referenceId: data.id, model: "staff" } },
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
                model: "staff",
                referenceId: data.id,
              },
              { transaction: t }
            );
          }
        }
        return "Cập nhật thành công";
      });

      return res.status(200).json({ message: result });
    } catch (error) {
      console.log(error);
      next(error);
    }
  };
  getUserToken = async (req) => {
    try {
      const token = req.header("Authorization")
        ? req.header("Authorization").replace("Bearer", "").trim()
        : null;
      const decodeJwt = token ? jwt.verify(token, JWT_CONFiG.SECRET_KEY) : null;
      const user = decodeJwt
        ? await User.findOne({ where: { id: decodeJwt.user_id } })
        : null;
      return user;
    } catch (error) {
      return null;
    }
  };
  getListStaff = async (req, res, next) => {
    try {
      const user = await this.getUserToken(req);
      const roleCode = user ? await user.roleCode : null;
      const page = req.query.page ? req.query.page : 1;
      const perPage = req.query.perPage ? req.query.perPage : 10;
      const search = req.query.search ? req.query.search : null;
      const active = req.query.active ? req.query.active : null;
      const storeId = req.query.storeId ? req.query.storeId : null;
      const serviceIds = req.query.serviceIds ? req.query.serviceIds : null;
      var searchQuery = {};
      if (!roleCode || roleCode == customerRoleCode) {
        searchQuery = { active: true, online: true };
      }
      if (search) {
        searchQuery = { ...searchQuery, name: { [Op.iLike]: `%${search}%` } };
      }

      if (active && roleCode && roleCode != customerRoleCode) {
        searchQuery = { ...searchQuery, active: active };
      }
      if (storeId) {
        searchQuery = { ...searchQuery, storeId: storeId };
      }
      if (serviceIds && serviceIds.length > 0) {
        let staffIds = await StaffService.findAll({
          attributes: ["staffId"],
          where: {
            serviceId: {
              [Op.in]: serviceIds,
            },
          },
        });
        staffIds = staffIds.map((el) => el.staffId);
        searchQuery = {
          ...searchQuery,
          id: {
            [Op.in]: staffIds,
          },
        };
      }
      const data = await Staff.paginate({
        where: searchQuery,
        page: page, // Default 1
        paginate: perPage, // Default 25
        order: [["name", "DESC"]],
        include: [
          {
            model: Store,
            as: "store",
            attributes: ["id", "name", "address", "phone", "lat", "long"],
          },
          {
            model: User,
            as: "user",
            attributes: roleCode == adminRoleCode ?
              ['id', 'name', 'userName', 'email', 'urlImage', 'phone']
              : ['id', 'name', 'userName', 'email', 'urlImage'],
          },
          {
            model: Province,
            as: "province",
          },
          {
            model: District,
            as: "district",
          },
          {
            model: Commune,
            as: "commune",
          },
          {
            model: Service,
            as: "services",
            attributes: ["id", "price", "unit", "name", "imageUrl"],
            through: { attributes: ["id"] },
          },
        ],
        attributes: [
          "name",
          "active",
          "id",
          "birthDay",
          "userId",
          "gender",
          "address",
          "lat",
          "long",
          "online",
          "description",
          "busy",
          "rateAvg",
          "countReview"
        ],
      });
      data.currentPage = page;
      return res.status(200).json(data);
    } catch (error) {
      console.log(error);
      next(error);
    }
  };
  getDetailStaffWeb = async (req, res, next) => {
    const staffId = req.params.id;
    try {
      const staff = await Staff.findOne({
        where: { id: staffId },
        include: [
          { model: File, as: "images" },
          {
            model: Province,
            as: "province",
          },
          {
            model: District,
            as: "district",
          },
          {
            model: Commune,
            as: "commune",
          },
          {
            model: Service,
            as: "services",
            attributes: ["id", "price", "unit", "name", "imageUrl"],
            through: { attributes: ["id"] },
          },
          {
            model: StaffService,
            as: "staffService",
            attributes: ["id"],
            include: [
              {
                model: StaffServicePrice,
                as: "prices",
                attributes: ["price", "unit", "id"],
              },
            ],
          },
          { model: Store, as: "store" },
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
  getDetailStaff = async (req, res, next) => {
    const user = await this.getUserToken(req);
    const roleCode = user ? await user.roleCode : null;
    const staffId = req.params.id;

    try {
      const staff = await Staff.findOne({
        where: { id: staffId },
        attributes: {
          exclude:
            roleCode == ownerRoleCode || roleCode == adminRoleCode
              ? []
              : ["phoneFamily", "indetifyNumber", "placeIssue", "dateIssue"],
        },
        include: [
          {
            model: File,
            as: "images",
          },
          {
            model: Province,
            as: "province",
          },
          {
            model: District,
            as: "district",
          },
          {
            model: Commune,
            as: "commune",
          },
          {
            model: StaffService,
            as: "staffService",
            attributes: ["id"],
            include: [
              {
                model: StaffServicePrice,
                as: "prices",
                attributes: ["price", "unit", "id"],
              },
              {
                model: Service,
                as: "service",
                attributes: ["name", "imageUrl", "id"],
              },
            ],
          },
          { model: Store, as: "store", raw: true },
          {
            model: User,
            as: "user",
            attributes: roleCode == adminRoleCode || roleCode == ownerRoleCode ?
              ['id', 'name', 'userName', 'email', 'urlImage', 'phone']
              : ['id', 'name', 'userName', 'email', 'urlImage'],
          },
        ],
      });
      return res.status(200).json(staff);
    } catch (error) {
      console.log(error);
      next(error);
    }
  };
  activeDeactive = async (req, res, next) => {
    const data = req.body;
    const user = req.user;
    const roleCode = await user.roleCode;
    if (!data.id) {
      return res.status(422).json({ message: "ID không tồn tại" });
    }
    if (roleCode == customerRoleCode || roleCode == staffRoleCode) {
      return res.status(403).json({
        message: "Chức năng chỉ dành cho chủ cơ sở và quản trị viên",
      });
    }
    const t = await sequelize.transaction();
    try {
      const userLogin = req.user;
      const roleCode = await userLogin.roleCode;
      if (roleCode == customerRoleCode) {
        return res
          .status(500)
          .json({
            message: "Chức năng chỉ dành cho quản trị viên và chủ cơ sở",
          });
      }
      const staff = await Staff.findOne({ where: { id: data.id } });
      if (!staff) {
        return res.status(422).json({ message: "Nhân viên không tồn tại" });
      }
      const user = await User.findOne({ where: { id: staff.userId } });
      if (staff.active) {
        await staff.update(
          {
            active: false,
            online: false,
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
        await staff.update(
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

  getStaffWithDistance = async (req, res, next) => {
    const count = req.query.count ? req.query.count : 20;
    const search = req.query.search ? req.query.search : null;
    const storeId = req.query.storeId ? req.query.storeId : null;
    const lat = req.query.lat ? req.query.lat : null;
    const long = req.query.long ? req.query.long : null;
    const serviceId = req.query.serviceId ? req.query.serviceId : null;
    var searchQuery = { active: true, online: true };
    if (search) {
      searchQuery = { ...searchQuery, name: { [Op.iLike]: `%${search}%` } };
    }

    if (storeId) {
      searchQuery = { ...searchQuery, storeId: storeId };
    }
    if (serviceId) {
      let staffIds = await StaffService.findAll({
        attributes: ["staffId"],
        where: {
          serviceId: serviceId,
        },
      });
      staffIds = staffIds.map((el) => el.staffId);
      searchQuery = {
        ...searchQuery,
        id: {
          [Op.in]: staffIds,
        },
      };
    }
    if (!lat || !long) {
      return res.status(200).json([]);
    }
    var data = await Staff.findAll({
      where: searchQuery,
      include: [
        {
          model: Store,
          as: "store",
          attributes: ["id", "name", "address", "phone", "lat", "long"],
        },
        {
          model: User,
          as: "user",
          attributes: ["id", "phone", "urlImage", "email"],
        },
      ],
      attributes: [
        "id",
        "name",
        "status",
        "birthDay",
        "lat",
        "long",
        "address",
        "online",
        "busy"
      ],
      raw: true,
      nest: true,
    });
    data = await Promise.all(
      data.map(async (el) => {
        const staffLat = el.lat
          ? el.lat
          : el.store && el.store.lat
            ? el.store.lat
            : null;
        const staffLong = el.long
          ? el.long
          : el.store && el.store.long
            ? el.store.long
            : null;
        var distance = null;
        if (staffLat && staffLong && lat && long) {
          distance = this.calDistance(staffLat, staffLong, lat, long);
        }
        const totalReview = await Order.findAll({
          where: { staffId: el.id, rateReview: { [Op.ne]: null } },
          attributes: [
            [sequelize.fn("sum", sequelize.col("rateReview")), "total"],
          ],
          raw: true,
        });
        const countReview = await Order.findAll({
          where: { staffId: el.id, rateReview: { [Op.ne]: null } },
          attributes: [[sequelize.fn("count", sequelize.col("id")), "total"]],
          raw: true,
        });
        const avgReview =
          Number(countReview[0].total) != 0
            ? Number(
              Number(totalReview[0].total) / Number(countReview[0].total)
            )
            : 0;
        var serivceIds = await StaffService.findAll({
          where: { staffId: el.id },
          attributes: ["serviceId"],
        });
        serivceIds = serivceIds.map((it) => it.serviceId);
        const serivces = await Service.findAll({
          where: { id: { [Op.in]: serivceIds } },
          raw: true,
          attributes: ["id", "price", "unit", "code", "name", "imageUrl"],
        });
        return {
          ...el,
          distance,
          serivces,
          countReview: countReview[0].total,
          avgReview: avgReview.toFixed(1),
        };
      })
    );

    data.sort(function (a, b) {
      return a.distance - b.distance;
    });
    if (count && count < data.length) {
      data = data.filter((el, index) => index < count);
    }
    return res.status(200).json(data);
  };
  calDistance = (lat1, lon1, lat2, lon2) => {
    if (lat1 == lat2 && lon1 == lon2) {
      return 0;
    } else {
      var radlat1 = (Math.PI * lat1) / 180;
      var radlat2 = (Math.PI * lat2) / 180;
      var theta = lon1 - lon2;
      var radtheta = (Math.PI * theta) / 180;
      var dist =
        Math.sin(radlat1) * Math.sin(radlat2) +
        Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
      if (dist > 1) {
        dist = 1;
      }
      dist = Math.acos(dist);
      dist = (dist * 180) / Math.PI;
      dist = dist * 60 * 1.1515 * 1609.344;
      return dist.toFixed(1);
    }
  };

  getReviewStaff = async (req, res, next) => {
    const staffId = req.query.staffId;
    if (!staffId) {
      return res
        .status(403)
        .json({ message: "ID nhân viên không được bỏ trống" });
    }
    const page = req.query.page ? req.query.page : 1;
    const perPage = req.query.perPage ? req.query.perPage : 10;
    const order = await Order.paginate({
      where: { staffId: staffId, rateReview: { [Op.ne]: null } },
      page: page, // Default 1
      paginate: perPage, // Default 10
      order: [["updatedAt", "DESC"]],
      include: [
        { model: Staff, as: "staff", attributes: ["id", "name"] },
        {
          model: User,
          as: "userCustomer",
          attributes: ["id", "urlImage", "name"],
        },
      ],
      attributes: ["id", "noteReview", "rateReview", "updatedAt"],
    });
    order.currentPage = page;
    return res.status(200).json(order);
  };

  addStaffServicePrice = async (req, res, next) => {
    const data = req.body;
    if (!data.prices || data.prices.length == 0) {
      return res.status(403).json({ message: "Giá không được bỏ trống" });
    }
    if (!data.serviceId) {
      return res.status(403).json({ message: "Dịch vụ không được bỏ trống" });
    }
    if (!data.staffId) {
      return res.status(403).json({ message: "Nhân viên không được bỏ trống" });
    }
    const t = await sequelize.transaction();
    try {
      const userLogin = req.user;
      const roleCode = await userLogin.roleCode;
      if (roleCode == customerRoleCode) {
        return res
          .status(500)
          .json({
            message: "Chức năng chỉ dành cho quản trị viên và chủ cơ sở",
          });
      }
      var serviceStaff = await StaffService.findOne({
        where: { staffId: data.staffId, serviceId: data.serviceId },
      });
      if (serviceStaff) {
        return res.status(500).json({ message: "Dịch vụ đã tồn tại" });
      }
      serviceStaff = await StaffService.create(
        {
          staffId: data.staffId,
          serviceId: data.serviceId,
          unit: 0,
          price: 0,
        },
        { transaction: t }
      );
      for (const item of data.prices) {
        if (item.unit && item.price) {
          await StaffServicePrice.create(
            {
              unit: item.unit,
              price: item.price,
              serviceStaffId: serviceStaff.id,
            },
            { transaction: t }
          );
        }
      }
      await t.commit();
      return res.status(200).json({ message: "Thành công" });
    } catch (error) {
      console.log(error);
      await t.rollback();
      next(error);
    }
  };
  updateStaffServicePrice = async (req, res, next) => {
    const data = req.body;
    if (!data.prices || data.prices.length == 0) {
      return res.status(403).json({ message: "Giá không được bỏ trống" });
    }
    if (!data.serviceId) {
      return res.status(403).json({ message: "Dịch vụ không được bỏ trống" });
    }
    if (!data.staffId) {
      return res.status(403).json({ message: "Nhân viên không được bỏ trống" });
    }
    const user = req.user;
    const roleCode = await user.roleCode;
    if (roleCode == customerRoleCode || roleCode == staffRoleCode) {
      return res.status(403).json({
        message: "Chức năng chỉ dành cho chủ cơ sở và quản trị viên",
      });
    }

    const t = await sequelize.transaction();
    try {
      var serviceStaff = await StaffService.findOne({
        where: { staffId: data.staffId, serviceId: data.serviceId },
      });
      if (!serviceStaff) {
        return res.status(500).json({ message: "Dịch vụ không tồn tại" });
      }
      await StaffServicePrice.destroy(
        { where: { serviceStaffId: serviceStaff.id } },
        { transaction: t }
      );
      for (const item of data.prices) {
        if (item.unit && item.price) {
          await StaffServicePrice.create(
            {
              unit: item.unit,
              price: item.price,
              serviceStaffId: serviceStaff.id,
            },
            { transaction: t }
          );
        }
      }
      await t.commit();
      return res.status(200).json({ message: "Thành công" });
    } catch (error) {
      console.log(error);
      await t.rollback();
      next(error);
    }
  };
  onOffStaff = async (req, res, next) => {
    const data = req.body;
    if (!data.id) {
      return res.status(422).json({ message: "ID không tồn tại" });
    }
    try {
      const user = req.user;
      const roleCode = user ? await user.roleCode : null;
      if (!roleCode || roleCode == customerRoleCode || roleCode == staffRoleCode) {
        return res.status(500).json({ message: "Không có quyền thực hiện" });
      }
      const staff = await Staff.findOne({ where: { id: data.id } });
      if (!staff) {
        return res.status(422).json({ message: "Nhân viên không tồn tại" });
      }
      if (staff.online) {
        await staff.update({
          online: false,
        });
      } else {
        await staff.update({
          online: true,
        });
      }
      return res.status(200).json({ message: "Thành công!" });
    } catch (error) {
      console.log(error);
      next(error);
    }
  };
  getNewServiceStaff = async (req, res, next) => {
    const staffId = req.query.staffId;
    if (!staffId) {
      return res
        .status(403)
        .json({ message: "ID nhân viên không được bỏ trống" });
    }
    var serviceIds = await StaffService.findAll({
      where: { staffId: staffId },
    });
    serviceIds = serviceIds.map((el) => el.serviceId);
    const serivces = await Service.findAll({
      where: { id: { [Op.notIn]: serviceIds } },
    });
    return res.status(200).json(serivces);
  };

  getPriceServiceStaff = async (req, res, next) => {
    const staffId = req.query.staffId;
    const serviceId = req.query.serviceId;
    if (!staffId || !serviceId) {
      return res
        .status(403)
        .json({ message: "ID nhân viên và dịch vụ không được bỏ trống" });
    }
    var serviceStaff = await StaffService.findOne({
      where: { staffId: staffId, serviceId: serviceId },
    });
    const data = serviceStaff
      ? await StaffServicePrice.findAll({
        where: { serviceStaffId: serviceStaff.id },
      })
      : [];
    return res.status(200).json(data);
  };

  removeStaffPrice = async (req, res, next) => {
    const staffServiceId = req.params.id;
    if (!staffServiceId) {
      return res
        .status(403)
        .json({ message: "ID dịch vụ không được bỏ trống" });
    }
    const userLogin = req.user;
    const roleCode = await userLogin.roleCode;
    if (roleCode == customerRoleCode || roleCode == staffRoleCode) {
      return res.status(403).json({
        message: "Chức năng chỉ dành cho chủ cơ sở và quản trị viên",
      });
    }
    const t = await sequelize.transaction();
    try {
      await StaffServicePrice.destroy(
        { where: { serviceStaffId: staffServiceId } },
        { transaction: t }
      );
      await StaffService.destroy(
        { where: { id: staffServiceId } },
        { transaction: t }
      );
      await t.commit();
      return res.status(200).json({ message: "Thành công" });
    } catch (error) {
      await t.rollback();
      console.log(error);
      next(error);
    }
  };
}

module.exports = new StaffController();
