const CUSTOMER_ONESIGNAL_APP_ID = "cfa703dd-e94e-447b-87bf-098660109dd2";
const CUSTOMER_ONESIGNAL_REST_API_KEY =
    "ZTFiMTI4ZWItNWM1MC00YzRjLTkxMzQtNzNlNjhkZjQ4ZTk0";

const PARTNER_ONESIGNAL_APP_ID = "4e3e2806-9e6f-4751-8bf9-c5b3e2d916c5";
const PARTNER_ONESIGNAL_REST_API_KEY =
    "MTQxZDYxYmYtMDkxOC00MzU3LTgxZmItN2EwNjI1ZjJiZWU2";

const PARTNER_ANDROID_APP_ID = 'c6d8481a-a325-4d46-ba8f-e01bd04672e9'; //develop
// const PARTNER_ANDROID_APP_ID = '89eef0c3-02d4-4509-a27a-809e35c4ba17'; //Production

const OneSignal = require("@onesignal/node-onesignal");

const mobileNotification = async (APP_NAME, userIDs, content, data = null) => {
    try {
        var ONESIGNAL_APP_ID = "";
        var ONESIGNAL_REST_API_KEY;
        if (APP_NAME == "PARTNER") {
            ONESIGNAL_APP_ID = PARTNER_ONESIGNAL_APP_ID;
            ONESIGNAL_REST_API_KEY = PARTNER_ONESIGNAL_REST_API_KEY;
        } else if (APP_NAME == "CUSTOMER") {
            ONESIGNAL_APP_ID = CUSTOMER_ONESIGNAL_APP_ID;
            ONESIGNAL_REST_API_KEY = CUSTOMER_ONESIGNAL_REST_API_KEY;
        } else {
            console.log("app is PARTNER or CUSTOMER");
            return 'ERROR'
        }

        const app_key_provider = {
            getToken() {
                return ONESIGNAL_REST_API_KEY;
            },
        };

        const configuration = OneSignal.createConfiguration({
            authMethods: {
                app_key: {
                    tokenProvider: app_key_provider,
                },
            },
        });
        var include_external_user_ids = [];
        if (Array.isArray(userIDs)) {
            include_external_user_ids = userIDs.map((el) => String(el));
        } else {
            include_external_user_ids.push(String(userIDs));
        }
        const client = new OneSignal.DefaultApi(configuration);
        const notification = new OneSignal.Notification();
        notification.app_id = ONESIGNAL_APP_ID;
        notification.include_external_user_ids = include_external_user_ids;
        notification.data = data
        notification.ios_sound = "custom_sound.wav"
        notification.contents = {
            en: content,
        };
        if(APP_NAME == "PARTNER"){
            notification.android_channel_id = PARTNER_ANDROID_APP_ID
        }

        const  res  = await client.createNotification(notification);
        console.log(res)
        return res.id ? "DONE" : "ERROR";

    } catch (error) {
        console.log(error);
        return "ERROR";
    }
};



module.exports = mobileNotification
