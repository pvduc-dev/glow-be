
const Payment = require("../models").Payment;
const adminRoleCode = require("../constants/roles").adminRoleCode
const BaoKimAPI = require("../config/baoKim");
const baoKimUrl = new BaoKimAPI().getUrl();
const baoKimVersion = new BaoKimAPI().getVersion();
const { Op } = require("sequelize");
var https = require('https');
const axios = require('axios');
var crypto = require('crypto');

class PaymentController {
    createPaymentMethod = async (req, res, next) => {

        try {
            const user = req.user;
            const roleCode = await user.roleCode;
            const data = req.body;
            if (roleCode != adminRoleCode) {
                return res.status(403).json({ message: "Không có quyền thực hiện" });
            }
            if (!data.name) {
                return res.status(403).json({ message: "Tên không được bỏ trống" });
            }
            const checkName = await Payment.findOne({ where: { name: data.name } });
            if (checkName) {
                return res.status(403).json({ message: "Tên phương thức đã tồn tại", code: 403 });
            }
            Payment.create({
                name: data.name,
                code: data.code ? data.code : null,
            });
            return res.status(200).json({ message: "Thêm mới thành công" });
        } catch (error) {
            console.log(error)
            next(error)
        }
    };
    getPaymentMethod = async (req, res, next) => {
        try {
            let data = await Payment.findAll({ attributes: ['id', 'name', 'code', 'logoUrl'], where: {code: {[Op.ne]: 'online'}}, raw: true, nest: true });
            data = data.map(el => ({...el,bpmId: null}));
            const bankMethods = await this.getBankPaymentMethod()
            data.push(...bankMethods);
            return res.status(200).json(data);
        } catch (error) {
            console.log(error)
            next(error)
        }

    }
    getBankPaymentMethod = async () => {
        try {
            const token = new BaoKimAPI().getToken();
            const httpsAgent = new https.Agent({
                rejectUnauthorized: false,
            });
            var config = {
                method: 'get',
                url: `${baoKimUrl}api/${baoKimVersion}/bpm/list`,
                headers: {
                    'jwt': 'Bearer ' + token,
                    'Content-Type': 'application/json'
                },
                httpsAgent
            };
            const respon = await axios(config);
            const types = [2, 17, 18, 19];
            let atms = respon.data.data.filter(el => el.type == 1);
            atms = atms.map(el => ({
                id: 2,
                bpmId: el.id,
                code: 'online',
                name: el.name,
                bankName: el.bank_name,
                shortBankName: el.bank_short_name,
                logoUrl: el.bank_logo
            }))
            let data = respon.data.data.filter(el => types.includes(el.type))
            data = data.map(el => ({
                id: 2,
                bpmId: el.id,
                code: 'online',
                name: el.name,
                bankName: el.bank_name,
                shortBankName: el.bank_short_name,
                logoUrl: el.bank_logo
            }))
            data.push({
                id: 2,
                code: 'online',
                name: 'Thanh toán qua thẻ ATM',
                logoUrl: "https://spa-storage-image.s3.amazonaws.com/spa-images/84801149-c115-42bf-bef4-accd53fa0efc.png",
                list: atms
            })
            return data;
        } catch (error) {
            console.log(error)
            next(error)
            return [];
        }

    }
}

module.exports = new PaymentController();
