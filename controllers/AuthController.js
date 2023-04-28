var bcrypt = require("bcryptjs");
const User = require("../models").User;
const { validationResult } = require("express-validator");
const JWT_CONFiG = require("../config/jwt");
const Op = require("sequelize").Op;
const jwt = require("jsonwebtoken");
const Role = require("../models").Role;
const adminRoleCode = require("../constants/roles").adminRoleCode
const ownerRoleCode = require("../constants/roles").ownerRoleCode
const customerRoleCode = require("../constants/roles").customerRoleCode
const Customer = require("../models").Customer;
const Store = require("../models").Store;
const Owner = require("../models").Owner;
const Staff = require("../models").Staff;
const CustomerAddress = require("../models").CustomerAddress;
const { sequelize } = require("../models");
const axios = require('axios');
var https = require('https');
const NodeCache = require("node-cache");
const myCache = new NodeCache();
const lockTime = 8 //Thời gian khóa otp 8 giờ
class AuthController {
  login = async (req, res, next) => {
    try {
      const errors = validationResult(req); // Finds the validation errors in this request and wraps them in an object with handy functions
      if (!errors.isEmpty()) {
        res.status(422).json({ message: "Vui lòng nhập email, hoặc tên đăng nhập và mật khẩu", errors: errors.array() });
        return;
      }
      const data = req.body;
      const user = await User.findOne({
        where: {
          [Op.or]: [{ email: data.email_username }, { userName: data.email_username }, { phone: data.email_username }],
        },
      });
      if (!user) {
        return res.status(422).json({ message: "Email hoặc tên đăng nhập không chính xác" });
      }
      if (!user.active) {
        return res.status(403).json({ message: "Tài khoản chưa được kích hoạt" });
      }
      const roleCode = await user.roleCode
      if (![adminRoleCode, ownerRoleCode].includes(roleCode)) {
        return res.status(422).json({ message: "Không có quyền đăng nhập" });
      }
      let checkPass = bcrypt.compareSync(data.password, user.password);
      if (checkPass) {
        const token = await this.generateToken(user);
        if (token) {
          return res.status(200).json(token);
        } else {
          return res.status(500).json({ message: "Đăng nhập thất bại" });
        }
      } else {
        return res.status(422).json({ message: "Mật khẩu không chính xác" });
      }
    } catch (error) {
      console.log(error)
      next(error)
    }

  };
  loginMobile = async (req, res, next) => {
    try {
      const errors = validationResult(req); // Finds the validation errors in this request and wraps them in an object with handy functions
      if (!errors.isEmpty()) {
        res.status(422).json({ message: "Vui lòng nhập số điện thoại hoặc email và mật khẩu", errors: errors.array() });
        return;
      }
      const data = req.body;
      const user = await User.findOne({
        where: {
          [Op.or]: [{ email: data.email_username }, { userName: data.email_username }, { phone: data.email_username }],
        },
      });
      if (!user) {
        return res.status(422).json({ message: "Số điện thoại hoặc email không chính xác" });
      }
      if (!user.active) {
        return res.status(403).json({ message: "Tài khoản chưa được kích hoạt" });
      }
      const roleCode = await user.roleCode
      if (roleCode != customerRoleCode) {
        return res.status(422).json({ message: "Ứng dụng chỉ dành cho khách hàng" });
      }
      let checkPass = bcrypt.compareSync(data.password, user.password);
      if (checkPass) {
        const token = await this.generateToken(user);
        if (token) {
          await user.update({ numberFailedLogin: 0, lockedAt: null });
          return res.status(200).json(token);
        } else {
          return res.status(500).json({ message: "Đăng nhập thất bại" });
        }
      } else {
        return res.status(422).json({ message: "Mật khẩu không chính xác" });
      }
    } catch (error) {
      console.log(error)
      next(error)
    }

  };
  loginMobileStaff = async (req, res, next) => {
    try {
      const errors = validationResult(req); // Finds the validation errors in this request and wraps them in an object with handy functions
      if (!errors.isEmpty()) {
        res.status(422).json({ message: "Vui lòng nhập số điện thoại hoặc email và mật khẩu", errors: errors.array() });
        return;
      }
      const data = req.body;
      const user = await User.findOne({
        where: {
          [Op.or]: [{ email: data.email_username }, { userName: data.email_username }, { phone: data.email_username }],
        },
      });
      if (!user) {
        return res.status(422).json({ message: "Số điện thoại hoặc email không chính xác" });
      }
      if (!user.active) {
        return res.status(403).json({ message: "Tài khoản chưa được kích hoạt" });
      }
      const roleCode = await user.roleCode
      if (roleCode == adminRoleCode || roleCode == customerRoleCode) {
        return res.status(422).json({ message: "Ứng dụng chỉ dành cho nhân viên và chủ cơ sở" });
      }
      var staff = null;
      var owner = null;
      staff = await Staff.findOne({ where: { userId: user.id } });
      owner = await Owner.findOne({ where: { userId: user.id } });
      const storeId = staff ? staff.storeId : owner.storeId;
      const store = await Store.findOne({ where: { id: storeId } });
      if (store && !store.active) {
        return res.status(422).json({ message: "Cửa hàng của bạn đã ngừng hoạt động" });
      }

      let checkPass = bcrypt.compareSync(data.password, user.password);
      if (checkPass) {
        const token = await this.generateToken(user);
        if (token) {
          await user.update({ numberFailedLogin: 0, lockedAt: null });
          return res.status(200).json(token);
        } else {
          return res.status(500).json({ message: "Đăng nhập thất bại" });
        }
      } else {
        return res.status(422).json({ message: "Mật khẩu không chính xác" });
      }
    } catch (error) {
      console.log(error)
      next(error)
    }

  };
  generateToken = async user => {
    try {
      const access_token = jwt.sign({ user_id: user.id }, JWT_CONFiG.SECRET_KEY, { expiresIn: JWT_CONFiG.AccessTokenTime });
      // const refresh_token = jwt.sign({ user_id: user.id }, JWT_CONFiG.SECRET_KEY, { expiresIn: JWT_CONFiG.RefreshTokenTime });
      let oldToken = JSON.parse(user.tokens);
      if (oldToken === null) {
        oldToken = [];
      }
      // oldToken.push({ access_token: access_token, refresh_token: refresh_token })
      oldToken.push(access_token);
      await user.update({
        tokens: JSON.stringify(oldToken),
      });
      return { message: "Đăng nhập thành công", token: access_token, expiresIn: JWT_CONFiG.AccessTokenTime, userId: user.id };
    } catch (error) {
      console.log(error)
      next(error)
      return false;
    }
  };
  signUp = async (req, res, next) => {
    const t = await sequelize.transaction();
    try {
      const data = req.body;
      if (!data.phone) {
        return res.status(403).json({ message: "Số điện thoại không được bỏ trống" });
      }
      if (!data.password) {
        return res.status(403).json({ message: "Mật khẩu không thể bỏ trống" });
      }
      const checkPhone = await this.checkPhoneExist(data.phone);
      if (checkPhone.status != 200) {
        return res.status(checkPhone.status).json(checkPhone);
      }
      data.phone = data.phone.trim();
      data.phone = data.phone.replace(/\s/g, '');
      if (data.phone[0] == '+') {
        data.phone = data.phone.slice(1);
      }
      if (data.email) {
        const checkEmail = await User.findOne({ where: { email: data.email } });
        if (checkEmail) {
          return res.status(403).json({ message: "Email đã tồn tại", code: 403 });
        }
      }
      if (data.userName) {
        const checkUserName = await User.findOne({ where: { userName: data.userName } });
        if (checkUserName) {
          return res.status(403).json({ message: "Tên đăng nhập đã tồn tại", code: 403 });
        }
      }
      let passHashed = bcrypt.hashSync(data.password, 10);
      const customerRole = await Role.findOne({ where: { code: customerRoleCode } })
      const user = await User.create({
        name: data.name ? data.name : null,
        userName: data.userName ? data.userName : null,
        email: data.email ? data.email : null,
        password: passHashed,
        phone: data.phone,
        roleId: customerRole.id,
        urlImage: data.urlImage ? data.urlImage : null,
      }, { transaction: t });
      const customer = await Customer.create({
        name: data.name ? data.name : null,
        birthDay: null,
        userId: user.id,
      }, { transaction: t })
      await t.commit();
      return res.status(200).json({ message: "Thành công" });
    } catch (error) {
      await t.rollback();
      console.log(error)
      next(error)
    }
  };
  refreshToken = async (req, res, next) => {
    try {
      const token = req.header("Authorization").replace("Bearer", "").trim();
      if (!token) {
        return res.status(422).json({ message: "Token không tồn tại" });
      }
      let decodedToken = null;
      decodedToken = jwt.verify(token, JWT_CONFiG.SECRET_KEY, { ignoreExpiration: true });
      const user = await User.findOne({ where: { id: decodedToken.user_id } });
      if (!user) {
        return res.status(404).json({ message: "User không tồn tại" });
      }
      let now = Math.floor(Date.now() / 1000);
      if (Number(now - decodedToken.exp) > Number(JWT_CONFiG.RefreshTokenTime)) {
        return res.status(403).json({ message: "Vui lòng đăng nhập lại" });
      }
      const newToken = await this.generateToken(user);
      return res.status(200).json(newToken);
    } catch (error) {
      console.log(error)
      next(error)
    }
  };
  logout = async (req, res, next) => {
    const user = req.user;
    const token = req.header("Authorization").replace("Bearer", "").trim();
    const tokenList = JSON.parse(user.tokens);
    let indexToken = tokenList.findIndex(el => el === token);
    if (indexToken != -1) {
      tokenList.splice(indexToken, 1);
      await user.update({
        tokens: JSON.stringify(tokenList),
      });
    }
    return res.status(200).json({ message: "Đăng xuất thành công" });
  };
  logoutAllDevice = async (req, res) => {
    const user = req.user;
    await user.update({ tokens: null });
    return res.json({ message: "Đã đăng xuất trên toàn bộ thiết bị" });
  };
  me = async (req, res, next) => {
    try {
      const token = req.header("Authorization").replace("Bearer", "").trim();
      const decodeJwt = jwt.verify(token, JWT_CONFiG.SECRET_KEY);
      const user = await User.findOne({
        where: { id: decodeJwt.user_id }, include: [
          { model: Role, as: "role" },
        ]
      });
      var staff = null;
      var owner = null;
      owner = await Owner.findOne({ where: { userId: user.id } });
      staff = owner ? null : await Staff.findOne({ where: { userId: user.id } });
      const storeId = owner ? owner.storeId : (staff ? staff.storeId : null);
      const store = await Store.findOne({ where: { id: storeId } });
      user.setDataValue('store', store)
      user.setDataValue('storeId', storeId)
      return res.status(200).json(user);
    } catch (error) {
      console.log(error)
      return res.status(401).json(null);
    }
  };

  updateMyUser = async (req, res, next) => {
    try {
      const user = req.user;
      const data = req.body;
      if (!data.phone) {
        res.status(403).json({ message: "Số điện thoại không được bỏ trống" });
      }
      const checkEmail = await User.findOne({ where: { email: data.email, id: { [Op.not]: user.id } } });
      const checkUserName = await User.findOne({ where: { userName: data.userName, id: { [Op.not]: user.id } } });
      const checkPhone = await User.findOne({ where: { phone: data.phone, id: { [Op.not]: user.id } } });
      if (checkUserName) {
        res.status(403).json({ message: "Tên đăng nhập đã tồn tại" });
      }
      if (checkEmail) {
        res.status(403).json({ message: "Email đã tồn tại" });
      }
      if (checkPhone) {
        res.status(403).json({ message: "Số điện thoại đã tồn tại" });
      }
      await user.update({
        name: data.name,
        userName: data.userName,
        email: data.email,
        phone: data.phone,
        urlImage: data.urlImage
      });
      return res.status(200).json({ message: "Thành công" });
    } catch (error) {
      console.log(error)
      next(error)
    }
  };

  verifyPhoneNumber = async (req, res) => {
    var phone = req.body.phone;
    if (!phone) {
      return res.status(403).json({ message: "Số điện thoại không được bỏ trống" });
    }
    phone = phone.trim();
    phone = phone.replace(/\s/g, '');
    const checkPhone = await this.checkPhoneExist(phone)
    return res.status(checkPhone.status).json(checkPhone);
  }

  checkPhoneExist = async (phone, userId = null) => {
    try {
      const phoneFormat = [phone];
      if (phone[0] == '+') {
        phoneFormat.push(phone.slice(1));
      }
      if (phone[0] == '0') {
        phoneFormat.push(`84${phone.slice(1)}`);
        phoneFormat.push(`+84${phone.slice(1)}`);
      }
      if (phone[0] == '8' && phone[1] == '4') {
        phoneFormat.push(`+${phone}`);
        phoneFormat.push(`0${phone.slice(2)}`);
      }
      const checkPhone = await User.findOne({
        where: {
          phone: {
            [Op.in]: phoneFormat,
          }
        }
      });
      if (checkPhone) {
        return { code: 'phoneExist', status: 403, otpTime: null, message: "Số điện thoại đã tồn tại" }
      }
      const otp = Math.floor(Math.random() * 900000) + 100000;
      const otpTime = 120;
      myCache.set(phone, otp, otpTime)
      await this.sendOtp(phone, 'Ma xac thuc cua ban la: ' + otp)
      return { code: 'sentOtp', status: 200, otpTime: otpTime, message: "Đã gửi OTP đến số điện thoại" }
    }
    catch (error) {
      console.log(error)
      return { code: 'error', status: 500, otpTime: null, message: "Không thể xác minh số điện thoại" }
    }
  }
  sendOtp = async (phoneNumber, content) => {
    const httpsAgent = new https.Agent({
      rejectUnauthorized: false,
    });
    var data = JSON.stringify({
      "phoneNumber": phoneNumber,
      "content": content
    });
    var config = {
      method: 'post',
      url: 'https://pccc.sful.vn/api/sendsms',
      headers: {
        'Content-Type': 'application/json'
      },
      httpsAgent,
      data: data
    };
    try {
      const respon = await axios(config)
      return "DONE"
    } catch (error) {
      console.log(error);
      return "ERROR"
    }
  }
  verifyOtp = async (req, res) => {
    const data = req.body;
    if (!data.phoneNumber) {
      return res.status(403).json({ message: "Số điện thoại không được bỏ trống" });
    }
    if (!data.otp) {
      return res.status(403).json({ message: "OTP không được bỏ trống" });
    }
    const otpOrigin = myCache.get(data.phoneNumber);
    const user = await User.findOne({ where: { phone: data.phoneNumber } });
    if (user) {
      const lockedAt = user.lockedAt;
      const faildTime = user.numberFailedLogin;
      if (lockedAt) {
        let time = Math.ceil(Math.abs(new Date() - new Date(lockedAt)) / 1000 / 60)
        if (time > lockTime * 60) {
          await user.update({ lockedAt: null })
        } else {
          return res.status(500).json({ message: `Vui lòng chờ sau ${this.handleTime(lockTime * 60 - time)}. Để nhận OTP`, code: 'error' });
        }
      }

      if (otpOrigin == data.otp) {
        await user.update({ lockedAt: null })
        return res.status(200).json({ message: "Xác minh thành công", code: 'next' });
      } else if (faildTime > 9) {
        await user.update({ lockedAt: new Date() });
        myCache.del(data.phoneNumber)
        return res.status(500).json({ message: `Bạn đã nhập sai 10 lần! Vui lòng chờ sau ${this.handleTime(lockTime * 60 - time)} để nhận OTP`, code: 'error' });
      } else if (faildTime < 10) {
        await user.update({ numberFailedLogin: +faildTime + 1 });
      }
    }
    else {
      if (otpOrigin == data.otp) {
        return res.status(200).json({ message: "Xác minh thành công", code: 'next' });
      }
    }
    return res.status(500).json({ message: "OTP không hợp lệ", code: 'error' });
  }
  sendOtpForgePassword = async (req, res, next) => {
    try {
      const data = req.body;
      if (!data.phone) {
        return res.status(403).json({ message: "Số điện thoại không được bỏ trống" });
      }
      const user = await User.findOne({
        where: {
          phone: data.phone
        }
      });
      if (!user) {
        return res.status(403).json({ message: "Số điện thoại không tồn tại trên hệ thống" });
      }

      const otp = Math.floor(Math.random() * 900000) + 100000;
      const otpTime = 180;
      const lockedAt = user.lockedAt;
      if (lockedAt) {
        let time = Math.ceil(Math.abs(new Date() - new Date(lockedAt)) / 1000 / 60)
        if (time > lockTime * 60) {
          await user.update({ lockedAt: null })
        } else {
          return res.status(500).json({ message: `Vui lòng chờ sau ${this.handleTime(lockTime * 60 - time)}. Để nhận OTP`, code: 'error' });
        }
      }

      myCache.set(data.phone, otp, otpTime)
      await this.sendOtp(data.phone, 'Ma xac thuc de khoi phuc mat khau cua ban la: ' + otp);
      return res.status(200).json({ message: "Đã gửi OTP", code: 'next', otpTime: otpTime });
    } catch (error) {
      console.log(error)
      next(error)
    }
  }
  forgetPasswordByOtp = async (req, res, next) => {
    try {
      const data = req.body;
      if (!data.phone) {
        return res.status(403).json({ message: "Số điện thoại không được bỏ trống" });
      }
      if (!data.otp) {
        return res.status(403).json({ message: "Mã không được bỏ trống" });
      }
      if (!data.password) {
        return res.status(403).json({ message: "Mật khẩu không được bỏ trống" });
      }
      const user = await User.findOne({
        where: {
          phone: data.phone
        }
      });
      if (!user) {
        return res.status(403).json({ message: "Số điện thoại không tồn tại trên hệ thống" });
      }

      const otpOrigin = myCache.get(data.phone);
      if (otpOrigin == data.otp) {
        myCache.del(data.phone)
        let passHashed = bcrypt.hashSync(data.password, 10);
        await user.update({
          password: passHashed
        });
        return res.status(200).json({ message: "Cập nhật mật khẩu thành công" });
      }
      else {
        myCache.del(data.phone)
        return res.status(403).json({ message: "Vui lòng gửi lại OTP" });
      }
    } catch (error) {
      console.log(error)
      next(error)
    }

  }
  handleTime(time) {
    try {
      if (time > 60) {
        return Math.round(time / 60) + ' giờ'
      } else {
        return time + ' phút'
      }
    } catch (error) {
      return ''
    }
  }
}

module.exports = new AuthController();
