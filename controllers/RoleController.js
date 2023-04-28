const User = require("../models").User;
const Role = require("../models").Role;
const MenuRole = require("../models").MenuRole;
const Menu = require("../models").Menu;
const {Op} = require("sequelize");
var bcrypt = require("bcryptjs");
class RoleController {
  getMenu = async (req, res, next) => {
    let user = req.user;
    let menu = await MenuRole.findAll({where: {roleId: user.roleId}, attributes: ["menuId"]});
    let menuID = menu.map(el => el.menuId);
    let childrenMenu = await Menu.findAll({
      where: {id: menuID, parentId: {[Op.not]: null}},
      raw: true, // Thuộc tính raw: true sẽ chuyển collect về Array thuần
      attributes: ["id", "parentId", "icon", "name"],
    });
    let parentMenu = await Menu.findAll({
      where: {id: menuID, parentId: null},
      raw: true,
      order: [["order", "ASC"]],
      attributes: ["id", "parentId", "icon", "name"],
    });
    let menus = [];
    menus = parentMenu.map(el => {
      let children = childrenMenu.filter(it => it.parentId === el.id);
      return {
        ...el,
        children: children,
      };
    });
    return res.status(200).json(menus);
  };
  addMenu = async (req, res, next) => {
    const data = req.body;
    if (!data || !data.name) {
      return res.status(422).json({message: "Tên Menu không thể bỏ trống"});
    }
    let idMenu = await Menu.findAll({attributes: ["id"]});
    idMenu = idMenu.map(el => el.id);
    if (data.parentId && !idMenu.includes(Number(data.parentId))) {
      return res.status(422).json({message: "Menu cha không hợp lệ"});
    }
    try {
      const menu = await Menu.create({
        parentId: data.parentId ? data.parentId : null,
        name: data.name,
        icon: data.icon,
        iconColor: data.iconColor,
        textColor: data.textColor,
        order: data.order,
      });
      if (data.roles && data.roles.length) {
        for (let item of data.roles) {
          MenuRole.create({
            roleId: item,
            menuId: menu.id,
          });
        }
      }
      return res.status(200).json({message: "Thành công"});
    } catch (error) {
      console.log(error);
      return res.status(500).json(error);
    }
  };
  editMenu = async (req, res, next) => {
    const data = req.body;
    if (!data || !data.name) {
      return res.status(422).json({message: "Tên Menu không thể bỏ trống"});
    }
    if (!data.id) {
      return res.status(422).json({message: "Không thể cập nhật Menu"});
    }
    let idMenu = await Menu.findAll({attributes: ["id"]});
    idMenu = idMenu.map(el => el.id);
    if (data.parentId && !idMenu.includes(Number(data.parentId))) {
      return res.status(422).json({message: "Menu cha không hợp lệ"});
    }
    try {
      const menu = await Menu.update(
        {
          parentId: data.parentId ? data.parentId : null,
          name: data.name,
          icon: data.icon,
          iconColor: data.iconColor,
          textColor: data.textColor,
          order: data.order,
        },
        {where: {id: data.id}}
      );
      await MenuRole.destroy({where: {menuId: data.id}});
      for (let item of data.roles) {
        await MenuRole.create({
          roleId: item,
          menuId: data.id,
        });
      }
      return res.status(200).json({message: "Thành công"});
    } catch (error) {
      console.log(error);
      return res.status(500).json(error);
    }
  };
  deleteMenu = async (req, res, next) => {
    const data = req.body;
    if (!data || !data.id) {
      return res.status(422).json({message: "Không thể xóa Menu"});
    }
    try {
      const menu = await Menu.findOne({
        where: {id: data.id},
        include: [{model: Menu, as: "children", attributes: ["id", "name"]}],
      });
      if (menu.children && menu.children.length) {
        return res.status(403).json({message: "Vui lòng xóa các Menu con trước"});
      }
      await Menu.destroy({where: {id: data.id}});
      return res.status(200).json({message: "Thành công"});
    } catch (error) {
      return res.status(500).json({message: "Không thể xóa menu"});
    }
  };
  getRouterName = async (req, res, next) => {
    let menu = await MenuRole.findAll({where: {roleId: user.roleId}, attributes: ["menuId"]});
    let menuID = menu.map(el => el.menuId);
    let data = await Menu.findAll({
      where: {id: menuID},
      raw: true, // Thuộc tính raw: true sẽ chuyển collect về Array thuần
      attributes: ["name"],
    });
    let routerNames = data.map(el => el.name);
    return res.status(200).json(routerNames);
  };
  getMenuAdmin = async (req, res, next) => {
    const page = req.query.page ? req.query.page : 1;
    const perPage = req.query.perPage ? req.query.perPage : 10;
    const search = req.query.search ? req.query.search : null;
    const data = await Menu.paginate({
      where: search ? {name: {[Op.iLike]: `%${search}%`}} : {},
      page: page, // Default 1
      paginate: perPage, // Default 25
      order: [["order", "ASC"]],
      include: [
        {model: Menu, as: "Parent", attributes: ["name", "icon", "order"]},
        {model: MenuRole, as: "roles"},
      ],
    });
    data.currentPage = page;
    return res.status(200).json(data);
  };
  getParentMenu = async (req, res, next) => {
    let menus = await Menu.findAll({
      where: {parentId: null},
      raw: true,
      attributes: ["id", "parentId", "icon", "name"],
    });
    return res.status(200).json(menus);
  };
  getAllRole = async (req, res, next) => {
    let data = await Role.findAll();
    return res.status(200).json(data);
  };
  initFirstData = async (req, res, next) => {
    let checkUser = await User.findAndCountAll({limit: 1});
    let checkMenu = await Menu.findAndCountAll({limit: 1});
    let checRole = await Role.findAndCountAll({limit: 1});
    let checkRoleMenu = await MenuRole.findAndCountAll({limit: 1});
    if (checkUser.count || checkMenu.count || checRole.count || checkRoleMenu.count) {
      return res.status(500).json({message: "Không thể tạo dữ liệu do dã có dữ liệu trong CSDL"});
    }
    try {
      let roles = [
        {
          name: "SystemAdmin",
          code: "sysadmin",
          description: "Nhà phát triển",
        },
        {
          name: "Admin",
          code: "admin",
          description: "Quản trị viên hệ thống",
        },
        {
          name: "Manager",
          code: "manager",
          description: "Quản lý nghiệp vụ",
        },
      ];
      let menus = [
        {
          name: "Dashboard",
          icon: "mdi-grid-large",
        },
        {
          name: "Người dùng",
          icon: "mdi-account",
          children: [
            {
              name: "Menu",
              icon: "mdi-menu",
            },
            {
              name: "Thông tin",
              icon: "mdi-information",
            },
            {
              name: "Phân quyền",
              icon: "mdi-wrench",
            },
          ],
        },
      ];
      let users = [
        {
          name: "Mạnh Lê",
          userName: "manhle",
          email: "manhle@email.com",
          password: bcrypt.hashSync("12345678", 10),
          roleId: 1,
        },
      ];
      for (let el of roles) {
        await Role.create({
          name: el.name,
          code: el.code,
          description: el.description,
        });
      }

      for (let el of menus) {
        if (el.children) {
          const menu = await Menu.create({
            parentId: null,
            name: el.name,
            icon: el.icon,
          });

          for (let it of el.children) {
            await Menu.create({
              parentId: menu.id,
              name: it.name,
              icon: it.icon,
            });
          }
        } else {
          await Menu.create({
            parentId: null,
            name: el.name,
            icon: el.icon,
          });
        }
      }

      let allMenu = await Menu.findAll({raw: true, attributes: ["id"]});
      let allRole = await Role.findAll({raw: true, attributes: ["id"]});

      for (let el of allRole) {
        allMenu.forEach(async it => {
          await MenuRole.create({
            roleId: el.id,
            menuId: it.id,
          });
        });
      }
      var acount = {};
      for (let el of users) {
        acount = await User.create({
          name: el.name,
          userName: el.userName,
          email: el.email,
          password: el.password,
          roleId: el.roleId,
        });
      }
      return res.status(200).json({message: "Thành công", account_login: acount});
    } catch (error) {
      console.log(error);
      return res.status(500).json({message: "Không thể tạo dữ liệu", loi: error});
    }
  };

  getMenuForRole = async (req, res, next) => {
    const roleId = req.query.roleId;
    if (!roleId) {
      return res.status(500).json({message: "Quyền quản trị không tồn tại"});
    }
    let menuId = await MenuRole.findAll({where: {roleId: roleId}, raw: true, attributes: ["menuId"]});
    menuId = menuId.map(el => el.menuId);
    let parentMenu = await Menu.findAll({
      where: {parentId: null},
      order: [["order", "ASC"]],
      raw: true,
      attributes: ["name", "icon", "order", "id"],
    });
    let childrenMenu = await Menu.findAll({
      where: {parentId: {[Op.not]: null}},
      raw: true,
      attributes: ["id", "parentId", "icon", "name"],
    });
    parentMenu = parentMenu.map(el => {
      if (menuId.includes(el.id)) {
        return {...el, role: true};
      } else return {...el, role: false};
    });
    childrenMenu = childrenMenu.map(el => {
      if (menuId.includes(el.id)) {
        return {...el, role: true};
      } else return {...el, role: false};
    });
    let menus = [];
    menus = parentMenu.map(el => {
      let children = childrenMenu.filter(it => it.parentId === el.id);
      return {
        ...el,
        children: children,
      };
    });

    return res.status(200).json(menus);
  };
  updateMenuRole = async (req, res, next) => {
    const data = req.body;
    if (!data || !data.roleId) {
      return res.status(500).json({message: "Quyền không tồn tại"});
    }
    if (data.menu == null) {
      return res.status(500).json({message: "Không thể cập nhật"});
    }
    try {
      await MenuRole.destroy({where: {roleId: data.roleId}});
      for (let item of data.menu) {
        await MenuRole.create({
          roleId: data.roleId,
          menuId: item,
        });
      }
      return res.status(200).json({message: "Thành công"});
    } catch (error) {
      return res.status(500).json({message: "Không thể cập nhật"});
    }
  };
}

module.exports = new RoleController();
