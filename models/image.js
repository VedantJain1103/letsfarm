const mongoose = require("mongoose")

const ImageSchema = new mongoose.Schema({
    itemId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Item',
        required: true,
    },
    img: {
        data: Buffer,
        contentType: String,
    },
    isDisplayImage: {
        type: Boolean,
        default: false,
    }
});

module.exports = new mongoose.model("Image", ImageSchema);