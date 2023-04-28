const StaffService = require("../models").StaffService;
const Voucher = require("../models").Voucher;
const Owner = require("../models").Owner;

const Store = require("../models").Store;
const ServiceBooking = require("../models").ServiceBooking;
const Service = require("../models").Service;

const Order = require("../models").Order;
const User = require("../models").User;
const Staff = require("../models").Staff;
const Notification = require("../models").Notification;
const Payment = require("../models").Payment;
const StaffServicePrice = require("../models").StaffServicePrice;
const ownerRoleCode = require("../constants/roles").ownerRoleCode;
const adminRoleCode = require("../constants/roles").adminRoleCode;
const customerRoleCode = require("../constants/roles").customerRoleCode;
const mobileNotification = require("../config/oneSingal");
const callPhone = require("../config/callPhone");
const typeVoucher = require("../constants/typeVoucher");
const { Op } = require("sequelize");
const orderStatus = require("../constants/status");
const CustomerAddress = require("../models").CustomerAddress;
const { sequelize } = require("../models");
const BaoKimAPI = require("../config/baoKim");
const axios = require("axios");
var https = require("https");
const NodeCache = require("node-cache");
const Transaction = require("../models").Transaction;
const myCache = new NodeCache();
const crypto = require("crypto");
const baoKimUrl = new BaoKimAPI().getUrl();
const baoKimVersion = new BaoKimAPI().getVersion();
const { IncomingWebhook } = require("@slack/webhook");
const SLACK_URL = require("../config/slack");
const { staffRoleCode } = require("../constants/roles");
const kue = require("kue");
const queue = kue.createQueue();
const feeRefun = Number(20 / 100);
class OrderController {
  countMoney = async (data) => {
    var total = 0;
    var discount = 0;
    var totalPay = 0;
    var voucherId = null;
    var fee = 0;
    if (data.priceIds && data.priceIds.length) {
      for (const item of data.priceIds) {
        const service = await StaffServicePrice.findOne({
          where: { id: item },
        });
        if (service) {
          total = Number(total) + Number(Number(service.price));
        }
      }
    }
    if (data.voucherCode) {
      const voucher = await Voucher.findOne({
        where: {
          code: data.voucherCode,
          startTime: { [Op.lte]: new Date() },
          endTime: { [Op.gte]: new Date() },
        },
      });
      voucherId = voucher ? voucher.id : null;
      if (!voucher) {
        discount = 0;
      } else if (voucher.used >= voucher.quantity) {
        discount = 0;
      } else {
        if (voucher && voucher.type == typeVoucher.PHANTRAM) {
          discount =
            total >= voucher.minValueOrder ? (voucher.value * total) / 100 : 0;
          discount =
            discount > voucher.maxReduce ? voucher.maxReduce : discount;
        }
        if (voucher && voucher.type == typeVoucher.GIATIEN) {
          discount = total >= voucher.minValueOrder ? voucher.value : 0;
        }
      }
    }
    if (data.staffId && data.customerLat && data.customerLon) {
      const staff = await Staff.findOne({ where: { id: data.staffId } });
      if (staff) {
        if (staff.lat && staff.long) {
          fee = this.countFee(
            staff.lat,
            staff.long,
            data.customerLat,
            data.customerLon
          );
        } else {
          const store = await Store.findOne({ where: { id: staff.storeId } });
          fee = store
            ? this.countFee(
              store.lat,
              store.long,
              data.customerLat,
              data.customerLon
            )
            : 0;
        }
      }
    }
    if (data.storeId) {
      fee = 0;
    }
    totalPay = total - Number(discount) + Number(fee);
    return {
      total,
      discount,
      totalPay,
      voucherId,
      fee,
      rewardPoints: 0,
    };
  };
  getMoney = async (req, res, next) => {
    const data = req.body;
    const money = await this.countMoney(data);
    return res.status(200).json(money);
  };
  createOrder = async (req, res, next) => {
    const user = req.user;
    try {
      const data = req.body;
      const roleCode = await user.roleCode;
      if (roleCode != customerRoleCode) {
        return res
          .status(403)
          .json({ message: "Chức năng chỉ dành cho khách hàng" });
      }
      if (!data.staffId) {
        return res.status(400).json({ message: "Nhân viên không tồn tại" });
      }
      if (!data.paymentMethodId) {
        return res
          .status(400)
          .json({ message: "Phương thức thanh toán không thể bỏ trống" });
      }
      if (!data.addressId && !data.storeId && (!data.lat || !data.long)) {
        return res.status(400).json({ message: "Địa chỉ không tồn tại" });
      }
      if (!data.priceIds || data.priceIds.length == 0) {
        return res.status(400).json({ message: "Chưa chọn dịch vụ" });
      }

      var address = {};
      if (data.addressId) {
        address = await CustomerAddress.findOne({
          where: { id: data.addressId },
        });
        address = address ? address : {};
      }
      const orderLat = !data.storeId
        ? data.lat
          ? data.lat
          : address.lat
        : null;
      const orderLon = !data.storeId
        ? data.long
          ? data.long
          : address.long
        : null;
      const money = await this.countMoney({
        priceIds: data.priceIds,
        voucherCode: data.voucherCode,
        staffId: data.staffId,
        storeId: data.storeId,
        customerLat: orderLat,
        customerLon: orderLon,
      });
      const orderCode = this.genateCode();
      const timeData = this.handleTimeOrder(
        null,
        "create_order",
        "Đặt đơn thành công",
        Date.now()
      );
      var lastOrder = await Order.findOne({
        where: { customerUserId: user.id },
        order: [["createdAt", "DESC"]],
      });
      if (
        lastOrder &&
        [orderStatus.PENDING, orderStatus.DOING, orderStatus.APPROVED].includes(
          lastOrder.status
        )
      ) {
        return res.status(400).json({
          message:
            "Hiện bạn có một dịch vụ chưa hoàn thành. Vui lòng hoàn thành dịch vụ để đặt đơn kế tiếp",
        });
      }
      const dataOrder = {
        storeId: data.storeId ? data.storeId : null,
        staffId: data.staffId,
        voucherId: money.voucherId,
        discount: money.discount,
        total: money.total,
        totalPay: money.totalPay,
        provinceId: data.storeId
          ? data.provinceId
            ? data.provinceId
            : address.provinceId
          : null,
        districtId: data.storeId
          ? data.districtId
            ? data.districtId
            : address.districtId
          : null,
        address: !data.storeId
          ? data.address
            ? data.address
            : address && address.address
              ? address.address
              : "Không xác định"
          : null,
        lat: orderLat,
        long: orderLon,
        status: orderStatus.PENDING,
        customerUserId: user.id,
        handleByUser: null,
        paymentMethodId: data.paymentMethodId,
        rewardPoint: data.rewardPoints,
        fee: money.fee,
        code: orderCode,
        name: null,
        note: data.note,
        accessTime: null,
        successTime: null,
        noteReview: null,
        noteFeedback: null,
        rateReview: null,
        rateFeedback: null,
        timeData: timeData,
      };
      var checkStaff = await Staff.findOne({
        where: { id: data.staffId },
        raw: true,
        nest: true,
      });
      if (!checkStaff) {
        return res.status(400).json({ message: "Kỹ thuật viên không tồn tại" });
      }
      if (checkStaff.busy) {
        return res.status(400).json({
          message:
            "Hiện tại kỹ thuật viên đã có một đơn hàng khác! Bạn vui lòng đợi đơn hàng này được hoàn thành",
        });
      }
      if (!checkStaff.online) {
        return res.status(400).json({
          message:
            "Hiện tại kỹ thuật viên đang offline. Bạn vui lòng đặt kỹ thuật viên khác hoặc chờ đến khi kỹ thuật viên online",
        });
      }
      if (!checkStaff.online || !checkStaff.active) {
        return res
          .status(400)
          .json({ message: "Kỹ thuật viên hiện không hoạt động" });
      }
      var order = null;
      var staff = null;
      if (data.paymentMethodId == 1) {
        const result = await sequelize.transaction(async (t) => {
          order = await Order.create(dataOrder, { transaction: t });
          staff = await Staff.findOne({ where: { id: order.staffId } });
          await this.addBookingOrder(order, data.priceIds);
          var owner = null;
          if (staff) {
            owner = await Owner.findOne({
              where: { storeId: staff.storeId },
            });
            if (owner) {
              const userOwner = await User.findOne({ where: { id: owner.userId } })
              callPhone(userOwner.phone, 'Bạn có đơn hàng mới, vui lòng xác nhận', next)
              await mobileNotification(
                "PARTNER",
                owner.userId,
                `Bạn có một đơn hàng mới`,
                { orderId: order.id }
              );
            }
          }
          if (money.voucherId && money.discount > 0) {
            const voucher = await Voucher.findOne({
              where: { id: money.voucherId },
            });
            const used = voucher ? Number(voucher.used) + 1 : null;
            if (used) {
              await voucher.update({ used: used });
            }
          }
          await staff.update({ busy: true });
          this.sendSlack(order);
          this.jobCancelOrder(order.id, next);

        });
      }
      if (data.paymentMethodId == 2) {
        myCache.set(
          orderCode,
          {
            data: dataOrder,
            prices: data.priceIds,
            voucherId: money.voucherId,
          },
          1800
        );
        const payBK = {
          mrc_order_id: dataOrder.code,
          total_amount: dataOrder.totalPay,
          description: `Thanh toán đơn hàng ${dataOrder.code}`,
          merchant_id: 40002,
          lang: "vi",
          webhooks: "http://18.143.182.174:3000/api/pay-success",
          customer_email: user.email ? user.email : `${user.phone}@email.com`,
          customer_phone: user.phone,
          customer_name: user.name ? user.name : user.phone,
          customer_address: dataOrder.address,
        };
        if (data.bpmId) {
          payBK.bpm_id = data.bpmId;
        }
        const resPay = await this.payOrder(payBK);
        if (resPay == "ERROR") {
          return res.status(500).json({ message: "Lỗi thanh toán" });
        }
        return res.status(200).json(resPay.data);
      }
      if (data.paymentMethodId == 3) {
        const result = await sequelize.transaction(async (t) => {
          if (user.totalMoney < money.totalPay) {
            return res.status(500).json({ message: "Không đủ tiền trong ví" });
          }
          const haveMoney = Number(user.totalMoney) - Number(money.totalPay);
          dataOrder.is_paid = true;
          order = await Order.create(dataOrder, { transaction: t });
          staff = await Staff.findOne({ where: { id: order.staffId } });
          await user.update({ totalMoney: haveMoney }, { transaction: t });
          await Transaction.create(
            {
              code: this.genateCode(),
              forUserId: user.id,
              content: "Thanh toán cho đơn hàng " + orderCode,
              orderId: order.id,
              money: money.totalPay,
              totalMoney: haveMoney,
              userCreate: user.id,
              success: true,
              add: false,
            },
            { transaction: t }
          );
          await this.addBookingOrder(order, data.priceIds);
          if (money.voucherId && money.discount > 0) {
            const voucher = await Voucher.findOne({
              where: { id: money.voucherId },
            });
            const used = voucher ? Number(voucher.used) + 1 : null;
            if (used) {
              await voucher.update({ used: used });
            }
          }
          await staff.update({ busy: true });
          await this.sendSlack(order);
          this.jobCancelOrder(order.id);
          await mobileNotification(
            "PARTNER",
            staff.userId,
            `Bạn có một đơn hàng mới`,
            { orderId: order.id }
          );
          var owner = null;
          if (staff) {
            owner = await Owner.findAll({
              where: { storeId: staff.storeId },
              raw: true,
              nest: true,
            });
            if (owner && owner.length > 0) {
              for (const it of owner) {
                await mobileNotification(
                  "PARTNER",
                  it.userId,
                  `Bạn có một đơn hàng mới`,
                  { orderId: order.id }
                );
              }
            }
          }
        });
      }
      if (order) {
        await this.createNotification(
          staff.userId,
          `Bạn có đơn hàng mới`,
          order.id
        );
        await this.createNotification(
          user.id,
          `Bạn đã đặt lịch thành công. Vui lòng chờ xác nhận`,
          order.id
        );
      }
      return res
        .status(200)
        .json({ message: "Thành công", orderId: order ? order.id : null });
    } catch (error) {
      // console.log(error)
      next(error);
    }
  };
  addBookingOrder = async (order, prices) => {
    try {
      for (const item of prices) {
        const serivcePrice = await StaffServicePrice.findOne({
          where: { id: item },
          raw: true,
        });
        const serivce = await StaffService.findOne({
          where: { id: serivcePrice.serviceStaffId },
        });
        const originService = await Service.findOne({
          where: { id: serivce.serviceId },
        });
        await ServiceBooking.create({
          serviceId: serivcePrice.serviceStaffId,
          orderId: order.id,
          amount: 0,
          price: serivcePrice.price,
          unit: serivcePrice.unit,
          serviceName: originService ? originService.name : null,
          imageUrl: originService ? originService.imageUrl : null,
        });
      }
      return "DONE";
    } catch (error) {
      console.log(error);
      return "ERROR";
    }
  };
  getMyOrder = async (req, res, next) => {
    try {
      const user = req.user;
      const roleCode = await user.roleCode;
      var staff = null;
      var owner = null;
      var staffIds = null;
      staff = await Staff.findOne({ where: { userId: user.id } });
      owner = await Owner.findOne({ where: { userId: user.id } });
      if (owner) {
        staffIds = await Staff.findAll({ where: { storeId: owner.storeId } });
        staffIds = staffIds ? staffIds.map((el) => el.id) : [];
      }

      const page = req.query.page ? req.query.page : 1;
      const perPage = req.query.perPage ? req.query.perPage : 10;
      const status = req.query.status ? req.query.status : null;
      var searchQuery = staff
        ? { staffId: staff.id }
        : owner
          ? { staffId: { [Op.in]: staffIds } }
          : { customerUserId: user.id };
      if (status) {
        searchQuery = {
          ...searchQuery,
          status: {
            [Op.in]: status,
          },
        };
      }
      const data = await Order.paginate({
        page: page, // Default 1
        paginate: perPage, // Default 25
        order: [["updatedAt", "DESC"]],
        include: [
          {
            model: User,
            as: "userCustomer",
            attributes: ["id", "name", "urlImage", "phone"],
          },
          {
            model: Staff,
            as: "staff",
            attributes: ["id", "name", "rateAvg", "countReview"],
            include: [
              {
                model: User,
                as: "user",
                attributes: ["id", "urlImage", "phone"],
              },
              {
                model: Store,
                as: "store",
                attributes: ["id", "name", "imageUrl", "phone", "address"],
              },
            ],
          },
          { model: Payment, as: "payment", attributes: ["id", "name"] },
          {
            model: Store,
            as: "store",
            attributes: [
              "id",
              "name",
              "imageUrl",
              "phone",
              "lat",
              "long",
              "address",
            ],
            raw: true,
            nest: true,
          },
          {
            model: Voucher,
            as: "voucher",
            attributes: ["id", "name", "name", "code", "type", "value"],
            raw: true,
            nest: true,
          },
          {
            model: User,
            as: "handleBy",
            attributes: ["id", "name", "urlImage", "phone"],
          },
          {
            model: ServiceBooking, as: 'booking', attributes: ['id', 'unit', 'price', 'amount', 'serviceName', 'imageUrl']
          }
        ],
        where: searchQuery,
      });
      // data.docs = await Promise.all(
      //   data.docs.map(async (el) => {
      //     const totalReview = await Order.findAll({
      //       where: { staffId: el.staffId, rateReview: { [Op.ne]: null } },
      //       attributes: [
      //         [sequelize.fn("sum", sequelize.col("rateReview")), "total"],
      //       ],
      //       raw: true,
      //     });
      //     const countReview = await Order.findAll({
      //       where: { staffId: el.staffId, rateReview: { [Op.ne]: null } },
      //       attributes: [[sequelize.fn("count", sequelize.col("id")), "total"]],
      //       raw: true,
      //     });
      //     const avgReview =
      //       Number(countReview[0].total) != 0
      //         ? Number(
      //           Number(totalReview[0].total) / Number(countReview[0].total)
      //         )
      //         : 0;
      //     var staff = { ...el.staff };
      //     staff.countReview = countReview[0].total;
      //     staff.avgReview = avgReview.toFixed(1);
      //     const booking = await ServiceBooking.findAll({
      //       where: { orderId: el.id },
      //       attributes: [
      //         "id",
      //         "unit",
      //         "price",
      //         "amount",
      //         "serviceName",
      //         "imageUrl",
      //       ],
      //     });
      //     return {
      //       ...el,
      //       staff,
      //       booking,
      //       voucher: el.voucher.id ? el.voucher : null,
      //       store: el.store.id ? el.store : null,
      //       handleBy: el.handleBy.id ? el.handleBy : null,
      //     };
      //   })
      // );

      data.currentPage = page;
      return res.status(200).json(data);
    } catch (error) {
      console.log(error);
      next(error);
    }
  };
  getOrder = async (req, res, next) => {
    try {
      const user = req.user;
      const roleCode = await user.roleCode;

      var staff = null;
      staff = await Staff.findOne({ where: { userId: user.id } });
      if (roleCode != adminRoleCode) {
        return res
          .status(403)
          .json({ message: "Chức năng chỉ dành cho quản trị viên", docs: [] });
      }
      const page = req.query.page ? req.query.page : 1;
      const perPage = req.query.perPage ? req.query.perPage : 10;
      const status = req.query.status ? req.query.status : null;
      const fromDate = req.query.fromDate ? req.query.fromDate : null;
      const toDate = req.query.toDate ? req.query.toDate : null;
      const staffId = req.query.staffId ? req.query.staffId : null;
      const storeId = req.query.storeId ? req.query.storeId : null;
      var searchQuery = {};

      if (fromDate) {
        searchQuery = { ...searchQuery, createdAt: { [Op.lte]: fromDate } };
      }
      if (toDate) {
        searchQuery = { ...searchQuery, createdAt: { [Op.gte]: toDate } };
      }
      var staffInfo = null;
      if (staffId) {
        staffInfo = await Staff.findOne({ where: { id: staffId }, raw: true });
        searchQuery = { ...searchQuery, staffId: staffId };
      }
      if (storeId) {
        const staffs = await Staff.findAll({
          where: { storeId: storeId },
          raw: true,
        });
        console.log(staffs)
        const staffIds = staffs ? staffs.map((el) => el.id) : [];
        searchQuery = { ...searchQuery, staffId: { [Op.in]: staffIds } };
      }

      const totalAmount = await Order.findAll({
        where: { ...searchQuery, status: orderStatus.DONE },
        attributes: [[sequelize.fn("sum", sequelize.col("totalPay")), "total"]],
        raw: true,
      });
      const countDoneOrder = await Order.findAll({
        where: { ...searchQuery, status: orderStatus.DONE },
        attributes: [[sequelize.fn("count", sequelize.col("id")), "total"]],
        raw: true,
      });
      const countRejectOrder = await Order.findAll({
        where: { ...searchQuery, status: orderStatus.DENIED },
        attributes: [[sequelize.fn("count", sequelize.col("id")), "total"]],
        raw: true,
      });
      const countCancelOrder = await Order.findAll({
        where: { ...searchQuery, status: orderStatus.CANCEL },
        attributes: [[sequelize.fn("count", sequelize.col("id")), "total"]],
        raw: true,
      });
      const countSysCancelOrder = await Order.findAll({
        where: { ...searchQuery, status: orderStatus.SYSTEMCANCEL },
        attributes: [[sequelize.fn("count", sequelize.col("id")), "total"]],
        raw: true,
      });

      if (status) {
        searchQuery = {
          ...searchQuery,
          status: {
            [Op.in]: status,
          },
        };
      }
      const data = await Order.paginate({
        page: page, // Default 1
        paginate: perPage, // Default 25
        order: [["updatedAt", "DESC"]],
        include: [
          {
            model: User,
            as: "userCustomer",
            attributes: ["id", "name", "urlImage", "phone"],
          },
          {
            model: Staff,
            as: "staff",
            attributes: ["id", "name"],
            include: [
              {
                model: User,
                as: "user",
                attributes: ["id", "urlImage", "phone"],
              },
              {
                model: Store,
                as: "store",
                attributes: ["id", "name", "imageUrl", "phone", "address"],
              },
            ],
          },
          { model: Payment, as: "payment", attributes: ["id", "name"] },
          {
            model: Store,
            as: "store",
            attributes: ["id", "name", "imageUrl", "phone", "address"],
          },
          {
            model: Voucher,
            as: "voucher",
            attributes: ["id", "name", "name", "code", "type", "value"],
          },
          {
            model: ServiceBooking,
            as: "booking",
            attributes: [
              "id",
              "unit",
              "price",
              "amount",
              "serviceName",
              "imageUrl",
            ],
          },
          {
            model: User,
            as: "handleBy",
            attributes: ["id", "name", "urlImage", "phone"],
          },
        ],
        where: searchQuery,
      });
      data.totalMoney =
        totalAmount && totalAmount[0] ? totalAmount[0].total : 0;
      data.totalOrderDone =
        countDoneOrder && countDoneOrder[0] ? countDoneOrder[0].total : 0;
      data.totalOrderReject =
        countRejectOrder && countRejectOrder[0] ? countRejectOrder[0].total : 0;
      data.totalOrderCancel =
        countCancelOrder && countCancelOrder[0] ? countCancelOrder[0].total : 0;
      data.totalOrderSysCancel =
        countSysCancelOrder && countSysCancelOrder[0]
          ? countSysCancelOrder[0].total
          : 0;
      data.staff = staffInfo;
      data.currentPage = page;
      return res.status(200).json(data);
    } catch (error) {
      console.log(error);
      next(error);
    }
  };
  cancelMyOrder = async (req, res, next) => {
    const user = req.user;
    const roleCode = await user.roleCode;
    if (roleCode != customerRoleCode) {
      return res
        .status(403)
        .json({ message: "Chức năng chỉ dành cho khách hàng" });
    }
    const data = req.body;
    if (!data.id) {
      return res.status(403).json({ message: "ID đơn hàng không tồn tại" });
    }
    const order = await Order.findOne({ where: { id: data.id } });
    if (!order) {
      return res.status(403).json({ message: "Đơn hàng không tồn tại" });
    }
    const statusCancel = order.status;
    if (
      order.status != orderStatus.PENDING &&
      order.status != orderStatus.APPROVED
    ) {
      return res.status(500).json({ message: "Không thể hủy đơn này" });
    }
    if (
      order.status == orderStatus.DENIED ||
      order.status == orderStatus.CANCEL ||
      order.status == orderStatus.SYSTEMCANCEL
    ) {
      return res.status(500).json({ message: "Đơn đã được hủy" });
    }
    const t = await sequelize.transaction();
    try {
      const timeData = this.handleTimeOrder(
        order.timeData,
        "cancel_order",
        "Hủy đơn hàng",
        Date.now()
      );
      await order.update(
        {
          status: orderStatus.CANCEL,
          reasonCancel: data.reasonCancel ? data.reasonCancel : null,
          timeData: timeData,
          handleByUser: user.id,
        },
        { transaction: t }
      );
      const staff = await Staff.findOne({ where: { id: order.staffId } });
      await staff.update({ busy: false }, { transaction: t });
      if (order.paymentMethodId != 1 && order.is_paid) {
        const refun = await this.refunWallet(
          user.id,
          roleCode,
          order.totalPay,
          statusCancel,
          order.code,
          order.id
        );
        if (refun == "ERROR") {
          await t.rollback();
          return res.status(500).json({ message: "Không thể hoàn tiên" });
        }
      }
      if (order.paymentMethodId == 1 && statusCancel != orderStatus.PENDING) {
        const currentMoney = user.totalMoney;
        await user.update(
          {
            totalMoney:
              Number(currentMoney).toFixed(0) - Number(feeRefun * order.totalPay).toFixed(0),
          },
          { transaction: t }
        );
        const transaction = await Transaction.create(
          {
            code: this.genateCode(),
            forUserId: user.id,
            content: "Giao dịch trừ tiền do hủy đơn hàng " + order.code,
            orderId: order.id,
            money: Number(feeRefun * order.totalPay).toFixed(0),
            totalMoney:
              Number(currentMoney).toFixed(0) - Number(feeRefun * order.totalPay).toFixed(0),
            userCreate: user.id,
            success: true,
            add: false
          },
          { transaction: t }
        );
        await mobileNotification(
          "CUSTOMER",
          user.id,
          `Bạn bị trừ 20% giá trị đơn hàng ${order.code} khỏi ví Glow`,
          { orderId: order.id }
        );
        await Notification.create({
          toUserId: user.id,
          content: `Bạn bị trừ 20% giá trị đơn hàng ${order.code} khỏi ví Glow`,
          referenceId: order.id,
        }, { transaction: t });

      }

      const owner = await Owner.findOne({ where: { storeId: staff.storeId } });
      if (statusCancel != orderStatus.PENDING) {
        const userOwner = await User.findOne({ where: { id: owner.userId } });
        const currentMoney = userOwner.totalMoney;
        await userOwner.update({
          totalMoney: Number(currentMoney) + Number(feeRefun * order.totalPay),
        });
        const transaction = await Transaction.create({
          code: this.genateCode(),
          forUserId: userOwner.id,
          content: "Giao dịch cộng tiền do khách hàng hủy đơn " + order.code + " khi đã được xác nhận",
          orderId: order.id,
          money: Number(feeRefun * order.totalPay),
          totalMoney: Number(currentMoney) + Number(feeRefun * order.totalPay),
          userCreate: userOwner.id,
          success: true,
        }, { transaction: t });
        await mobileNotification(
          "PARTNER",
          userOwner.id,
          `Bạn được cộng 20% giá trị đơn hàng ${order.code} vào ví Glow`,
          { orderId: order.id }
        );
      }
      await mobileNotification(
        "PARTNER",
        [staff.userId, owner.id],
        `Khách hàng đã hủy đơn hàng`,
        { orderId: order.id, code: order.code }
      );
      await this.sendSlack(order, `HỦY BỞI KHÁCH HÀNG`);
      await t.commit();
      await this.createNotification(
        staff.userId,
        `Khách hàng đã hủy đơn hàng của bạn`,
        order.id
      );
      return res.status(200).json({ message: "Thành công" });
    } catch (error) {
      console.log(error);
      await t.rollback();
      next(error);
    }
  };
  approveOrder = async (req, res, next) => {
    const user = req.user;
    const roleCode = await user.roleCode;
    if (roleCode == customerRoleCode) {
      return res.status(403).json({ message: "Không có quyền này" });
    }
    try {
      const data = req.body;
      if (!data.id) {
        return res.status(403).json({ message: "ID đơn hàng không tồn tại" });
      }
      const order = await Order.findOne({ where: { id: data.id } });
      if (!order) {
        return res.status(403).json({ message: "Đơn hàng không tồn tại" });
      }
      if (order.status != orderStatus.PENDING) {
        return res.status(500).json({ message: "Không thể duyệt đơn này" });
      }
      const timeData = this.handleTimeOrder(
        order.timeData,
        "approve_order",
        "Kỹ thuật viên đang di chuyển",
        Date.now()
      );
      await order.update({
        status: orderStatus.APPROVED,
        handleByUser: user.id,
        timeData: timeData,
      });
      await this.createNotification(
        order.customerUserId,
        `Đơn hàng của bạn đã được duyệt`,
        order.id
      );
      await mobileNotification(
        "CUSTOMER",
        order.customerUserId,
        `Đơn hàng của bạn đã được duyệt`,
        { orderId: order.id }
      );
      return res.status(200).json({ message: "Thành công" });
    } catch (error) {
      console.log(error);
      next(error);
    }
  };
  doOrder = async (req, res, next) => {
    const user = req.user;
    const roleCode = await user.roleCode;
    if (roleCode == customerRoleCode) {
      return res.status(403).json({ message: "Không có quyền này" });
    }

    try {
      const data = req.body;
      if (!data.id) {
        return res.status(403).json({ message: "ID đơn hàng không tồn tại" });
      }
      const order = await Order.findOne({ where: { id: data.id } });
      if (!order) {
        return res.status(403).json({ message: "Đơn hàng không tồn tại" });
      }
      if (order.status != orderStatus.APPROVED) {
        return res.status(500).json({
          message: "Đơn hàng phải trong trạng thái được duyệt được duyệt",
        });
      }
      const timeData = this.handleTimeOrder(
        order.timeData,
        "do_order",
        "Kỹ thuật viên bắt đầu thực hiện",
        Date.now()
      );
      await order.update({
        status: orderStatus.DOING,
        handleByUser: user.id,
        timeData: timeData,
      });
      await this.createNotification(
        order.customerUserId,
        `Dịch vụ của bạn đang được thực hiện`,
        order.id
      );
      await mobileNotification(
        "CUSTOMER",
        order.customerUserId,
        `Dịch vụ của bạn đang được thực hiện`,
        { orderId: order.id }
      );
      return res.status(200).json({ message: "Thành công" });
    } catch (error) {
      console.log(error);
      next(error);
    }
  };
  rejectOrder = async (req, res, next) => {
    const user = req.user;
    const roleCode = await user.roleCode;
    if (roleCode == customerRoleCode || roleCode == staffRoleCode) {
      return res.status(403).json({ message: "Không có quyền này" });
    }
    const data = req.body;
    if (!data.id) {
      return res.status(403).json({ message: "ID đơn hàng không tồn tại" });
    }
    const order = await Order.findOne({ where: { id: data.id } });
    if (!order) {
      return res.status(403).json({ message: "Đơn hàng không tồn tại" });
    }
    if (order.status == orderStatus.CANCEL) {
      return res.status(500).json({ message: "Không thể hủy đơn này" });
    }
    if (
      order.status == orderStatus.DENIED ||
      order.status == orderStatus.CANCEL ||
      order.status == orderStatus.SYSTEMCANCEL
    ) {
      return res.status(500).json({ message: "Đơn đã được hủy" });
    }
    const t = await sequelize.transaction();
    try {
      const timeData = this.handleTimeOrder(
        order.timeData,
        "reject_order",
        "Đơn hàng bị hủy",
        Date.now()
      );
      const statusCancel = order.status;
      await order.update(
        {
          status: orderStatus.DENIED,
          handleByUser: user.id,
          reasonCancel: data.reasonCancel ? data.reasonCancel : null,
          timeData: timeData,
        },
        { transaction: t }
      );
      const staff = await Staff.findOne({ where: { id: order.staffId } });
      await staff.update({ busy: false }, { transaction: t });
      if (order.paymentMethodId != 1 && order.is_paid) {
        const refun = await this.refunWallet(
          order.customerUserId,
          roleCode,
          order.totalPay,
          statusCancel,
          order.code,
          order.id);
        if (refun == "ERROR") {
          await t.rollback();
          return res.status(500).json({ message: "Lỗi hoàn tiền" });
        }
      }
      if (roleCode == ownerRoleCode && statusCancel != orderStatus.PENDING) {
        const currentMoney = user.totalMoney;
        await user.update({
          totalMoney: Number(currentMoney).toFixed(0) - Number(feeRefun * order.totalPay).toFixed(0),
        }, { transaction: t });
        await Transaction.create({
          code: this.genateCode(),
          forUserId: user.id,
          content: "Giao dịch trừ tiền do hủy đơn hàng " + order.code + " khi đã được xác nhận",
          orderId: order.id,
          money: Number(feeRefun * order.totalPay).toFixed(0),
          totalMoney: Number(currentMoney).toFixed(0) - Number(feeRefun * order.totalPay).toFixed(0),
          userCreate: user.id,
          add: false,
          success: true,
        }, { transaction: t });

      }
      await t.commit();
      if (roleCode == ownerRoleCode && statusCancel != orderStatus.PENDING) {
        await mobileNotification(
          "PARTNER",
          user.id,
          `Bạn bị trừ 20% giá trị đơn hàng ${order.code} khỏi ví Glow`,
          { orderId: order.id }
        );
        await this.createNotification(
          user.id,
          `Bạn bị trừ 20% giá trị đơn hàng ${order.code} khỏi ví Glow`,
          order.id
        );
      }
      const store = await Store.findOne({ where: { id: staff.storeId } });
      await mobileNotification(
        "CUSTOMER",
        order.customerUserId,
        `${store.name ? store.name : 'Cửa hàng'} đã từ chối cung cấp dịch vụ`,
        { orderId: order.id }
      );
      await this.createNotification(
        order.customerUserId,
        `${store.name ? store.name : 'Cửa hàng'} đã từ chối cung cấp dịch vụ`,
        order.id
      );
      await this.sendSlack(order, `HỦY BỞI: ${user.name}`);
      return res.status(200).json({ message: "Thành công" });
    } catch (error) {
      await t.rollback();
      console.log(error);
      next(error);
    }
  };
  finishOrder = async (req, res, next) => {
    const user = req.user;
    const roleCode = await user.roleCode;
    if (roleCode == customerRoleCode) {
      return res.status(403).json({ message: "Không có quyền này" });
    }
    const t = await sequelize.transaction();
    try {
      const data = req.body;
      if (!data.id) {
        return res.status(403).json({ message: "ID đơn hàng không tồn tại" });
      }
      const order = await Order.findOne({ where: { id: data.id } });
      if (!order) {
        return res.status(403).json({ message: "Đơn hàng không tồn tại" });
      }
      if (order.status == orderStatus.PENDING) {
        return res
          .status(500)
          .json({ message: "Đơn chưa được duyệt! Vui lòng duyệt đơn trước" });
      }
      if (order.status == orderStatus.APPROVED) {
        return res.status(500).json({ message: "Vui lòng thực hiện dịch vụ trước" });
      }
      if (order.status != orderStatus.DOING) {
        return res
          .status(500)
          .json({ message: "Không thể hoàn thành đơn ở trạng thái này" });
      }
      const timeData = this.handleTimeOrder(
        order.timeData,
        "finish_order",
        "Dịch vụ đã hoàn thành",
        Date.now()
      );
      await order.update({
        status: orderStatus.DONE,
        handleByUser: user.id,
        is_paid: true,
        timeData: timeData,
      }, { transaction: t });
      const staff = await Staff.findOne({ where: { id: order.staffId } });
      await staff.update({ busy: false });

      const owner = await Owner.findOne({ where: { storeId: staff.storeId } });
      const userOwner = owner ? await User.findOne({ where: { id: owner.userId } }) : null;
      if (userOwner) {
        const currentMoney = userOwner.totalMoney;
        await userOwner.update({
          totalMoney: Number(currentMoney) + parseInt(Number((order.totalPay) * 85 / 100)),
        }, { transaction: t });
        await Transaction.create({
          code: this.genateCode(),
          forUserId: userOwner.id,
          content: "Giao dịch cộng tiền do hoàn thành đơn " + order.code,
          orderId: order.id,
          money: Number((order.totalPay) * 85 / 100).toFixed(0),
          totalMoney: Number(currentMoney) + parseInt(Number((order.totalPay) * 85 / 100)),
          userCreate: userOwner.id,
          success: true,
        }, { transaction: t });
      }
      await t.commit();
      if(userOwner){
        await mobileNotification(
          "PARTNER",
          userOwner.id,
          `Bạn được cộng 85% giá trị đơn hàng ${order.code} vào ví Glow`,
          { orderId: order.id }
        );
      }
      await mobileNotification(
        "CUSTOMER",
        order.customerUserId,
        `Dịch vụ của bạn đã hoàn thành`,
        { orderId: order.id }
      );
      await this.createNotification(
        order.customerUserId,
        `Dịch vụ của bạn đã hoàn thành. Vui lòng đánh giá nhân viên của chúng tôi`,
        order.id
      );
      return res.status(200).json({ message: "Thành công" });
    } catch (error) {
      console.log(error);
      await t.rollback();
      next(error);
    }
  };
  genateCode = () => {
    const string = crypto.randomBytes(8).toString("hex");
    return string.toUpperCase();
  };
  reviewMyOrder = async (req, res, next) => {
    const user = req.user;
    const roleCode = await user.roleCode;
    if (roleCode != customerRoleCode) {
      return res.status(403).json({ message: "Không có quyền này" });
    }

    try {
      const data = req.body;
      if (!data.orderId) {
        return res.status(403).json({ message: "ID đơn hàng không tồn tại" });
      }
      const order = await Order.findOne({ where: { id: data.orderId } });
      if (!order) {
        return res.status(403).json({ message: "Đơn hàng không tồn tại" });
      }
      if (order.status != orderStatus.DONE) {
        return res
          .status(500)
          .json({ message: "Dịch vụ chưa hoàn thành! Không thể đánh giá" });
      }
      if (!data.review || !data.note) {
        return res
          .status(403)
          .json({ message: "Đánh giá không được bỏ trống" });
      }
      if (!Number.isInteger(data.review)) {
        return res
          .status(403)
          .json({ message: "Review trong khoảng từ 1 đến 5" });
      }
      const staff = await Staff.findOne({ where: { id: order.staffId } });
      await order.update({
        rateReview: data.review,
        noteReview: data.note,
      });
      await this.createNotification(
        staff.userId,
        `${user.name ? user.name : "Khách hàng"} đã đánh giá dịch vụ của bạn ${data.review
        } sao`,
        order.id
      );
      return res.status(200).json({ message: "Thành công" });
    } catch (error) {
      console.log(error);
      next(error);
    }
  };
  feedbackOrder = async (req, res, next) => {
    const user = req.user;
    try {
      var staff = await Staff.findOne({ where: { userId: user.id } });
      var owner = await Owner.findOne({ where: { userId: user.id } });
      if (!staff && !owner) {
        return res.status(403).json({ message: "Người dùng không tồn tại" });
      }
      var staffs = [];
      if (owner) {
        staffs = await Staff.findAll({ where: { storeId: owner.storeId } });
        staffs = staffs ? staffs.map(el => el.id) : [];
      }
      const data = req.body;
      if (!data.orderId) {
        return res.status(403).json({ message: "ID đơn hàng không tồn tại" });
      }
      const order = await Order.findOne({ where: { id: data.orderId } });
      if (!order) {
        return res.status(403).json({ message: "Đơn hàng không tồn tại" });
      }
      if (order.status !== orderStatus.DONE) {
        return res
          .status(500)
          .json({ message: "Dịch vụ chưa hoàn thành! Không thể đánh giá" });
      }
      if (!data.review || !data.note) {
        return res
          .status(403)
          .json({ message: "Đánh giá không được bỏ trống" });
      }
      if (!Number.isInteger(data.review)) {
        return res
          .status(403)
          .json({ message: "Feedback trong khoảng từ 1 đến 5" });
      }
      if (staff && order.staffId != staff.id) {
        return res.status(403).json({ message: "Đơn hàng không phải của bạn" });
      }
      if (owner && !staffs.includes(order.staffId)) {
        return res.status(403).json({ message: "Đơn hàng không thuộc quản lý của bạn" });
      }
      order.update({
        rateFeedback: data.review,
        noteFeedback: data.note,
      });
      return res.status(200).json({ message: "Thành công" });
    } catch (error) {
      console.log(error);
      next(error);
    }
  };
  getDetailOrder = async (req, res, next) => {
    try {
      const user = req.user;
      const orderId = req.params.id;
      if (!orderId) {
        return res.status(403).json({ message: "ID đơn hàng không tồn tại" });
      }
      const order = await Order.findOne({
        where: { id: orderId },
        include: [
          {
            model: User,
            as: "userCustomer",
            attributes: ["id", "name", "urlImage", "phone"],
          },
          {
            model: Staff,
            as: "staff",
            attributes: ["id", "name"],
            include: [
              {
                model: User,
                as: "user",
                attributes: ["id", "urlImage", "phone"],
              },
              {
                model: Store,
                as: "store",
                attributes: ["id", "name", "imageUrl", "phone", "address"],
              },
            ],
          },
          { model: Payment, as: "payment", attributes: ["id", "name"] },
          {
            model: Store,
            as: "store",
            attributes: [
              "id",
              "name",
              "imageUrl",
              "phone",
              "lat",
              "long",
              "address",
            ],
          },
          { model: Voucher, as: "voucher" },
          {
            model: ServiceBooking,
            as: "booking",
            attributes: [
              "id",
              "unit",
              "price",
              "amount",
              "serviceName",
              "imageUrl",
            ],
          },
          {
            model: User,
            as: "handleBy",
            attributes: ["id", "name", "urlImage", "phone"],
          },
        ],
      });
      if (!order) {
        return res.status(403).json({ message: "Đơn hàng không tồn tại" });
      }
      const roleCode = await user.roleCode;
      if (roleCode == customerRoleCode && user.id != order.customerUserId) {
        return res.status(403).json({ message: "Đơn hàng không phải của bạn" });
      }
      if (roleCode == ownerRoleCode) {
        const owner = await Owner.findOne({
          where: { userId: user.id },
        });
        var staffIds = await Staff.findAll({
          where: { storeId: owner.storeId },
          raw: true,
          nest: true,
        });
        staffIds = staffIds ? staffIds.map((el) => el.id) : [];
        if (!staffIds.includes(order.staffId)) {
          return res
            .status(403)
            .json({ message: "Đơn hàng không thuộc nhân viên của bạn" });
        }
      }
      return res.status(200).json(order);
    } catch (error) {
      console.log(error);
      next(error);
    }
  };
  createNotification = async (toUserId, content, orderId) => {
    try {
      const order = await Order.findOne({ where: { id: orderId }, raw: true });
      if (order) {
        await Notification.create({
          toUserId: toUserId,
          content: content,
          referenceId: orderId,
        });
        this.sendSocketOrder(toUserId, order);
        const staff = await Staff.findOne({ where: { id: order.staffId } });
        var owner = null;
        if (staff) {
          this.sendSocketOrder(staff.userId, order);
          owner = await Owner.findOne({
            where: { storeId: staff.storeId }
          });
        }
        if (owner) {
          this.sendSocketOrder(owner.userId, order);
        }
      }
      return "DONE";

    } catch (error) {
      console.log(error, 'OrderId: ' + orderId);
      return "ERROR";
    }
  };

  pushNotification = async (req, res, next) => {
    let a = await mobileNotification("CUSTOMER", 53, "test");
    console.log(a);
    return res.status(400).json({ message: "Test Onesignal" });
  };
  sendSocketOrder = (userId, data) => {
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
        users.forEach(user => {
          if (user.socketId) {
            _io.to(`${user.socketId}`).emit("order-data", data);
            console.log(`Da gui socket den ${userId}`);
          }
        });
      }
      return "DONE";
    } catch (error) {
      console.log(error);
      return "ERROR";
    }
  };

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
      return "ERROR";
      // return res.status(error.response.status).json(error.response.data);
    }
  };

  paymentSuccess = async (req, res, next) => {
    try {
      const rawData = req.rawBody.toString("utf8");
      const signValid = new BaoKimAPI().checkSignData(rawData);
      if (!signValid) {
        return res.status(500).json({ message: "Webhook Chữ ký không hợp lệ" });
      }
      const data = req.body;
      const orderPaymen = data.order;
      var dataOrder = myCache.get(orderPaymen.mrc_order_id);
      const myOrder = dataOrder.data;
      const prices = dataOrder.prices;
      if (
        signValid &&
        myOrder.code == orderPaymen.mrc_order_id &&
        orderPaymen.stat == "c" &&
        orderPaymen.total_amount == myOrder.totalPay
      ) {
        myOrder.is_paid = true;
        const order = await Order.create(myOrder);
        await this.addBookingOrder(order, prices);
        myCache.del(orderPaymen.mrc_order_id);
        this.sendSocketPayOnline(myOrder.customerUserId, order);
        if (dataOrder.voucherId && order.discount > 0) {
          const voucher = await Voucher.findOne({
            where: { id: dataOrder.voucherId },
          });
          const used = voucher ? Number(voucher.used) + 1 : null;
          if (used) {
            await voucher.update({ used: used });
          }
        }
        const staff = await Staff.findOne({ where: { id: order.staffId } });
        await mobileNotification(
          "PARTNER",
          staff.userId,
          `Bạn có một đơn hàng mới`,
          { orderId: order.id }
        );
        var owner = null;
        if (staff) {
          owner = await Owner.findOne({
            where: { storeId: staff.storeId },
          });

          if (owner) {
            const userOwner = await User.findOne({ where: { id: owner.userId } })
            callPhone(userOwner.phone, 'Bạn có đơn hàng mới, vui lòng xác nhận', next)
            await mobileNotification(
              "PARTNER",
              owner.userId,
              `Bạn có một đơn hàng mới`,
              { orderId: order.id }
            );
          }
        }
        this.jobCancelOrder(order.id, next);
        await staff.update({ busy: true });
        await this.sendSlack(order);
      }
      return res.status(200).json({ err_code: "0", message: "Thành công" });
    } catch (error) {
      console.log(error);
      next(error);
    }
  };
  countFee = (lat1, lon1, lat2, lon2) => {
    try {
      if (lat1 && lon1 && lat2 && lon2) {
        var distance = this.calDistance(lat1, lon1, lat2, lon2);
        distance = Math.ceil(distance / 1000);
        const fee = distance > 1 ? distance * 10000 : 0;
        return fee;
      }
      return 0;
    } catch (error) {
      return 0;
    }
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
  sendSocketPayOnline = (userId, data) => {
    //Xoa socketID trung lap
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
        _io.to(`${user.socketId}`).emit("payment-online", data);
        console.log(`Da gui socket den ${userId}`);
      }
    }
  };

  sendSlack = async (order = null, status = "ĐƯỢC TẠO") => {
    try {
      const url = SLACK_URL.ORDER;
      const webhook = new IncomingWebhook(url);
      const staff = await Staff.findOne({ where: { id: order.staffId } });
      const customer = await User.findOne({
        where: { id: order.customerUserId },
      });
      const store = order.storeId
        ? await Store.findOne({ where: { id: order.storeId } })
        : null;
      const payment = await Payment.findOne({
        where: { id: order.paymentMethodId },
      });
      const data = {
        text: "Đơn hàng mới",
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `@here Đơn hàng ID*${order.id} -  Mã đơn: ${order.code} - Tổng thanh toán: ${order.totalPay} đ - ${status}`,
            },
          },
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `- Khách hàng ID*${customer.id}: Tên/ SĐT: ${customer.name
                ? customer.name + " - " + customer.phone
                : customer.phone
                }`,
            },
          },
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `- Kỹ thuật viên ID*${staff.id}: Họ tên: ${staff.name}`,
            },
          },
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `- Vị trí: ${store ? "Tại cửa hàng: " : "Tại nhà"} ${store ? store.name : order.address
                }`,
            },
          },
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `- Thanh toán: ${payment.name}`,
            },
          },
        ],
      };

      await webhook.send(data);
      return "DONE";
    } catch (error) {
      console.log(error);
      return "ERROR";
    }
  };

  handleTimeOrder = (dataTime, key = "", name = "", value = "") => {
    try {
      var data = dataTime ? JSON.parse(dataTime) : [];
      data.push({ key, name, value });
      return JSON.stringify(data);
    } catch (error) {
      return dataTime;
    }
  };
  refunWallet = async (
    userId,
    userRole,
    totalPay,
    status,
    orderCode = "",
    orderId = null
  ) => {
    var take = 0;
    var takeOwner = false;
    if (userRole == adminRoleCode) {
      take = 1;
    }
    if (userRole == ownerRoleCode && status == orderStatus.PENDING) {
      take = 1;
    }
    if (userRole == ownerRoleCode && status != orderStatus.PENDING) {
      take = 1 + feeRefun;
    }
    if (userRole == customerRoleCode && status == orderStatus.PENDING) {
      take = 1;
    }
    if (userRole == customerRoleCode && status != orderStatus.PENDING) {
      take = 1 - feeRefun;
    }
    try {
      const user = await User.findOne({ where: { id: userId } });
      const currentMoney = user.totalMoney;
      await user.update({
        totalMoney: Number(currentMoney) + Number(take * totalPay),
      });
      const transaction = await Transaction.create({
        code: this.genateCode(),
        forUserId: user.id,
        content: "Giao dịch hoàn tiền cho đơn hàng " + orderCode,
        orderId: orderId,
        money: Number(take * totalPay),
        totalMoney: Number(currentMoney) + Number(take * totalPay),
        userCreate: user.id,
        success: true,
      });

      return "DONE";
    } catch (error) {
      console.log(error);
      return "ERROR";
    }
  };
  jobCancelOrder = (orderId, next) => {
    try {
      const delayTime = 120000; //2 phút
      var job = queue
        .create("updateOrder", { orderId: orderId })
        .delay(delayTime)
        .save(function (error) {
          if (!error) console.log(job.id);
          else console.log(error);
        });
      queue.process("updateOrder", 100, async (job, done) => {
        const t = await sequelize.transaction();
        try {
          const order = await Order.findOne({
            where: { id: job.data.orderId },
          });

          if (order.status == orderStatus.PENDING) {
            const timeData = this.handleTimeOrder(
              order.timeData,
              "system_cancel_order",
              "Đơn hàng bị hủy bởi hệ thống",
              Date.now()
            );

            await order.update(
              {
                status: orderStatus.SYSTEMCANCEL,
                timeData: timeData,
                reasonCancel: "Hệ thống hủy vì quá thời gian",
              },
              { transaction: t }
            );
            const staff = await Staff.findOne({ where: { id: order.staffId } });
            await staff.update({ busy: false }, { transaction: t });
            if (order.paymentMethodId != 1 && order.is_paid) {
              const refun = await this.refunWallet(
                order.customerUserId,
                adminRoleCode,
                order.totalPay,
                orderStatus.PENDING,
                order.code,
                order.id
              );
              if (refun == "ERROR") {
                await t.rollback();
                return res.status(500).json({ message: "Không thể hoàn tiên" });
              }
              await mobileNotification(
                "CUSTOMER",
                order.customerUserId,
                `Bạn đã được hoàn tiền cho đơn hàng ${order.code}`,
                { orderId: order.id }
              );
            }
            await mobileNotification(
              "CUSTOMER",
              order.customerUserId,
              `Đơn hàng của bạn bị hủy tự động`,
              { orderId: order.id }
            );
            await this.sendSlack(
              order,
              `Đã hủy tự động bởi hệ thống do quá 2 phút không được xác nhận`
            );
            await this.createNotification(
              order.customerUserId,
              `Đơn hàng của bạn đã bị hủy tự động bởi hệ thống`,
              order.id
            );
          }
          await t.commit();
          done();
        } catch (error) {
          await t.rollback();
          done();
          next(error);
        }
      });

      queue.on("job complete", function (id, result) {
        kue.Job.get(id, function (err, job) {
          if (err) return;
          job.remove(function (err) {
            if (err) next(err);
            console.log("removed completed job #%d", job.id);
          });
        });
      });
    } catch (error) {
      console.log(error);
      next(error);
      return "ERROR";
    }
  };
}

module.exports = new OrderController();
