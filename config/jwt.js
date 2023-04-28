const JWT_CONFIG = {
    SECRET_KEY: 'vn9yKihIiW5ER3cWWgCCmVYUbX2W7JMKLdWcVxFZr-_EfeIiQleT47eloSeNJjXILn14_7cvY_qwvpJSnidWHmQ',
    AccessTokenTime: 3600 * 4, //Thời gian của access token tính bằng giây 
    RefreshTokenTime: 3600 * 72 //Thời gian sống của refresh token trong 72 giờ
  }
  
  module.exports = JWT_CONFIG