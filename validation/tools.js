const Tool = require("../models").Tool;
const codeBlackKeyWord = "BLACK_KEY_WORD";

const Auth = {
    blackWords: async (req, res, next) => {
        try {
            const blackWords = await Tool.findOne({where:{code: codeBlackKeyWord}, raw: true});
            if(!blackWords.active){
                next();
                return;
            }
            const dataWords = blackWords && blackWords.data ? blackWords.data.split(",") : [];
            var check = false;
            var dataInput = req.body;
            dataInput = dataInput ? JSON.stringify(dataInput).toUpperCase() : '';
            dataWords.forEach(it => {
                var find = dataInput.search(it.toUpperCase().trim());
                if(find != -1){
                    check = true;
                }
            });
            if(check){     
                return res.status(422).json({message: "Nội dung nhập chứa từ khóa bị cấm. Vui lòng thử lại"});
            }
            next();
            return;
        } catch (error) {
            console.log(error)
            next()
        }
    },

};
module.exports = Auth;
