const cron = require('cron');
const Staff = require("../models").Staff;
const Order = require("../models").Order;
const { Op } = require("sequelize");
const { sequelize } = require("../models");
const SLACK_URL = require("./slack");
const { IncomingWebhook } = require('@slack/webhook');


function replaceErrors(key, value) {
  if (value instanceof Error) {
    var error = {};

    Object.getOwnPropertyNames(value).forEach(function (propName) {
      error[propName] = value[propName];
    });

    return error;
  }

  return value;
}

const sendSlack = async (dataErrors, urlAPI = '', user = '') => {
  try {
    const url = SLACK_URL.ERROR;
    const webhook = new IncomingWebhook(url);
    const message = JSON.parse(dataErrors).message ? JSON.parse(dataErrors).message : '';
    const allError = dataErrors.length > 3000 ? dataErrors.substr(0, 2999) : dataErrors;
    const data = {
      text: 'Lỗi API',
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `@here API: ${urlAPI ? urlAPI : 'Không xác định'}`,
          },
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `@USER: ${user ? user : 'Ẩn danh'}`,
          },
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `@MESSAGE: ${message}`,
          },
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `@ALL: ${allError}`,
          },
        }
      ]
    };

    await webhook.send(data)
    return 'DONE';
  } catch (error) {
    console.log(error);
    return 'ERROR';
  }

}

const updateRateStaff = async () => {
  try {
    const staffs = await Staff.findAll({
      raw: true, nest: true, attributes: [
        "name",
        "id"]
    })
    for (const item of staffs) {
      const totalReview = await Order.findAll({
        where: { staffId: item.id, rateReview: { [Op.ne]: null } },
        attributes: [
          [sequelize.fn("sum", sequelize.col("rateReview")), "total"],
        ],
        raw: true,
      });
      const countReview = await Order.findAll({
        where: { staffId: item.id, rateReview: { [Op.ne]: null } },
        attributes: [[sequelize.fn("count", sequelize.col("id")), "total"]],
        raw: true,
      });
      const avgReview =
        Number(countReview[0].total) != 0
          ? Number(
            Number(totalReview[0].total) / Number(countReview[0].total)
          )
          : 0;
      await Staff.update({ rateAvg: avgReview.toFixed(1), countReview: countReview[0].total }, { where: { id: item.id } })
    }
    await sendSlack('{}', 'UPDATE STAFF BY CRON JOB SUCCESS', '')
    return 'DONE'
  } catch (err) {
    if (!('toJSON' in Error.prototype))
      Object.defineProperty(Error.prototype, 'toJSON', {
        value: function () {
          var alt = {};
          Object.getOwnPropertyNames(this).forEach(function (key) {
            alt[key] = this[key];
          }, this);

          return alt;
        },
        configurable: true,
        writable: true
      })
    const url = `UPDATE CRON JOB STAFF ERROR`;
    const user = '';
    const dataErrors = JSON.stringify(err, replaceErrors)
    await sendSlack(dataErrors, url, user)
    return 'ERROR'
  }


}

const job = new cron.CronJob({
  cronTime: '00 30 23 * * 0-6', // Chạy Jobs vào 23h30 hằng đêm
  onTick: async () => {
    await updateRateStaff()
    console.log('Cron jub runing...');
  },
  start: true,
  timeZone: 'Asia/Ho_Chi_Minh'
});

module.exports = job

// job.start();