const User = require("../models").User;
const Role = require("../models").Role;
const { validationResult } = require("express-validator");
var bcrypt = require("bcryptjs");
const Op = require("sequelize").Op;
const adminRoleCode = require("../constants/roles").adminRoleCode

class UserController {
  changePassword = async (req, res, next) => {
    const user = req.user;
    const data = req.body;
    const errors = validationResult(req); // Finds the validation errors in this request and wraps them in an object with handy functions
    if (!errors.isEmpty()) {
      res.status(422).json({ message: "Nhập đầy đủ dữ liệu để thay đổi mật khẩu", errors: errors.array() });
      return;
    }
    try {
      if (data.newPassWord !== data.reNewPassWord) {
        return res.status(403).json({ message: "Mật khẩu 2 lần nhập không chính khớp" });
      }
      if (data.newPassWord === data.currentPass) {
        return res.status(403).json({ message: "Mật khẩu mới không được trùng mật khẩu cũ !" });
      }
      let checkPass = bcrypt.compareSync(data.currentPass, user.password);
      if (!checkPass) {
        return res.status(402).json({ message: "Mật khẩu hiện tại không chính xác" });
      }
      let passHashed = bcrypt.hashSync(data.newPassWord, 10);
      await user.update({
        password: passHashed,
        tokens: null, //Logout all
      });
      return res.status(200).json({ message: "Đổi mật khẩu thành công" });
    } catch (error) {
      console.log(error)
      next(error)
    }
  };
  userList = async (req, res, next) => {
    const page = req.query.page ? req.query.page : 1;
    const perPage = req.query.perPage ? req.query.perPage : 10;
    const search = req.query.search ? req.query.search : null;
    const roleId = req.query.roleId ? req.query.roleId : null;
    const active = req.query.active ? req.query.active : null;
    var searchQuery = {};
    if (search) {
      searchQuery = {
        ...searchQuery, [Op.or]: [
          { name: { [Op.iLike]: `%${search}%` } },
          { phone: { [Op.iLike]: `%${search}%` } }
        ]
      }
    }
    if (roleId) {
      searchQuery = { ...searchQuery, roleId }
    }

    if (active) {
      searchQuery = { ...searchQuery, active: active }
    }
    const data = await User.paginate({
      where: searchQuery,
      page: page, // Default 1
      paginate: perPage, // Default 25
      order: [["updatedAt", "DESC"]],
      include: [{ model: Role, as: "role" }],
    });

    data.currentPage = page;
    return res.status(200).json(data);
  };
  activeUser = async (req, res, next) => {
    const data = req.body;
    const user = req.user;
    if (!data.userId) {
      return res.status(404).json({ message: "Người dùng không tồn tại" });
    }
    if (data.userId === user.id) {
      return res.status(402).json({ message: "Không thể thay đổi trạng thái của chính mình" });
    }
    try {
      await User.update(
        {
          active: data.active,
          tokens: null,
        },
        { where: { id: data.userId } }
      );
      return res.status(200).json("Thành công!");
    } catch (error) {
      console.log(error)
      next(error)
    }
  };
  updateUser = async (req, res, next) => {
    const errors = validationResult(req); // Finds the validation errors in this request and wraps them in an object with handy functions
    if (!errors.isEmpty()) {
      return res.status(422).json({ message: "Dữ liệu không hợp lệ! Không thể đăng ký", errors: errors.array() });
    }
    const data = req.body;
    if (data.password !== data.confirmPassword) {
      res.status(422).json({ message: "Mật khẩu 2 lần nhập không trùng khớp" });
    }
    if (!data.id) {
      res.status(422).json({ message: "Người dùng không tồn tại" });
    }
    if (!data.phone) {
      res.status(422).json({ message: "Số điện thoại không được bỏ trống" });
    }
    const checkUserName = await User.findOne({ where: { userName: data.userName, id: { [Op.not]: data.id } } });
    const checkEmail = await User.findOne({ where: { email: data.email, id: { [Op.not]: data.id } } });
    const checkPhone = await User.findOne({ where: { phone: data.phone, id: { [Op.not]: data.id } } });
    if (checkPhone) {
      return res.status(403).json({ message: "Số điện thoại đã tồn tại" });
    }
    if (checkUserName) {
      return res.status(403).json({ message: "Tên đăng nhập đã tồn tại" });
    }
    if (checkEmail) {
      return res.status(403).json({ message: "Email đã tồn tại" });
    }
    try {
      const user = await User.findOne({ where: { id: data.id } });
      if (data.password) {
        let passHashed = bcrypt.hashSync(data.password, 10);
        user.update({
          name: data.name,
          userName: data.userName,
          email: data.email,
          phone: data.phone ? data.phone : null,
          password: passHashed,
          roleId: data.roleId,
          urlImage: data.urlImage,
          tokens: null
        });

      } else {
        user.update({
          name: data.name,
          userName: data.userName,
          email: data.email,
          roleId: data.roleId,
          urlImage: data.urlImage,
          phone: data.phone ? data.phone : null
        });
      }
      return res.status(200).json(user);
    } catch (error) {
      console.log(error)
      next(error)
    }
  };
  createUser = async (req, res, next) => {
    const errors = validationResult(req); // Finds the validation errors in this request and wraps them in an object with handy functions
    if (!errors.isEmpty()) {
      res.status(422).json({ message: "Dữ liệu không hợp lệ! Không thể đăng ký", errors: errors.array() });
      return;
    }
    const data = req.body;
    if (data.password !== data.confirmPassword) {
      res.status(422).json({ message: "Mật khẩu 2 lần nhập không trùng khớp" });
    }
    const checkUserName = await User.findOne({ where: { userName: data.userName } });
    const checkEmail = await User.findOne({ where: { email: data.email } });
    const checkPhone = await User.findOne({ where: { phone: data.phone } });
    if (checkUserName) {
      return res.status(403).json({ message: "Tên đăng nhập đã tồn tại" });
    }
    if (checkEmail) {
      return res.status(403).json({ message: "Email đã tồn tại" });
    }
    if (checkPhone) {
      return res.status(403).json({ message: "Số điện thoại đã tồn tại" });
    }
    try {
      let passHashed = bcrypt.hashSync(data.password, 10);
      const adminRole = await Role.findOne({ where: { code: adminRoleCode } })
      const user = await User.create({
        name: data.name,
        userName: data.userName,
        email: data.email,
        password: passHashed,
        roleId: adminRole.id,
        active: false,
        phone: data.phone ? data.phone : null,
        urlImage: data.urlImage
      });

      return res.status(200).json(user);
    } catch (error) {
      console.log(error)
      next(error)
    }
  };
  uploadAvatar = async (req, res, next) => {
    return res.json(req.file);
  };
}

module.exports = new UserController();
