
const axios = require('axios');
var https = require('https');
class GeocodingController {
    getDataSearch = async (req, res, next) => {
        const search = req.query.search
        try {
            const respon = await axios.get('https://map.coccoc.com/map/search.json', {
                params: {
                    query: search,
                    suggestions: true
                }
            })
            return res.status(200).json(respon.data.result.poi);
        } catch (error) {
            console.log(error);
            return res.status(200).json([]);
        }
    }
    geoCodingReverse = async (req, res, next) => {
        const lat = req.query.lat
        const lng = req.query.lng
        const httpsAgent = new https.Agent({
            rejectUnauthorized: false,
          });
        try {
            const respon = await axios.get(`https://pccc.sful.vn/geocoding/geocoding/reverse?lat=${lat}&lng=${lng}`,{ httpsAgent })
            return res.status(200).json(respon.data);
        } catch (error) {
            console.log(error);
            return res.status(200).json([]);
        }
    }
}

module.exports = new GeocodingController()
