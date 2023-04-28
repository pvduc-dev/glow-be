
const adminRoleCode = 'admin';
const ownerRoleCode = 'owner';
const staffRoleCode = 'staff';
const customerRoleCode = 'customer'

const roles = [
    {
        name: 'Admin',
        code: adminRoleCode,
        description: 'Quản trị viên hệ thống',
        createdAt: new Date(),
        updatedAt: new Date()
    },
    {
        name: 'Chủ cơ sở',
        code: ownerRoleCode,
        description: 'Chủ một cơ sở SPA',
        createdAt: new Date(),
        updatedAt: new Date()
    },
    {
        name: 'Kỹ thuật viên SPA',
        code: staffRoleCode,
        description: 'Kỹ thuật viên SPA',
        createdAt: new Date(),
        updatedAt: new Date()
    },
    {
        name: 'Khách hàng',
        code: customerRoleCode,
        description: 'Khách hàng sử dụng dịch vụ',
        createdAt: new Date(),
        updatedAt: new Date()
    },
]

module.exports = {
    roles,
    adminRoleCode,
    ownerRoleCode,
    staffRoleCode,
    customerRoleCode,
}






