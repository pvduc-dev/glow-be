// Mỗi khi có đơn mới thì gọi đến owner ạ. Ngoài notification ra mình gọi cho chắc cú :D

const apiKeySid = "SK.0.bTXneg0m2Ro0bhpEmnDq2lkaYPNugRh6"; // cần cho vào file .env ạ
const apiKeySecret = "ZEVZOGxUVmh2WTZ1bTlsa2xyMnd0UUpTSVRleHh4U0k="; // cần cho vào file .env ạ
const fromNumber = "842873000329";
var token = getAccessToken();

function getAccessToken() {
  var now = Math.floor(Date.now() / 1000);
  var exp = now + 3600;

  var header = { cty: "stringee-api;v=1" };
  var payload = {
    jti: apiKeySid + "-" + now,
    iss: apiKeySid,
    exp: exp,
    rest_api: true,
  };

  var jwt = require("jsonwebtoken");
  var token = jwt.sign(payload, apiKeySecret, {
    algorithm: "HS256",
    header: header,
  });
  return token;
}

const handlePhone = (phone) => {
  let phoneFormat;
  if (phone[0] == '+') {
    phoneFormat = phone.slice(1);
  } else if (phone[0] == '0') {
    phoneFormat = `84${phone.slice(1)}`;
  } else if (phone[0] == '8' && phone[1] == '4') {
    phoneFormat = phone
  }
  return phoneFormat
}
var axios = require("axios");

const callPhone = async (phone, content, next) => {
  const toPhone = handlePhone(phone);
  var data = JSON.stringify({
    from: { type: "external", number: fromNumber, alias: fromNumber }, // from number 842873000329 cần cho vào file .env ạ
    to: [{ type: "external", number: toPhone, alias: toPhone }], // Điền số đt vào đây ạ
    answer_url: "https://apidev.orderdi.com/hook",
    actions: [{ action: "talk", text: content }],
  });
  var config = {
    method: "post",
    url: "https://api.stringee.com/v1/call2/callout",
    headers: {
      "X-STRINGEE-AUTH": token,
      "Content-Type": "application/json",
      Cookie: "SRVNAME=SA",
    },
    data: data,
  };
  try {
    const response = await axios(config);
    console.log(JSON.stringify(response.data));
    return "DONE";
  } catch (error) {
    console.log("Có error rồi, bắn vế slack thôi");
    // next(error);
    console.log(error)
    return "ERROR";
  }
};
module.exports = callPhone
