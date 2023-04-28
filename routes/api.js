var express = require("express");
var router = express.Router();
const UserController = require("../controllers").UserController;
const StoreController = require("../controllers").StoreController;
const RoleController = require("../controllers").RoleController;
const AuthController = require("../controllers").AuthController;
const UserValidator = require("../validation/userValidator");
const PeopleValidator = require("../validation/peopleValidator");
const OwnerController = require("../controllers").OwnerController;
const ServiceController = require('../controllers').ServiceController;
const StaffController = require('../controllers').StaffController;
const RegionController = require('../controllers').RegionController;
const CustomerController = require('../controllers').CustomerController;
const MobileCustomerController = require('../controllers').MobileCustomerController;
const VoucherController = require('../controllers').VoucherController;
const AwsServiceController = require('../controllers').AwsServiceController;
const GeocodingController = require('../controllers').GeocodingController;
const PaymentController = require('../controllers').PaymentController;
const OrderController = require('../controllers').OrderController;
const NotificationController = require('../controllers').NotificationController;
const WalletController = require('../controllers').WalletController;
const ToolController = require('../controllers').ToolController;
const ReportController = require('../controllers').ReportController;

const Tool = require("../validation/tools");
const Auth = require("../validation/auth");
const handleImage = require('../utils/uploadImage')



router.post("/upload-single-image", Auth.auth, handleImage.upload.single('image'), (req, res) => {
  const path = req.file.path.replace('public', '')
  return res.status(200).json({ ...req.file, path });
});
router.post("/upload-multiple-image", Auth.auth, handleImage.upload.array('images', 100), (req, res) => {
  var images = req.files;
  images = images.map(el => {
    const path = el.path.split('/').slice(1).join('/')
    return { ...el, path }
  })
  return res.status(200).json(images);
});
router.delete("/remove-image/:id", Auth.auth, ServiceController.removeImage);

router.post("/aws-upload-single-image", handleImage.uploadAws.single('image'), AwsServiceController.uploadImage);
router.post("/aws-upload-multiple-image", handleImage.uploadAws.array('images', 100), AwsServiceController.uploadMultipleImage);

/* Auth Router. */
router.post("/login", UserValidator.login(), AuthController.login);
router.post("/mobile-login", UserValidator.login(), AuthController.loginMobile);
router.post("/staff-mobile-login", UserValidator.login(), AuthController.loginMobileStaff);
router.post("/signup",Tool.blackWords, AuthController.signUp);
router.post("/refresh", AuthController.refreshToken);
router.get("/logout", Auth.auth, AuthController.logout);
router.get("/logout-all", Auth.auth, AuthController.logoutAllDevice);
router.get("/me", Auth.auth, AuthController.me);
router.post("/update-myuser", Auth.auth, AuthController.updateMyUser);
router.get("/roles", Auth.auth, RoleController.getAllRole);


/* User Router. */
router.post("/change-password", Auth.auth, UserValidator.changePassword(), UserController.changePassword);
router.get("/users", Auth.auth, UserController.userList);
router.post("/active-user", Auth.auth, UserController.activeUser);
router.post("/upload-avatar", handleImage.uploadAws.single('avatar'), UserController.uploadAvatar);
router.post("/update-user", UserValidator.updateUser(), Auth.auth, UserController.updateUser);
router.post("/create-user", UserValidator.createUser(), Auth.auth, UserController.createUser);


/* Store Router. */
router.post("/store",Tool.blackWords, Auth.auth, StoreController.createStore);
router.put("/store",Tool.blackWords, Auth.auth, StoreController.updateStore);
router.get("/store", StoreController.getListStore);
router.put("/adstore", Auth.auth, StoreController.activeDeactive);
router.get("/admin-store", Auth.auth, StoreController.getListStoreAdmin);
router.get("/store/:id", Auth.auth, StoreController.getDetailStore);

/* Owner Router. */
router.post("/owner", Auth.auth, PeopleValidator.createPeople(), OwnerController.addOwner);
router.put("/owner", Auth.auth, PeopleValidator.createPeople(), OwnerController.updateOwner);
router.get("/owner", Auth.auth, OwnerController.getListOwner);
router.put("/adowner", Auth.auth, OwnerController.activeDeactive);
router.get("/owner/:id", Auth.auth, OwnerController.getDetailOwner);
router.post("/add-price-staff-service", Auth.auth, StaffController.addStaffServicePrice);
router.get("/price-staff-service", StaffController.getPriceServiceStaff);
router.delete("/remove-staff-service/:id",Auth.auth, StaffController.removeStaffPrice);
router.put("/update-staff-price", StaffController.updateStaffServicePrice);
router.get("/owner-store", OwnerController.getStoreNoOwner);

/* Service Router. */
router.post("/service", Auth.auth, ServiceController.createService);
router.get("/service/:id", ServiceController.getDetailService);
router.get("/service", ServiceController.getListService);
router.put("/service", Auth.auth, ServiceController.updateService);
router.put("/adservice", Auth.auth, ServiceController.activeDeactive);
router.put("/statusservice", Auth.auth, ServiceController.handleStatus);


/* Staff Router. */
router.post("/staff",Tool.blackWords, Auth.auth, PeopleValidator.createPeople(), StaffController.createStaff);
router.put("/staff",Tool.blackWords, Auth.auth, PeopleValidator.createPeople(), StaffController.updateStaff);
router.get("/staff", StaffController.getListStaff);
router.get("/staff/:id", StaffController.getDetailStaff);
router.put("/adstaff", Auth.auth, StaffController.activeDeactive);
router.get('/staff-near-here', StaffController.getStaffWithDistance)
router.get("/review-staff", StaffController.getReviewStaff);
router.get("/staff-web/:id", StaffController.getDetailStaffWeb);
router.get("/staff-new-service", StaffController.getNewServiceStaff);
router.put("/staff-status",Auth.auth, StaffController.onOffStaff);

/* Region Router. */
router.get("/province", RegionController.getProvince);
router.get("/district", RegionController.getDistrict);
router.get("/commune", RegionController.getCommune);


/* Customer Router. */
router.get("/customer", Auth.auth, CustomerController.getListCustomer);
router.put("/customer",Tool.blackWords, Auth.auth, CustomerController.updateCustomer);
router.get("/customer/:id", Auth.auth, CustomerController.getDetailCustomer);
router.get("/address-customer/:id", Auth.auth, CustomerController.getCustomerAddress);
router.put("/default-address-customer/:id", Auth.auth, CustomerController.setDefaultAddress);
router.delete("/remove-address-customer/:id", Auth.auth, CustomerController.removeAddress);
router.post("/add-address-customer",Tool.blackWords, Auth.auth, PeopleValidator.createPeople(), CustomerController.addCustomerAddress);
router.put("/adcustomer", Auth.auth, CustomerController.activeDeactive);
router.post("/verify-phone", AuthController.verifyPhoneNumber);
router.get("/search-address", GeocodingController.getDataSearch);
router.get("/geocoding-reverse", GeocodingController.geoCodingReverse);



/* Mobile customer Router. */
router.get("/customer-myprofile", Auth.auth, MobileCustomerController.getProfileCustomer);
router.get("/customer-myaddress", Auth.auth, MobileCustomerController.getCustomerAddress);
router.put("/default-myaddress/:id", Auth.auth, MobileCustomerController.setDefaultAddress);
router.delete("/remove-myaddress/:id", Auth.auth, MobileCustomerController.removeAddress);
router.post("/add-myaddress", Auth.auth, MobileCustomerController.addCustomerAddress);
router.put("/update-myprofile", Auth.auth, MobileCustomerController.updateMobileProfile);
router.put("/update-myaddress", Auth.auth, MobileCustomerController.updateCustomerAddress);
router.put("/deactive-myaccount", Auth.auth, MobileCustomerController.deactiveMyAccount);
router.put("/update-current-location", Auth.auth, MobileCustomerController.updateMyCurrentLocation);

/* Voucher Router. */
router.post("/voucher",Tool.blackWords, Auth.auth, VoucherController.createVoucher);
router.put("/voucher",Tool.blackWords, Auth.auth, VoucherController.updateVoucher);
router.get("/voucher", VoucherController.getListVoucher);
router.put("/advoucher", Auth.auth, VoucherController.activeDeactive);

/* Payment Router. */
router.post("/payment", Auth.auth, PaymentController.createPaymentMethod);
router.get("/payment", PaymentController.getPaymentMethod);

/* Order Router. */
router.post("/count-money", OrderController.getMoney);
router.post("/order",Tool.blackWords, Auth.auth, OrderController.createOrder);
router.get("/order", Auth.auth, OrderController.getOrder);
router.get("/my-order", Auth.auth, OrderController.getMyOrder);
router.put("/cancel-my-order", Auth.auth, OrderController.cancelMyOrder);
router.put("/approve-order", Auth.auth, OrderController.approveOrder);
router.put("/reject-order", Auth.auth, OrderController.rejectOrder);
router.put("/do-order", Auth.auth, OrderController.doOrder);
router.put("/finish-order", Auth.auth, OrderController.finishOrder);
router.put("/review-my-order",Tool.blackWords, Auth.auth, OrderController.reviewMyOrder);
router.put("/feedback-order",Tool.blackWords,Auth.auth,  OrderController.feedbackOrder);
router.post("/pay-order", OrderController.payOrder);
router.post("/pay-success", OrderController.paymentSuccess);
router.get("/order/:id", Auth.auth, OrderController.getDetailOrder);


/* Notifi Router. */
router.get("/my-notification", Auth.auth, NotificationController.getMyNotification);
router.put("/read-notification", Auth.auth, NotificationController.readNotification);
router.post("/send-notification", OrderController.pushNotification);
router.post("/verify-otp", AuthController.verifyOtp);
router.post("/otp-forget-password", AuthController.sendOtpForgePassword);
router.post("/update-otp-password", AuthController.forgetPasswordByOtp);

/* Wallet Router. */
router.post("/wallet-success", WalletController.addMoneySuccess);
router.post("/add-money", Auth.auth, WalletController.addMoneybyBaoKim);
router.get("/transactions", Auth.auth, WalletController.getTransaction);
router.get("/bank-method", Auth.auth, WalletController.getBankPaymentMethod);
router.post("/transaction",Tool.blackWords, Auth.auth, WalletController.createTransaction);
router.get("/customer-owner", Auth.auth, WalletController.getCustomerOwner);

/* Tool Router. */
router.post("/create-tool", Auth.auth, ToolController.createTool);
router.post("/update-black-keyword", Auth.auth, ToolController.updateBlackKeyWork);
router.post("/ad-black-keyword", Auth.auth, ToolController.activeDeactiveBlackKeyWord);
router.get("/black-keyword", Auth.auth, ToolController.getBlackKeyWord);

/* Report Router. */
router.get("/count-data", ReportController.getApiSystemReport);


module.exports = router;
