const User = require("../models").User;
const Role = require("../models").Role;
const Store = require("../models").Store;
const Order = require("../models").Order;

class ReportController {

    getApiSystemReport = async(req, res, next) => {
        try {
            const roles = await Role.findAll({raw: true,attributes: ["id", "name"],});
            const allUser = await User.count();
            const activeUser = await User.count({where: {active: true}});
            for(const role of roles){
                role.count = await User.count({where: {roleId: role.id, active: true}}) + ' tài khoản hoạt động';
            }
            const storeActive = await Store.count({where: {active: true}});
            const store = await Store.count();
            const order = await Order.count();
            const data = {
                'SoCuaHang': store,
                'SoCuaHangHoatDong': storeActive,
                'SoDonHang': order,
                'SoNguoiDung': allUser,
                'SoNguoiDungHoatDong': activeUser,
                'ChiTietNguoiDung': roles
            }
            return res.status(200).json(data);
        } catch (error) {
            console.log(error);
            next(error); 
        }
    }
}
module.exports = new ReportController();