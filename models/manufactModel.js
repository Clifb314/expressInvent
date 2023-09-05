const mongoose = require('mongoose')

const Schema = mongoose.Schema

const ManuSchema = new Schema({
    name: String,
    country: String,
})

//virtuals
ManuSchema.virtual('url').get(function() {
    return `/catalog/manu/${this._id}`
})

module.exports = mongoose.model('manufactModel', ManuSchema)