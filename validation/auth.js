const User = require("../models").User;
const jwt = require("jsonwebtoken");
const JWT_CONFiG = require("../config/jwt");

const Auth = {
  auth: async (req, res, next) => {
    try {
      const token = req.header("Authorization").replace("Bearer", "").trim();
      const decodeJwt = jwt.verify(token, JWT_CONFiG.SECRET_KEY);
      const user = await User.findOne({where: {id: decodeJwt.user_id}});
      const tokenList = JSON.parse(user.tokens);
      if (!tokenList) {
        throw new Error();
      }
      let checkUseToken = tokenList.find(el => el == token);
      req.user = user;
      if (!checkUseToken) {
        throw new Error();
      } else {
        req.user = user;
        next();
      }
    } catch (error) {
      error.message = "Vui lòng đăng nhập để sử dụng phần mềm";
      var nameError = '';
      if (error.name == "TokenExpiredError") {
        nameError = "TokenExpiredError";
        await Auth.removeExpiredToken(req, res);
      }
      error.code = 403
      return res.status(403).json({message: error.message, code: error.code, name: nameError});
    }
  },
  removeExpiredToken: async (req, res) => {
    try {
      const token = req.header("Authorization").replace("Bearer", "").trim();
      const decodeJwt = jwt.verify(token, JWT_CONFiG.SECRET_KEY, {ignoreExpiration: true});
      const user = await User.findOne({where: {id: decodeJwt.user_id}});
      const tokenList = JSON.parse(user.tokens);
      let indexToken = tokenList.findIndex(el => el === token);
      if (indexToken != -1) {
        tokenList.splice(indexToken, 1);
        await user.update({
          tokens: JSON.stringify(tokenList),
        });
        return {message: 'done'};
      }
      return {message: "Token không tồn tại"};
    } catch (error) {
      console.log(error)
      return {message: "Không thể xóa token"};
    }
  },
};
module.exports = Auth;
