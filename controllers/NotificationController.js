
const Order = require("../models").Order;
const Staff = require("../models").Staff;
const Owner = require("../models").Owner;
const Notification = require("../models").Notification;
const { Op } = require("sequelize");

class NotificationController {
    getMyNotification = async (req, res, next) => {
        try {
            const page = req.query.page ? req.query.page : 1;
            const perPage = req.query.perPage ? req.query.perPage : 10;
            const user = req.user;
            const countNew = await Notification.count({ where: { toUserId: user.id, seen: false, active: true } });
            const owner = await Owner.findOne({ where: { userId: user.id } });
            var searchQuery = { toUserId: user.id, active: true };
            if (owner) {
                var staffUserIds = await Staff.findAll({ where: { storeId: owner.storeId } });
                staffUserIds = staffUserIds ? staffUserIds.map(el => el.userId) : [];
                staffUserIds.push(user.id)
                searchQuery = { toUserId: { [Op.in]: staffUserIds }}
            }
            const data = await Notification.paginate({
                where: searchQuery,
                page: page, // Default 1
                paginate: perPage, // Default 25
                order: [["updatedAt", "DESC"]],
                include: [
                    { model: Order, as: "order" },
                ],
            });
            data.currentPage = page;
            data.countNew = countNew;
            return res.status(200).json(data);
        } catch (error) {
            console.log(error)
            next(error)
        }

    }
    readNotification = async (req, res, next) => {
        try {
            const user = req.user;
            const data = req.body;
            const owner = await Owner.findOne({ where: { userId: user.id } });
            var staffUserIds = null;
            if (owner) {
                staffUserIds = await Staff.findAll({ where: { storeId: owner.storeId } });
                staffUserIds = staffUserIds ? staffUserIds.map(el => el.userId) : [];
            }
            if (!data.id) {
                return res.status(403).json({ message: "ID thông báo không tồn tại" });
            }
            const notifi = await Notification.findOne({ where: { id: data.id } });
            if (!notifi) {
                return res.status(403).json({ message: "Thông báo không tồn tại" });
            }
            if (notifi.toUserId != user.id && !owner) {
                return res.status(403).json({ message: "Thông báo này không gửi cho bạn" });
            }
            if (owner && staffUserIds && !staffUserIds.includes(notifi.toUserId)) {
                return res.status(403).json({ message: "Thông báo này không phải cho nhân viên của bạn" });
            }
            await notifi.update({
                seen: true,
                seenAt: new Date()
            });
            return res.status(200).json({ message: "Thành công" });
        } catch (error) {
            console.log(error)
            next(error)
        }
    }
}

module.exports = new NotificationController();
