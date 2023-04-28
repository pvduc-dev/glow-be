const e = require("express");
const {body, check} = require("express-validator");

const userValidator = {
  updatePeople: () => {
    return [
      body("id", "Đối tượng không tồn tại").not().isEmpty(),
      body("name", "Tên không tồn tại").not().isEmpty(),
      body("userName", "Tên đăng nhập không tồn tại").not().isEmpty(),
      body("email", "Email không tồn tại").exists().not().isEmpty(),
    ];
  },
  createPeople: () => {
    return [
      body("name", "Tên người dùng không tồn tại").not().isEmpty(),
      body("userName", "Tên không tồn tại").not().isEmpty(),
      body("email", "Email không tồn tại").exists().not().isEmpty(),
    ];
  }
};

module.exports = userValidator;
