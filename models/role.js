const mongoose = require('mongoose');

const RoleSchema = new mongoose.Schema({
    name: {
        type: String,
        required: 'Role name is rqeuired',
    }
});

module.exports = mongoose.model('Role', RoleSchema);