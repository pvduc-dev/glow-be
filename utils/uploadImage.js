const fs = require('fs')
const multer = require('multer')

var uuid = require("uuid");

const fileFilter = (req, file, cb) => {
  let name = file.originalname.split(".")
  const extenImage = ['png', 'jpg', 'jpeg']
  const typePics = ['image/png', 'image/jpg', 'image/jpeg']
  if (typePics.includes(file.mimetype) && extenImage.includes(name[name.length - 1].toLowerCase())) {
    cb(null, true)
  } else {
    cb(null, false)
  }
}
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const path = `public/uploads/images`
    fs.mkdirSync(path, { recursive: true })
    cb(null, path)
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + uuid.v4() + '-' + file.originalname.replace(/\s/g, ''))  //Luu ten file va xoa khoang trang trong ten
  }
})
const upload = multer({ storage: storage,limits: {fileSize: 1024*1024*50}, fileFilter: fileFilter });

const storageAws = multer.memoryStorage({
  destination: function(req, file, callback) {
      callback(null, '')
  }
})
const uploadAws = multer({storageAws, limits: {fileSize: 1024*1024*50}, fileFilter: fileFilter })

module.exports =  {upload, uploadAws}