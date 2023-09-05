const mongoose = require('mongoose')

const Schema = mongoose.Schema

const ClassSchema = new Schema({
    name: String,
    //the drug will have all the references?
    //drugs: [{ type: Schema.Types.ObjectId, ref: 'drugModel' }],
})


//virtuals
ClassSchema.virtual('url').get(function() {
    return `/catalog/class/${this._id}`
})

module.exports = mongoose.model('classModel', ClassSchema)