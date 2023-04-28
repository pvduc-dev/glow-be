const User = require("../models").User;
const Owner = require("../models").Owner;
const Role = require("../models").Role;
const Store = require("../models").Store;
var bcrypt = require("bcryptjs");
const { validationResult } = require("express-validator");
const { sequelize } = require("../models");
const defaultPassword = "12345678";
const Op = require("sequelize").Op;
const ownerRoleCode = require("../constants/roles").ownerRoleCode
const adminRoleCode = require("../constants/roles").adminRoleCode

class OwnerController {
    getListOwner = async (req, res, next) => {
        const user = req.user;
        const roleCode = await user.roleCode;
        if (roleCode !== adminRoleCode) {
            return res.status(403).json({
                message: "Chức năng chỉ dành cho quản trị viên",
            });
        }
        const page = req.query.page ? req.query.page : 1;
        const perPage = req.query.perPage ? req.query.perPage : 10;
        const search = req.query.search ? req.query.search : null;
        const active = req.query.active ? req.query.active : null;
        const storeIds = req.query.storeIds ? req.query.storeIds : null;
        var searchQuery = {};
        if (search) {
            searchQuery = { ...searchQuery, name: { [Op.iLike]: `%${search}%` } }
        }

        if (active) {
            searchQuery = { ...searchQuery, active: active }
        }
        if (storeIds && storeIds.length) {
            searchQuery = {
                ...searchQuery,
                storeId: {
                    [Op.in]: storeIds
                }
            }
        }
        const data = await Owner.paginate({
            where: searchQuery,
            page: page, // Default 1
            paginate: perPage, // Default 25
            order: [["updatedAt", "DESC"]],
            include: [{ model: Store, as: "store", attributes: ['id', 'name', 'code', 'phone', 'email', 'address'] }, {
                model: User, as: "user",
                attributes: ['id', 'name', 'userName', 'phone', 'email', 'urlImage', 'totalMoney']
            }],
        });

        data.currentPage = page;
        return res.status(200).json(data);
    };

    addOwner = async (req, res, next) => {
        const user = req.user;
        const roleCode = await user.roleCode;
        if (roleCode !== adminRoleCode) {
            return res.status(403).json({
                message: "Chức năng chỉ dành cho quản trị viên",
            });
        }
        const t = await sequelize.transaction();
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(422).json({ message: "Dữ liệu không hợp lệ!", errors: errors.array() });
            }
            const data = req.body;
            const checkUserName = await User.findOne({ where: { userName: data.userName } });
            const checkEmail = await User.findOne({ where: { email: data.email } });
            const checkPhone = await User.findOne({ where: { phone: data.phone } });
            if (checkPhone) {
                return res.status(403).json({ message: "Số điện thoại đã tồn tại", code: 403 });
            }
            if (checkUserName) {
                return res.status(403).json({ message: "Tên đăng nhập đã tồn tại", code: 403 });
            }
            if (checkEmail) {
                return res.status(403).json({ message: "Email đã tồn tại", code: 403 });
            }
            const passHashed = bcrypt.hashSync(defaultPassword, 10);
            const ownerRole = await Role.findOne({ where: { code: ownerRoleCode } })
            if (data.storeId) {
                const ownerStore = await Owner.findOne({ where: { storeId: data.storeId } });
                if (ownerStore) {
                    return res.status(403).json({ message: "Cửa hàng này đã có chủ", code: 403 });
                }
            }
            const user = await User.create({
                name: data.name,
                userName: data.userName,
                email: data.email,
                password: passHashed,
                urlImage: data.urlImage,
                roleId: ownerRole.id,
                phone: data.phone,
            }, { transaction: t });
            await Owner.create({
                name: data.name,
                address: data.address,
                birthDay: data.birthDay,
                indetifyNumber: data.indetifyNumber,
                placeIssue: data.placeIssue,
                dateIssue: data.dateIssue,
                phoneFamily: data.phoneFamily,
                gender: data.gender,
                userId: user.id,
                storeId: data.storeId,
                description: data.description
            }, { transaction: t })
            await t.commit();
            return res.status(200).json({ message: "Thêm mới thành công" });
        } catch (error) {
            await t.rollback();
            console.log(error)
            next(error)
        }

    }

    updateOwner = async (req, res, next) => {
        const user = req.user;
        const roleCode = await user.roleCode;
        if (roleCode !== adminRoleCode) {
            return res.status(403).json({
                message: "Chức năng chỉ dành cho quản trị viên",
            });
        }

        const t = await sequelize.transaction();
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(422).json({ message: "Dữ liệu không hợp lệ!", errors: errors.array() });
        }
        const data = req.body;
        try {
            const owwner = await Owner.findOne({ where: { id: data.id } });
            const userId = owwner.userId;
            const checkUserName = await User.findOne({ where: { userName: data.userName, id: { [Op.not]: userId } } });
            const checkEmail = await User.findOne({ where: { email: data.email, id: { [Op.not]: userId } } });
            const checkPhone = await User.findOne({ where: { phone: data.phone, id: { [Op.not]: userId } } });
            if (checkPhone) {
                return res.status(403).json({ message: "Số điện thoại đã tồn tại" });
            }
            if (checkUserName) {
                return res.status(403).json({ message: "Tên đăng nhập đã tồn tại" });
            }
            if (checkEmail) {
                return res.status(403).json({ message: "Email đã tồn tại" });
            }

            const user = await User.findOne({ where: { id: userId } });
            if (data.storeId) {
                const ownerStore = await Owner.findOne({ where: { storeId: data.storeId, id: { [Op.not]: data.id } } });
                if (ownerStore) {
                    return res.status(403).json({ message: "Cửa hàng này đã có chủ", code: 403 });
                }
            }

            await user.update({
                name: data.name,
                userName: data.userName,
                email: data.email,
                urlImage: data.urlImage,
                phone: data.phone,
            }, { transaction: t });
            await owwner.update({
                name: data.name,
                address: data.address,
                birthDay: data.birthDay,
                indetifyNumber: data.indetifyNumber,
                placeIssue: data.placeIssue,
                dateIssue: data.dateIssue,
                phoneFamily: data.phoneFamily,
                gender: data.gender,
                storeId: data.storeId,
                description: data.description
            }, { transaction: t })
            await t.commit();
            return res.status(200).json({ message: "Cập nhật thành công" });
        } catch (error) {
            await t.rollback();
            console.log(error)
            next(error)
        }
    }

    activeDeactive = async (req, res, next) => {
        const data = req.body;
        if (!data.id) {
            return res.status(422).json({ message: "ID không tồn tại" });
        }
        const user = req.user;
        const roleCode = await user.roleCode;
        if (roleCode !== adminRoleCode) {
            return res.status(403).json({
                message: "Chức năng chỉ dành cho quản trị viên",
            });
        }
        const t = await sequelize.transaction();
        try {
            const owner = await Owner.findOne({ where: { id: data.id } });
            if (!owner) {
                return res.status(422).json({ message: "Chủ cơ sở không tồn tại" });
            }
            const user = await User.findOne({ where: { id: owner.userId } })
            if (owner.active) {
                await owner.update({
                    active: false
                }, { transaction: t })
                await user.update({
                    active: false
                }, { transaction: t })
            } else {
                await owner.update({
                    active: true
                }, { transaction: t })
                await user.update({
                    active: true
                }, { transaction: t })
            }
            await t.commit();
            return res.status(200).json({ message: 'Thành công' });
        } catch (error) {
            await t.rollback();
            console.log(error)
            next(error)
        }
    }

    getDetailOwner = async (req, res, next) => {
        const ownerId = req.params.id;
        const user = req.user;
        const roleCode = await user.roleCode;
        if (roleCode !== adminRoleCode) {
            return res.status(403).json({
                message: "Chức năng chỉ dành cho quản trị viên",
            });
        }
        try {
            const owner = await Owner.findOne({
                where: { id: ownerId },
                include: [{
                    model: Store, as: "store",
                    attributes: ['id', 'name', 'code', 'phone', 'email', 'address']
                },
                {
                    model: User, as: "user",
                    attributes: ['id', 'name', 'userName', 'phone', 'email', 'urlImage']
                }],
            });
            return res.status(200).json(owner);
        } catch (error) {
            console.log(error)
            next(error)
        }
    }
    getStoreNoOwner = async (req, res, next) => {
        try {
            // const user = req.user;
            // const roleCode = await user.roleCode;
            // if (roleCode !== adminRoleCode) {
            //     return res.status(403).json({
            //         message: "Chức năng chỉ dành cho quản trị viên",
            //     });
            // }
            const page = req.query.page ? req.query.page : 1;
            const perPage = req.query.perPage ? req.query.perPage : 10;
            const owners = await Owner.findAll({ where: { storeId: { [Op.ne]: null } } });
            const storeIds = owners ? owners.map(el => el.storeId) : [];
            const stores = await Store.paginate({
                where: { active: true, id: { [Op.notIn]: storeIds } },
                page: page, // Default 1
                paginate: perPage, // Default 25
            });
            stores.currentPage = page;
            return res.status(200).json(stores);
        } catch (error) {
            console.log(error)
            next(error)
        }
    }
}

module.exports = new OwnerController();
