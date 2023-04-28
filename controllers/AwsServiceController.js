const AWS = require('aws-sdk')
const configAws = require('../aws/config.json')
const s3 = new AWS.S3({
    accessKeyId: configAws.AWS_ACCESS_KEY,
    secretAccessKey: configAws.AWS_SECRET_KEY
})
var uuid = require("uuid");
const sharp = require('sharp');


class AwsServiceController {

    uploadImage = async (req, res, next) => {
        try {
            let myFile = req.file.originalname.split(".")
            const fileType = myFile[myFile.length - 1]
            const compressImage = await sharp(req.file.buffer)
                .jpeg({ quality: 90 })
                .toBuffer();

            const params = {
                Bucket: configAws.BUCKET,
                Key: `spa-images/${uuid.v4()}.${fileType}`,
                Body: compressImage
            }

            s3.upload(params, (error, data) => {
                if (error) {
                    res.status(500).send(error)
                }
                const file = req.file;
                const dataImage = {
                    "fieldname": file.fieldname,
                    "originalname": file.originalname,
                    "encoding": file.encoding,
                    "mimetype": file.mimetype,
                    "destination": "AWS",
                    "filename": data.Key.split("/").at(-1),
                    "path": data.Location,
                    "size": file.size
                }
                res.status(200).send(dataImage)
            })
        } catch (error) {
            console.log(error)
            next(error)
        }

    }

    uploadMultipleImage = async (req, res, next) => {
        try {
            const params = []
            for (const file of req.files) {
                let myFile = file.originalname.split(".")
                const fileType = myFile[myFile.length - 1]
                const compressImage = await sharp(file.buffer)
                    .jpeg({ quality: 90 })
                    .toBuffer();

                params.push({
                    Bucket: configAws.BUCKET,
                    Key: `spa-images/${uuid.v4()}.${fileType}`,
                    Body: compressImage
                })
            }
            const responsesAws = await Promise.all(
                params.map(param => s3.upload(param).promise())
            )
            const data = responsesAws.map((element, index) => {
                const file = req.files[index]
                return {
                    "fieldname": file.fieldname,
                    "originalname": file.originalname,
                    "encoding": file.encoding,
                    "mimetype": file.mimetype,
                    "destination": "AWS",
                    "filename": element.Key.split("/").at(-1),
                    "path": element.Location,
                    "size": file.size
                }
            });
            res.status(200).send(data)
        } catch (error) {
            console.log(error)
            next(error)
        }
    }
}

module.exports = new AwsServiceController();
