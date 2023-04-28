const Tool = require("../models").Tool;
const adminRoleCode = require("../constants/roles").adminRoleCode;
const codeBlackKeyWord = "BLACK_KEY_WORD";
class ToolController {
  createTool = async (req, res, next) => {
    try {
      const user = req.user;
      const roleCode = await user.roleCode;
      if (roleCode != adminRoleCode) {
        return res
          .status(500)
          .json({ message: "Chức năng chỉ dành cho quản trị viên" });
      }

      const data = req.body;
      if (!data.name) {
        return res
          .status(403)
          .json({ message: "Tên chức năng không thể bỏ trống" });
      }
      if (!data.code) {
        return res.status(403).json({ message: "Mã không thể bỏ trống" });
      }
      const checkCode = await Tool.findOne({ where: { code: data.code } });
      if (checkCode) {
        return res.status(403).json({ message: "Mã đã tồn tại" });
      }
      await Tool.create({
        name: data.name,
        code: data.code,
        value: 1,
        description: data.description,
      });
      return res.status(200).json({ message: "Thành công" });
    } catch (error) {
      console.log(error);
      next(error);
    }
  };
  updateBlackKeyWork = async (req, res, next) => {
    try {
      const user = req.user;
      const roleCode = await user.roleCode;
      if (roleCode != adminRoleCode) {
        return res
          .status(500)
          .json({ message: "Chức năng chỉ dành cho quản trị viên" });
      }
      const data = req.body;
      if (!data.message) {
        return res.status(403).json({ message: "Dữ liệu không thể bỏ trống" });
      }
      await Tool.update(
        {
          data: data.message,
        },
        { where: { code: codeBlackKeyWord } }
      );
      return res.status(200).json({ message: "Thành công" });
    } catch (error) {
      console.log(error);
      next(error);
    }
  };
  activeDeactiveBlackKeyWord = async (req, res, next) => {
    try {
      const user = req.user;
      const roleCode = await user.roleCode;
      if (roleCode != adminRoleCode) {
        return res
          .status(500)
          .json({ message: "Chức năng chỉ dành cho quản trị viên" });
      }
      const current = await Tool.findOne({ where: { code: codeBlackKeyWord } });
      const status = current.active ? false : true;
      await current.update({
        active: status,
      });
      return res.status(200).json({ message: "Thành công" });
    } catch (error) {
      console.log(error);
      next(error);
    }
  };
  getBlackKeyWord = async (req, res, next) => {
    try {
      const user = req.user;
      const roleCode = await user.roleCode;
      if (roleCode != adminRoleCode) {
        return res
          .status(500)
          .json({ message: "Chức năng chỉ dành cho quản trị viên" });
      }
      const data = await Tool.findOne({ where: { code: codeBlackKeyWord } });
      return res.status(200).json(data);
    } catch (error) {
      console.log(error);
      next(error);
    }
  };
}
module.exports = new ToolController();
