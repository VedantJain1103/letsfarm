const mongoose = require('mongoose');

const CategorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: 'Category name is required',
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: 'Created By is required',
    },
    createdDate: {
        type: Date,
        required: "Creation date is required",
    },
    modifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    modifiedDate: {
        type: Date,
    },
    isActive: {
        type: Boolean,
        required: 'Category activity is required',
    }
})

module.exports = mongoose.model('Category', CategorySchema, 'Category');