
const jwt = require("jsonwebtoken");
var crypto = require('crypto');
class BaoKimAPI {
    constructor() {
        this.API_KEY = 'a18ff78e7a9e44f38de372e093d87ca1';
        this.API_SECRET = '9623ac03057e433f95d86cf4f3bef5cc';
        this.BaoKimEndPoint = 'https://dev-api.baokim.vn/payment/';
        this.TOKEN_EXPIRE = 60;
        this._jwt = null;
        this.version = 'v5'
    }
    refreshToken() {
        this._jwt = jwt.sign({ iss: this.API_KEY }, this.API_SECRET, { expiresIn: this.TOKEN_EXPIRE });
        return this._jwt
    }
    getToken() {
        if (!this._jwt) {
            this.refreshToken()
        }
        try {
            jwt.verify(this._jwt, this.API_SECRET);
        } catch (error) {
            this.refreshToken()
        }
        return this._jwt
    }
    getUrl() {
        return this.BaoKimEndPoint
    }
    getVersion() {
        return this.version
    }

    checkSignData(rawData = '') {
        const webhookData = JSON.parse(rawData);
        const baokimSign = webhookData.sign;
        var mySign = crypto.createHmac('sha256', this.API_SECRET).update(rawData.replace(`,"sign":"${baokimSign}"`, ''), 'utf8').digest('hex');
        if (baokimSign == mySign) {
            return true;
        }
        return false;
    }

}
module.exports = BaoKimAPI