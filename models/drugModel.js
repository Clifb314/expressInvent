const mongoose = require("mongoose");

// Define a schema
const Schema = mongoose.Schema;



//lot/strength/ndc should be linked. In an array of objects?
const DrugSchema = new Schema({
  name: String,
  products: [{
    ndc: String,
    strength: String,
    form: String,
    lots: [{ type: Schema.Types.ObjectId, ref: "lotModel", default: '' }],
    manufact: [{ type: Schema.Types.ObjectId, ref: 'manufactModel', default: '' }],
  }],
  //maybe turn strengths into a getter fxn? forms too?
  //strengths: [String],
  class: [{ type: Schema.Types.ObjectId, ref: 'classModel', default: '' }],

});

//virtuals
DrugSchema.virtual('url').get(function() {
    return `/catalog/drug/${this._id}`
})

DrugSchema.virtual('fields').get(function(){
  return 
})

DrugSchema.virtual('allLots').get(function() {
  let output = []

  for (const product of this.products) {
    for (const lot of product.lots) {
      output.push(lot)
    }
  }
  return output
})

DrugSchema.virtual('allForms').get(function() {
  let output = []

  for (const product of this.products) {
    output.push(product.form)
  }
  return output
})



module.exports = mongoose.model("DrugModel", DrugSchema);
