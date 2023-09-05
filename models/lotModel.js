const mongoose = require('mongoose')

const Schema = mongoose.Schema

const LotSchema = new Schema({
    lot: String,
    quantity: Number,
})


//virtuals
LotSchema.virtual('url').get(function() {
    return `/catalog/lot/${this._id}`
})

//to simplify the list pages
LotSchema.virtual('name').get(function() {
    return this.lot
})


module.exports = mongoose.model('lotModel', LotSchema)