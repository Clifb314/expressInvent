const Drug = require("../models/drugModel");
const Lots = require("../models/lotModel");
const Class = require("../models/classModel");
const Manufact = require("../models/manufactModel");
const asyncHandler = require("express-async-handler");
const { body, validationResult } = require("express-validator");

//for Catalog homepage
exports.catalog = asyncHandler(async (req, res, next) => {
  const [allDrugs, allManus, allClasses] = await Promise.all([
    Drug.find({}).sort({ name: 1 }).exec(),
    Manufact.find({}).sort({ name: 1 }).exec(),
    Class.find({}).sort({ name: 1 }).exec(),
  ]);

  res.render("catalog", {
    title: `Browse our catalog with the links below`,
    drugs: allDrugs,
    classes: allClasses,
    manus: allManus,
  });
});

//Display list of drugs available
exports.drug_list = asyncHandler(async (req, res, next) => {
  const allDrugs = await Drug.find({})
    .populate({
      path: "class",
      select: { name: 1 },
    })
    .populate({
      path: "products.lots",
      select: { lot: 1 },
    })
    .populate({
      path: "products.manufact",
      select: { name: 1 },
    })
    .sort({ name: 1 })
    .exec();

  res.render("drugList", {
    title: "Drug Catalog",
    list: allDrugs,
    action: `/catalog/drug/create`,
    classes: true,
    products: true,
    //products: {form: 'Form', strength: 'Strength', ndc: 'NDC', manufact: 'Manufacturer', lots: 'Lots'}
  });
});

exports.drug_detail = asyncHandler(async (req, res, next) => {
  const myDrug = await Drug.findById(req.params.id).exec();
  //Let's not populate, so we can create links in the view
  //.populate('products.class')
  //.populate('products.manufact')
  //.populate('products.lots')

  if (myDrug === null) {
    // No results.
    const err = new Error("Not found");
    err.status = 404;
    return next(err);
  }
  const drugClass = await Class.findById(myDrug.class);

  let output = [];
  for (const product of myDrug.products) {
    let lotList = [];
    for (const lot of product.lots) {
      const add = await Lots.findById(lot);
      lotList.push(add);
    }

    let manuList = [];
    for (const manu of product.manufact) {
      const add = await Manufact.findById(manu);
      manuList.push(add);
    }
    let obj = { manus: manuList, lots: lotList };
    output.push(obj);
  }

  res.render("drugDetail", {
    drug: myDrug,
    links: output,
    drugClass: drugClass,
    title: `${myDrug.name} - details`,
  });
});

exports.add_drug_get = (req, res, next) => {
  res.render("drugForm", {
    title: `Add a new drug to the database`,
    fields: { Name: "name", Class: "class" },
    action: "/catalog/drug/create",
  });
};

exports.add_drug_post = [
  //validate fields
  //going to have to check if lot, ndc, manufacturer, etc exists already
  //ok let's make name and class first then redirect to a page that adds an ndc
  body("name")
    .trim()
    .escape()
    .isLength({ min: 1 })
    .withMessage(`Name is required`)
    .isAlpha('en-US', {ignore: '\s'})
    .withMessage(`Name : No special characters or numbers`),
  body("class")
    .trim()
    .escape()
    .isLength({ min: 1 })
    .withMessage(`Class is required`)
    .isAlpha('en-US', {ignore: '\s'})
    .withMessage(`Class : No special characters or numbers`),

  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);
    const exists = await Drug.findOne({ name: req.body.name }).exec();
    const classExists = await Class.findOne({ name: req.body.class }).exec();

    if (!errors.isEmpty()) {
      //if errors, kick back to the form
      res.render("drugForm", {
        title: `Please review your submission for errors`,
        errors: errors,
        failedName: req.body.name,
        failedClass: req.body.class,
      });
    } else if (exists) {
      //redirect to drug detail page if it already exists
      res.redirect(exists.url);
    } else {
      let newClass;
      if (!classExists) {
        //create class if it doesn't exist
        newClass = new Class({
          name: req.body.class,
        });
        await newClass.save();
      } else {
        newClass = classExists;
      }
      const { name } = req.body;
      const addDrug = new Drug({
        name: name,
        class: newClass._id,
        products: [],
      });
      //save and redirect to new detail page
      await addDrug.save();
      //drug detail page should have an add product button/form
      res.redirect(addDrug.url);
    }
  }),
];
//need get/post for adding products

exports.product_form = asyncHandler(async (req, res, next) => {
  const myDrug = await Drug.findById(req.params.id).exec();

  res.render("prodForm", {
    title: `Add a product/ndc to ${myDrug.name}`,
    drugId: myDrug._id,
    action: `/catalog/drug/${myDrug._id}/addproduct`,
  });
});

exports.add_products = [
  body("ndc").trim().escape().isLength({ min: 1 }).isAlphanumeric(),
  body("lots").trim().escape().isLength({ min: 1 }).isAlphanumeric(),
  body("manufact").trim().escape().isLength({ min: 1 }).isAlpha('en-US', {ignore: ' '}),
  body("strength").trim().escape().isLength({ min: 1 }).matches(/^[0-9]{1,}[a-zA-Z]{2}((\s-\s)([0-9]{1,}[a-zA-Z]{2}))*$/g).withMessage('regex failed'),
  body("form").trim().escape().isLength({ min: 1 }).isAlpha(),

  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);
    const errorReport = errors.formatWith(({ msg }) => msg).array()

    if (!errors.isEmpty()) {
      //kick back to form if there's errors
      res.render("prodForm", {
        title: `Please review for errors`,
        errors: errorReport,
        drugId: req.params.id,
        action: `/catalog/drug/${req.params.id}/addproduct`,
        //return the submission as an object?
      });
    } else {
      //have to check for existing manufac and lot, like above with class
      //lot should be unique to a product, but we can worry about that later
      const { ndc, lots, manufact, strength, form } = req.body;
      // const [ manu, lot ] = await Promise.all([
      //     Manufact.find({ name: manufact}).exec(),
      //     Lots.find({ lot: lots }).exec()
      // ])
      let manuIds = [];
      if (typeof manufact === "object") {
        for (const manu of manufact) {
          const add = await Manufact.findOne({ name: manu }).exec();
          if (add === null) {
            const newManu = new Manufact({
              name: manu,
              country: "",
            });
            await newManu.save();
            manuIds.push(newManu._id);
          } else {
            manuIds.push(add._id);
          }
        }
      } else {
        const add = await Manufact.findOne({ name: manufact }).exec();
        if (!add) {
          const newManu = new Manufact({
            name: manufact,
            country: "",
          });
          await newManu.save();
          manuIds.push(newManu._id);
        } else {
          manuIds.push(add._id);
        }
      }

      let lotIds = [];
      if (typeof lots === "object") {
        for (const lot of lots) {
          const add = await Lots.findOne({ lot: lot }).exec();
          if (!add) {
            const newLot = new Lots({
              lot: lot,
              quantity: 1,
            });
            await newLot.save();
            lotIds.push(newLot._id);
          } else {
            lotIds.push(add._id);
          }
        }
      } else {
        const add = await Lots.findOne({ lot: lots }).exec();
        if (!add) {
          const newLot = new Lots({
            lot: lots,
            quantity: 1,
          });
          await newLot.save();
          lotIds.push(newLot._id);
        } else {
          lotIds.push(add._id);
        }
      }

      const product = {
        ndc: ndc,
        lots: lotIds,
        manufact: manuIds,
        strength: strength,
        form: form,
      };

      //const myDrug = await Drug.findById(req.body.drugID).exec()
      //push to products using updateOne and $push?
      await Drug.findByIdAndUpdate(req.params.id, {
        $push: { products: product },
      });
      res.redirect(`/catalog/drug/${req.params.id}`);
    }
  }),
];

exports.del_drug_get = asyncHandler(async (req, res, next) => {
  //Let's get a list of all records dependant on the drug first
  //actually just the lots

  const myDrug = await Drug.findById(req.params.id, "name products")
    .populate("products.lots")
    .exec();

  if (!myDrug) {
    res.redirect("/catalog/drugs");
  }

  res.render("drugDelete", {
    title: `Delete ${myDrug.name} and all associated ndcs?`,
    id: myDrug._id,
    action: `/catalog/drug/${myDrug._id}/delete`,
  });
});

exports.del_drug_post = asyncHandler(async (req, res, next) => {
  const [myDrug, allLots] = await Promise.all([
    Drug.findById(req.params.id).exec(),
    //search for any lot matching the array of lots from the selected drug
    //Lots.find({'_id': {$in: myDrug.lots}}).exec()
    //I think it'll be easier to iterate over the actual array within the drug document
    [...myDrug.products.lots],
    //should use the virtual
  ]);

  //let's delete the lots first
  for (const lot of allLots) {
    await Lots.findByIdAndRemove(lot).exec();
  }

  await Drug.findByIdAndRemove(req.body.id).exec();
  res.redirect("/catalog/drugs/");
});

exports.del_prod_get = asyncHandler(async (req, res, next) => {
  const { id, ndc } = req.params;
  const myDrug = await Drug.findOne(
    { _id: id, 'products.ndc': ndc }, {'products.$': 1, name: 1})
    .populate({
      path: "products.lots",
    })
    .exec();
  if (!myDrug) {
    //not found
    res.redirect("/catalog/drugs");
  }


  res.render("deleteProduct", {
    title: `Delete this product from ${myDrug.name}?`,
    drug: myDrug,
    drugId: myDrug._id,
    ndc: ndc,
    product: myDrug.products[0],
    action: `/catalog/drug/${myDrug._id}/${ndc}/delproduct`,
  });
});

exports.del_prod_post = asyncHandler(async (req, res, next) => {
  const ndc = req.body.ndc;
  const id = req.body.drugId;
  const prodId = req.body.prodId;

  await Drug.findByIdAndUpdate(id, {
    $pull: { products: { _id: prodId } },
  }).exec();

  res.redirect(`/catalog/drug/${id}`);
});

exports.update_drug_get = asyncHandler(async (req, res, next) => {
  const myDrug = await Drug.findById(req.params.id)
    .populate({
      path: "class",
      select: { name: 1 },
    })
    .exec();

  let output = [];
  for (let value of myDrug.class) {
    output.push(value.name);
  }

  myDrug.test = output.toString();

  if (myDrug === null) {
    const err = new Error("Drug not found in database");
    err.status = 404;
    return next(err);
  }
  //let allLots = []
  //for (const product of myDrug.products) {
  //    allLots.push(...product.lots)
  //}

  res.render("drugForm", {
    title: `Update ${myDrug.name}`,
    item: myDrug,
    update: true,
    //lots: allLots,
    fields: { Name: "name", Class: "test" },
    action: `/catalog/drug/${myDrug._id}/update`,
    products: true,
  });
});

exports.update_drug_post = [
  //update products in a seperate form?
  body("name").trim().escape().isLength({ min: 1 }).isAlpha('en-US', {ignore: '\s'}),
  body("test").trim().escape().isLength({ min: 1 }).isAlpha('en-US', {ignore: '\s'}),

  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      const myDrug = await Drug.findById(req.params.id).exec();

      let output = [];
      for (let value of myDrug.class) {
        output.push(value.name);
      }

      myDrug.test = output.toString();

      res.render("drugForm", {
        title: `Update ${myDrug.name}`,
        item: myDrug,
        errors: errors,
        update: true,
        fields: { Name: "name", Class: "test" },
        action: `/catalog/drug/${myDrug._id}/update`,
      });
      return;
    } else {
      //check if new class exists, and update accordingly
      const newClass = await Class.findOne({ name: req.body.test }).exec();
      let addClass;
      if (!newClass) {
        addClass = new Class({
          name: req.body.test,
        });
        await addClass.save();
      } else {
        addClass = newClass;
      }

      const oldDrug = await Drug.findById(req.params.id).exec()

      let prodArr = [...oldDrug.products]

      const update = new Drug({
        name: req.body.name,
        class: addClass._id,
        products: prodArr,
        _id: req.params.id,
      });

      const newDrug = await Drug.findByIdAndUpdate(
        req.params.id,
        update,
        {}
      ).exec();
      res.redirect(newDrug.url);
    }
  }),
];

exports.update_product_get = asyncHandler(async (req, res, next) => {
  //update manufact and lot will have to be handled in their respective controller
  //so just ndc, str, form here
  const { ndc, id } = req.params;
  const myDrug = await Drug.findById(id).exec();
  const product = await Drug.findOne(
    { _id: id, "products.ndc": ndc },
    { "products.$": 1 }
  )
    .populate("products.lots")
    .populate("products.manufact")
    .exec();

  res.render("prodForm", {
    title: `Update product in ${myDrug.name}`,
    prodId: product.products[0]._id,
    drugId: myDrug._id,
    item: product.products[0],
    update: true,
    action: `/catalog/drug/${id}/${ndc}/updateprod`,
  });
});

exports.update_product_post = [
  body("ndc").trim().escape().isLength({ min: 1 }).isAlphanumeric(),
  body("strength").trim().escape().isLength({ min: 1 }).matches(/^[0-9]{1,}[a-zA-Z]{2}((\s\/\s)([0-9]{1,}[a-zA-Z]{2}))*$/),
  body("form").trim().escape().isLength({ min: 1 }).isAlphanumeric(),

  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      const myDrug = await Drug.findById(req.body.drugId);
      const product = await Drug.findOne(
        { _id: req.body.drugId, "products._id": req.body.prodId },
        { "products.$": 1 }.populate('products.lots').populate('products.manufact').exec()
      );
      res.render("prodForm", {
        title: `Update products - check for errors`,
        drugId: myDrug._id,
        prodId: req.body.prodId,
        item: product.products[0],
        update: true,
        errors: errors,
        action: `/catalog/drug/${myDrug._id}/${req.body.ndc}/updateprod`,
      });
      return;
    } else {
      const { ndc, strength, manufact, form, lots, prodId, drugId } = req.body;
      //check if lot/manu exist
      // const [ checkLot, checkManu ] = await Promise.all([
      //     Manufact.find({ name: manufact }),
      //     Lots.find({ lot: lots })
      // ])
      let lotIds = [];
      let manuIds = [];
      if (typeof manufact === "object") {
        for (const manu of manufact) {
          const add = await Manufact.findOne({ name: manu }).exec();
          if (!add) {
            const newManu = new Manufact({
              name: manu,
              country: "",
            });
            await newManu.save();
            manuIds.push(newManu._id);
          } else {
            manuIds.push(add._id);
          }
        }
      } else {
        const add = await Manufact.findOne({ name: manufact }).exec();
        if (!add) {
          const newManu = new Manufact({
            name: manufact,
            country: "",
          });
          await newManu.save();
          manuIds.push(newManu._id);
        } else {
          manuIds.push(add._id);
        }
      }

      if (typeof lots === "object") {
        for (const lot of lots) {
          const add = await Lots.findOne({ lot: lot }).exec();
          if (!add) {
            const newLot = new Lots({
              lot: lot,
              quantity: 1,
            });
            await newLot.save();
            lotIds.push(newLot._id);
          }
          lotIds.push(add._id);
        }
      } else {
        const add = await Lots.findOne({ lot: lots }).exec();
        if (!add) {
          const newLot = new Lots({
            lot: lots,
            quantity: 1,
          });
          await newLot.save();
          lotIds.push(newLot._id);
        } else {
          lotIds.push(add._id);
        }
      }

      const update = {
        ndc: ndc,
        strength: strength,
        form: form,
        lots: lotIds,
        manufact: manuIds,
        //check where prodId comes from
        _id: prodId,
      };
      const newDrug = await Drug.updateOne(
        { _id: drugId, "products._id": prodId },
        { $set: { "products.$": update } }
      );

      if (!newDrug.acknowledged) {
        console.log(newDrug.acknowledged);
      } else {
        res.redirect(`/catalog/drug/${drugId}`);
      }
    }
  }),
];
