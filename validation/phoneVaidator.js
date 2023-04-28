const e = require("express");
const { body, check } = require("express-validator");

const userValidator = {
    phoneCreate: () => {
        return [
            body("phone", "Số điện thoại không tồn tại")
            .exists()
            .custom(value => {
              if (!value) {
                throw new Error("Số điện thoại không tồn tại");
              }
              const phoneFormat = [value];
              if(value[0] == '+'){
                phoneFormat.push(value.slice(1));
              }
              if(value[0] == '0'){
                phoneFormat.push(`${value.slice(1)}84`);
                phoneFormat.push(`${value.slice(1)}+84`);
              }
              console.log(phoneFormat)
              return new Promise((resolve, reject) => {
                User.findOne({ where: { phone: value } }).then(res => {
                  if (Boolean(res)) {
                    reject(new Error("Số điện thoại đã được sử dụng"));
                  }
                  resolve(true);
                });
              });
            }),
          
        ];
    },
    phoneUpdate: () => {
        return [
            body("name", "Tên người dùng không tồn tại").not().isEmpty(),
            body("userName", "Tên không tồn tại").not().isEmpty(),
            body("email", "Email không tồn tại").exists().not().isEmpty(),
        ];
    }
};

module.exports = userValidator;
