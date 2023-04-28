
const Voucher = require("../models").Voucher;
const Store = require("../models").Store;
const Owner = require("../models").Owner;
const { Op } = require("sequelize");
const ownerRoleCode = require("../constants/roles").ownerRoleCode
const customerRoleCode = require("../constants/roles").customerRoleCode
const adminRoleCode = require("../constants/roles").adminRoleCode

class VoucherController {
    getListVoucher = async (req, res, next) => {
        const page = req.query.page ? req.query.page : 1;
        const perPage = req.query.perPage ? req.query.perPage : 10;
        const search = req.query.search ? req.query.search : null;
        const active = req.query.active ? req.query.active : null;
        const type = req.query.type ? req.query.type : null;
        const storeId = req.query.storeId ? req.query.storeId : null;
        var searchQuery = {};
        if (search) {
            searchQuery = { ...searchQuery, name: { [Op.iLike]: `%${search}%` } }
        }

        if (active) {
            searchQuery = { ...searchQuery, active: active }
        }
        if (type) {
            searchQuery = { ...searchQuery, type: type }
        }
        if (storeId) {
            searchQuery = { ...searchQuery, storeId: storeId }
        }
        const data = await Voucher.paginate({
            where: searchQuery,
            page: page, // Default 1
            paginate: perPage, // Default 25
            order: [["updatedAt", "DESC"]],
            include: [
                { model: Store, as: "store" },
            ],
        });

        data.currentPage = page;
        return res.status(200).json(data);
    };
    createVoucher = async (req, res, next) => {
        const user = req.user;
        const data = req.body;
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
        try {
            if (!data.name) {
                return res.status(403).json({ message: "Tên không được bỏ trống" });
            }
            if (!data.code) {
                return res.status(403).json({ message: "Mã giảm giá không được bỏ trống" });
            }
            if (!data.type) {
                return res.status(403).json({ message: "Loại không được bỏ trống" });
            }
            if (!data.quantity) {
                return res.status(403).json({ message: "Số lượng không được bỏ trống" });
            }
            if (!data.value) {
                return res.status(403).json({ message: "Giá trị không được bỏ trống" });
            }
            const checkCode = await Voucher.findOne({ where: { code: data.code } });
            if (checkCode) {
                return res.status(403).json({ message: "Mã giảm giá đã tồn tại", code: 403 });
            }
            Voucher.create({
                name: data.name,
                code: data.code,
                type: data.type,
                quantity: data.quantity,
                storeId: storeId ? storeId : data.storeId,
                value: data.value,
                startTime: data.startTime,
                endTime: data.endTime,
                minValueOrder: data.minValueOrder,
                maxReduce: data.maxReduce,
            });
            return res.status(200).json({ message: "Thêm mới thành công" });
        } catch (error) {
            console.log(error)
            next(error)
        }
    };
    updateVoucher = async (req, res, next) => {
        const data = req.body;
        const user = req.user;
        const roleCode = await user.roleCode;
        if (roleCode == customerRoleCode || roleCode == staffRoleCode) {
            return res.status(403).json({
                message: "Chức năng chỉ dành cho chủ cơ sở và quản trị viên",
            });
        }
        if (!data.id) {
            return res.status(403).json({ message: "Voucher không tồn tại" });
        }
        var storeId = null;
        if (roleCode == ownerRoleCode) {
            var owner = await Owner.findOne({ where: { userId: user.id } });
            storeId = owner.storeId
        }
        try {
            await Voucher.update(
                {
                    name: data.name,
                    type: data.type,
                    quantity: data.quantity,
                    storeId: storeId ? storeId : data.storeId,
                    value: data.value,
                    startTime: data.startTime,
                    endTime: data.endTime,
                    minValueOrder: data.minValueOrder,
                    maxReduce: data.maxReduce,
                },
                { where: { id: data.id } }
            );
            return res.status(200).json({ message: 'Cập nhật thành công' });
        } catch (error) {
            console.log(error)
            next(error)
        }

    };
    activeDeactive = async (req, res, next) => {
        const data = req.body;
        const user = req.user;
        const roleCode = await user.roleCode;
        if (roleCode == customerRoleCode || roleCode == staffRoleCode) {
            return res.status(403).json({
                message: "Chức năng chỉ dành cho chủ cơ sở và quản trị viên",
            });
        }
        if (!data.id) {
            res.status(422).json({ message: "Cơ sở không tồn tại" });
        }
        try {
            const voucher = await Voucher.findOne({ where: { id: data.id } });
            if (!voucher) {
                res.status(422).json({ message: "Voucher không tồn tại" });
            }
            if (roleCode == ownerRoleCode) {
                var owner = await Owner.findOne({ where: { userId: user.id } });
                if (owner.storeId != voucher.storeId) {
                    return res.status(403).json({
                        message: "Voucher không thuộc cơ sở của bạn",
                    });
                }
            }

            if (voucher.active) {
                voucher.update({
                    active: false
                })
            } else {
                voucher.update({
                    active: true
                })
            }
            return res.status(200).json({ message: 'Thành công' });
        } catch (error) {
            console.log(error)
            next(error)
        }
    }
}

module.exports = new VoucherController();
