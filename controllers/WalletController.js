const BaoKimAPI = require("../config/baoKim");
const axios = require("axios");
var https = require("https");
const NodeCache = require("node-cache");
const myCache = new NodeCache();
const { sequelize } = require("../models");
const Transaction = require("../models").Transaction;
const User = require("../models").User;
const Role = require("../models").Role;
const Op = require("sequelize").Op;

const adminRoleCode = require("../constants/roles").adminRoleCode;
const customerRoleCode = require("../constants/roles").customerRoleCode;
const baoKimUrl = new BaoKimAPI().getUrl();
const baoKimVersion = new BaoKimAPI().getVersion();
const crypto = require("crypto");
const mobileNotification = require("../config/oneSingal");
const { ownerRoleCode } = require("../constants/roles");
const Notification = require("../models").Notification;

class WalletController {
  payOrder = async (orderData) => {
    try {
      const token = new BaoKimAPI().getToken();
      const httpsAgent = new https.Agent({
        rejectUnauthorized: false,
      });
      var config = {
        method: "post",
        url: `${baoKimUrl}api/${baoKimVersion}/order/send`,
        headers: {
          jwt: "Bearer " + token,
          "Content-Type": "application/json",
        },
        data: orderData,
        httpsAgent,
      };
      const respon = await axios(config);
      return respon;
    } catch (error) {
      next(error);
      return "ERROR";
    }
  };

  getBankPaymentMethod = async (req, res, next) => {
    try {
      const token = new BaoKimAPI().getToken();
      const httpsAgent = new https.Agent({
        rejectUnauthorized: false,
      });
      var config = {
        method: "get",
        url: `${baoKimUrl}api/${baoKimVersion}/bpm/list`,
        headers: {
          jwt: "Bearer " + token,
          "Content-Type": "application/json",
        },
        httpsAgent,
      };
      const respon = await axios(config);
      const types = [
        {
          type: 1,
          name: "Thanh toán qua thẻ ATM",
          data: [],
        },
        {
          type: 2,
          name: "Thẻ Visa/MasterCard",
          data: [],
        },
        {
          type: 14,
          name: "Mã QR",
          data: [],
        },
        {
          type: 17,
          name: "Ví MoMo",
          data: [],
        },
        {
          type: 18,
          name: "Ví Viettel Pay",
          data: [],
        },
        {
          type: 19,
          name: "Ví Zalo Pay",
          data: [],
        },
      ];
      respon.data.data.forEach((item) => {
        types.map((el) => {
          if (el.type == item.type) {
            el.data.push(item);
          }
        });
      });

      return res.status(200).json(types);
    } catch (error) {
      console.log(error);
      next(error);
    }
  };
  addMoneybyBaoKim = async (req, res, next) => {
    const t = await sequelize.transaction();
    try {
      const user = req.user;
      const money = req.body.money;
      const bpmId = req.body.bpmId;
      const code = this.genateCode();
      const content = "Giao dịch nạp tiền vào ví";
      const currentMoney = user.totalMoney;
      const transaction = await Transaction.create(
        {
          code: code,
          forUserId: user.id,
          content: content,
          orderId: null,
          money: money,
          totalMoney: Number(currentMoney) + Number(money),
          userCreate: user.id,
        },
        { transaction: t }
      );
      myCache.set(code, { money: money, id: transaction.id, code: code }, 1800);
      const dataPay = {
        mrc_order_id: code,
        total_amount: money,
        description: content,
        merchant_id: 40002,
        lang: "vi",
        webhooks: "http://18.143.182.174:3000/api/wallet-success",
        customer_email: user.email ? user.email : `${user.phone}@email.com`,
        customer_phone: user.phone,
        customer_name: user.name ? user.name : user.phone,
        url_success: "http://18.143.182.174/home",
      };
      if (bpmId) {
        dataPay.bpm_id = bpmId;
      }
      const resPay = await this.payOrder(dataPay);
      if (resPay == "ERROR") {
        await t.rollback();
        return res.status(500).json({ message: "Lỗi thanh toán" });
      }
      await t.commit();
      return res.status(200).json(resPay.data);
    } catch (error) {
      console.log(error);
      await t.rollback();
      next(error);
    }
  };
  addMoneySuccess = async (req, res, next) => {
    const t = await sequelize.transaction();
    try {
      const rawData = req.rawBody.toString("utf8");
      const signValid = new BaoKimAPI().checkSignData(rawData);
      if (!signValid) {
        return res.status(500).json({ message: "Webhook Chữ ký không hợp lệ" });
      }
      const data = req.body;
      const orderPaymen = data.order;
      var transaction = myCache.get(orderPaymen.mrc_order_id);
      if (
        signValid &&
        transaction &&
        transaction.code == orderPaymen.mrc_order_id &&
        orderPaymen.stat == "c" &&
        orderPaymen.total_amount == transaction.money
      ) {
        const tran = await Transaction.findOne({
          where: { id: transaction.id },
        });
        const user = await User.findOne({ where: { id: tran.forUserId } });
        const currentMoney = user.totalMoney;
        await user.update({
          totalMoney: Number(currentMoney) + Number(transaction.money),
        });
        await tran.update({ success: true });
        myCache.del(orderPaymen.mrc_order_id);
        this.sendSocketPayment(tran.forUserId, tran);
      }
      await t.commit();
      return res.status(200).json({ err_code: "0", message: "Thành công" });
    } catch (error) {
      await t.rollback();
      console.log(error);
      next(error);
    }
  };

  getTransaction = async (req, res, next) => {
    try {
      const page = req.query.page ? req.query.page : 1;
      const perPage = req.query.perPage ? req.query.perPage : 10;
      const search = req.query.search ? req.query.search : null;
      const user = req.user;
      const roleCode = await user.roleCode;

      var searchQuery = {};
      if (search) {
        searchQuery = { ...searchQuery, code: { [Op.iLike]: `%${search}%` } };
      }
      if (roleCode == customerRoleCode || roleCode == ownerRoleCode) {
        searchQuery = { ...searchQuery, forUserId: user.id };
      }
      const data = await Transaction.paginate({
        where: searchQuery,
        page: page, // Default 1
        paginate: perPage, // Default 25
        order: [["updatedAt", "DESC"]],
        include: [
          {
            model: User,
            as: "user",
            attributes: ["id", "name", "urlImage", "phone"],
          },
          {
            model: User,
            as: "userCreated",
            attributes: ["id", "name", "urlImage", "phone"],
          },
        ],
      });
      data.currentPage = page;
      return res.status(200).json(data);
    } catch (error) {
      console.log(error);
      next(error);
      // return res.status(500).json({ "message": "Có lỗi" });
    }
  };
  genateCode = () => {
    const string = crypto.randomBytes(8).toString("hex");
    return string.toUpperCase();
  };

  sendSocketPayment = (userId, data) => {
    //Xoa socketID trung lap
    try {
      const uniqueIds = [];
      _socketUsers = _socketUsers.filter((element) => {
        const isDuplicate = uniqueIds.includes(element.socketId);
        if (!isDuplicate) {
          uniqueIds.push(element.socketId);
          return true;
        }
        return false;
      });
      //Ban socket
      const users = _socketUsers.filter((el) => el.userId == userId);

      if (users && users.length > 0) {
        for (const user of users) {
          _io.to(`${user.socketId}`).emit("add-money-wallet", data);
          console.log(`Da gui socket den ${userId}`);
        }
        return "DONE";
      }

    } catch (error) {
      console.log(error);
      return "ERROR";
    }
  };

  createTransaction = async (req, res, next) => {
    const t = await sequelize.transaction();
    try {
      const user = req.user;
      const roleCode = await user.roleCode;
      if (roleCode != adminRoleCode) {
        return res
          .status(500)
          .json({ message: "Chức năng chỉ dành cho quản trị viên" });
      }
      const data = req.body;
      const type = data.type;
      if (type != "add" && type != "sub") {
        return res.status(500).json({ message: "Loại giao dịch không hợp lệ" });
      }
      const userId = data.userId;
      if (!userId) {
        return res
          .status(500)
          .json({ message: "Chủ tài khoản không được bỏ trống" });
      }
      const money = Number(data.money).toFixed(0);
      if (!money) {
        return res
          .status(500)
          .json({ message: "Số tiền giao dịch không được bỏ trống" });
      }
      const customerUser = await User.findOne({ where: { id: userId } });
      if (!customerUser) {
        return res.status(500).json({ message: "Khách hàng không tồn tại" });
      }
      const currentMoney = customerUser.totalMoney;
      await customerUser.update({
        totalMoney: type == 'add' ? Number(currentMoney) + Number(money) : Number(currentMoney) - Number(money),
      }, { transaction: t });
      const transaction = await Transaction.create({
        code: this.genateCode(),
        forUserId: userId,
        content: data.content ? data.content : `Giao dịch ${type == 'add' ? 'nạp' : 'trừ'} tiền vào ví bởi quản trị viên`,
        orderId: null,
        money: money,
        totalMoney: type == 'add' ? Number(currentMoney) + Number(money) : Number(currentMoney) - Number(money),
        userCreate: user.id,
        add: type == 'add' ? true : false,
        success: true
      }, { transaction: t });
      await Notification.create({
        toUserId: userId,
        content: type == 'add' ? `Bạn được cộng ${money} đ vào ví Glow` : `Bạn bị trừ ${money} đ vào ví Glow`,
        type: 'TRACSACTION',
        referenceId: transaction.id,
      }, { transaction: t });
      await mobileNotification(
        "CUSTOMER",
        userId,
        type == 'add' ? `Bạn được cộng ${money} đ vào ví Glow` : `Bạn bị trừ ${money} đ vào ví Glow`,
        { transactionId: transaction.id }
      );
      this.sendSocketPayment(userId, transaction);
      await t.commit();
      return res.status(200).json({ message: "Thành công" });
    } catch (error) {
      await t.rollback();
      console.log(error);
      next(error);
    }
  };

  getCustomerOwner = async (req, res, next) => {
    try {
      const page = req.query.page ? req.query.page : 1;
      const perPage = req.query.perPage ? req.query.perPage : 10;
      const search = req.query.search ? req.query.search : null;
      var roleIds = await Role.findAll({ where: { code: { [Op.in]: [ownerRoleCode, customerRoleCode] } } });
      roleIds = roleIds ? roleIds.map(el => el.id) : [];
      var searchQuery = {};
      if (search) {
        searchQuery = { ...searchQuery, name: { [Op.iLike]: `%${search}%` } };
      }
      const data = await User.paginate({
        where: { ...searchQuery, roleId: { [Op.in]: roleIds }, active: true },
        page: page, // Default 1
        paginate: perPage, // Default 25
        include: [
          {
            model: Role,
            as: "role",
            attributes: ["id", "name", "code"],
          }
        ],
        attributes: ["id", "name", "email", 'phone', 'roleId', 'urlImage'],
      });
      return res.status(200).json(data);
    } catch (error) {
      console.log(error);
      next(error);
    }
  }
}
module.exports = new WalletController();
