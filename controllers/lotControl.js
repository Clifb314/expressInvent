const asyncHandler = require("express-async-handler");
const Lots = require("../models/lotModel");
const Drugs = require("../models/drugModel");
const { body, validationResult } = require("express-validator");

//display all lots
exports.lot_list = asyncHandler(async (req, res, next) => {
  const lotList = await Drugs.find({})
    .populate({ path: "products.lots" })
    .sort({ name: 1 })
    .exec();

  res.render("lotList", {
    title: `Drugs listed with available lot numbers`,
    list: lotList,
    action: `/catalog/lot/create`,
  });
});

//lot detail
exports.lot_detail = asyncHandler(async (req, res, next) => {
  const [myLot, myDrug] = await Promise.all([
    Lots.findById(req.params.id).exec(),
    Drugs.find({ "products.lots": req.params.id }, "name product").exec(),
  ]);

  if (!myDrug) {
    const err = new Error("Not found");
    err.status = 404;
    return next(err);
  } else {
    res.render("genericDetail", {
      item: myLot,
      title: myLot.lot,
      drugs: myDrug,
      fields: [{ Quantity: "quantity" }],
      type: "lot number",
      btnType: 'lot'
    });
  }
});

exports.lot_add_get = (req, res, next) => {
  res.render("drugForm", {
    title: `Add a new lot number`,
    //should put this in a button from the drug info page so
    //it'll have the drugID in params
    drugId: req.params.id,
    fields: { Lot: "lot", Quantity: "quantity" },
    action: "/catalog/lot/create",
  });
};

exports.lot_add_post = [
  body("lot")
    .trim()
    .escape()
    .isLength({ min: 10 })
    .withMessage(`Lot number should be 10 numbers`)
    .isAlphanumeric()
    .withMessage(`Name : No special characters`),
  body("quantity")
    .trim()
    .escape()
    .isLength({ min: 1 })
    .withMessage(`Please enter a number`)
    .isNumeric()
    .withMessage(`Name : No special characters`),

  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      //errors found
    } else {
      const newLot = new Lots({
        lot: req.body.lot,
        quantity: req.body.quantity,
      });

      await newLot.save();
      const lotId = newLot._id;
      await Drugs.findByIdAndUpdate(req.body.drugId, {
        "products.lots": { $push: { lotId } },
      }).exec();
      res.redirect(newLot.url);
    }
  }),
];

exports.del_lot_get = asyncHandler(async (req, res, next) => {
  const [myLot, myDrug] = await Promise.all([
    Lots.findById(req.params.id),
    Drugs.findOne({ "products.lots": myLot._id }),
  ]);

  if (!myLot) {
    res.redirect("/catalog/lots");
  }

  let myTitle
  if (!myDrug) {
    myTitle = `Delete lot: ${myLot.lot} from the database?`
  } else {
    myTitle = `Delete lot: ${myLot.lot} and remove from ${myDrug.name}?`
  }

  res.render("drugDelete", {
    title: myTitle,
    //drug: myDrug,
    id: myLot._id,
    //remember find returns an array
    drugId: myDrug._id,
    action: `/catalog/lot/${myLot._id}/delete`,
  });
});

exports.del_lot_post = asyncHandler(async (req, res, next) => {
  const myLot = req.body.id;
  const myDrug = req.body.drugId;

  //await Drugs.findByIdAndRemove(myDrug)
  await Drugs.findByIdAndUpdate(myDrug, { $pull: { "products.lots": myLot } }).exec();
  await Lots.findByIdAndRemove(myLot).exec();
  res.redirect("/catalog/lots");
});

exports.update_lot_get = asyncHandler(async (req, res, next) => {
  const [myLot, myDrug] = await Promise.all([
    Lots.findById(req.params.id).exec(),
    Drugs.findOne({ "products.lots": req.params.id }).exec(),
    //Drugs.findById(req.body.drugId)
  ]);

  if (!myLot) {
    //not found
    res.redirect("/catalog/lots");
  }

  res.render("drugForm", {
    title: `Update lot number and/or quantity`,
    item: myLot,
    drugId: myDrug._id,
    update: true,
    fields: { Lot: "lot", Quantity: "quantity" },
    action: `/catalog/lot/${myLot._id}/update`,
  });
});

exports.update_lot_post = [
  body("lot")
    .trim()
    .escape()
    .isLength({ min: 10 })
    .withMessage(`Lot number should be 10 numbers`)
    .isAlphanumeric()
    .withMessage(`Name : No special characters`),
  body("quantity")
    .trim()
    .escape()
    .isLength({ min: 1 })
    .withMessage(`Please enter a number`)
    .isNumeric()
    .withMessage(`Name : No special characters`),

  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      //validation errors
      res.redirect(`/catalog/lots/`)
    } else {
      const newLot = new Lots({
        lot: req.body.lot,
        quantity: req.body.quantity,
        _id: req.params.id,
      });

      const update = await Lots.findByIdAndUpdate(req.params.id, newLot, {}).exec();
      //don't need to update drugs, because id is the same
      //await Drugs.findByIdAndUpdate(req.body.drugId, {$pull: {products: {lots: }}})
      res.redirect(`/catalog/lot/${req.params.id}/`);
    }
  }),
];
