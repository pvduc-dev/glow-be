
const Province = require("../models").Province;
const District = require("../models").District;
const Commune = require("../models").Commune;

const { Op } = require("sequelize");

class RegionController {
    getProvince = async (req, res, next) => {
        try {
            const page = req.query.page ? req.query.page : 1;
            const perPage = req.query.perPage ? req.query.perPage : 10;
            const search = req.query.search ? req.query.search : null;
            var searchQuery = {};
            if (search) {
                searchQuery = { ...searchQuery, name: { [Op.iLike]: `%${search}%` } }
            }
            const data = await Province.paginate({
                where: searchQuery,
                page: page, // Default 1
                paginate: perPage, // Default 25
                order: [["updatedAt", "DESC"]],
                attributes: ['id', 'name', 'code', 'type', 'centerPoint', 'rank']
            });
            data.currentPage = page;
            return res.status(200).json(data);
        } catch (error) {
            console.log(error)
            next(error)
        }
    }

    getDistrict = async (req, res, next) => {
        try {
            const page = req.query.page ? req.query.page : 1;
            const perPage = req.query.perPage ? req.query.perPage : 10;
            const search = req.query.search ? req.query.search : null;
            const provinceId = req.query.provinceId ? req.query.provinceId : null;
            var searchQuery = {};
            if (search) {
                searchQuery = { ...searchQuery, name: { [Op.iLike]: `%${search}%` } }
            }
            if (provinceId) {
                searchQuery = { ...searchQuery, provinceId: provinceId }
            }
            const data = await District.paginate({
                where: searchQuery,
                page: page, // Default 1
                paginate: perPage, // Default 25
                order: [["updatedAt", "DESC"]],
                attributes: ['id', 'name', 'code', 'type', 'centerPoint', 'rank', 'provinceId']
            });
            data.currentPage = page;
            return res.status(200).json(data);
        } catch (error) {
            console.log(error)
            next(error)
        }
    }

    getCommune = async (req, res, next) => {
        try {
            const page = req.query.page ? req.query.page : 1;
            const perPage = req.query.perPage ? req.query.perPage : 10;
            const search = req.query.search ? req.query.search : null;
            const districtId = req.query.districtId ? req.query.districtId : null;
            var searchQuery = {};
            if (search) {
                searchQuery = { ...searchQuery, name: { [Op.iLike]: `%${search}%` } }
            }
            if (districtId) {
                searchQuery = { ...searchQuery, districtId: districtId }
            }
            const data = await Commune.paginate({
                where: searchQuery,
                page: page, // Default 1
                paginate: perPage, // Default 25
                order: [["updatedAt", "DESC"]],
                attributes: ['id', 'name', 'code', 'type', 'centerPoint', 'rank', "districtId"]
            });
            data.currentPage = page;
            return res.status(200).json(data);
        } catch (error) {
            console.log(error)
            next(error)
        }
    }

}
module.exports = new RegionController();
