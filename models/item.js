const mongoose = require("mongoose")

const ItemSchema = new mongoose.Schema({
    name: {
        type: String,
        required: 'Item Name is required',
    },
    categoryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
    },
    costPrice: {
        type: Number,
        required: 'Cost price is required',
    },
    sellPrice: {
        type: Number,
        required: 'Sell price is required',
    },
    discount: {
        type: Number,
        default: 0,
    },
    description: {
        type: String,
    },
    unit: {
        type: String,
    },
    minimumUnit: {
        type: Number,
        required: 'Minimum number of unit is required',
    },
    sellerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    availableUnit: {
        type: Number,
        required: 'Available unit is required',
    },
    rating: {
        type: Number,
    }
})

module.exports = mongoose.model("Item", ItemSchema);