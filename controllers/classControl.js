const asyncHandler = require("express-async-handler");
const Classes = require("../models/classModel");
const Drugs = require("../models/drugModel");
const { body, validationResult } = require("express-validator");

//display all classes
exports.class_list = asyncHandler(async (req, res, next) => {
  const allClasses = await Classes.find({}, "name").sort({ name: -1 }).exec();

  res.render("drugList", {
    title: `Drug Class Catalog:`,
    list: allClasses,
    action: `/catalog/class/create`,
    //fields: {name: 'Name'}
  });
});

//class detail page
exports.class_detail = asyncHandler(async (req, res, next) => {
  const [myClass, allDrugs] = await Promise.all([
    Classes.findById(req.params.id).exec(),
    Drugs.find({ class: req.params.id }, "name").exec(),
  ]);

  if (!myClass) {
    // No results.
    const err = new Error("Not found");
    err.status = 404;
    return next(err);
  } else {
    res.render("genericDetail", {
      item: myClass,
      title: myClass.name,
      drugs: allDrugs,
      type: "drug class",
      btnType: 'class'
    });
  }
});

exports.add_class_get = (req, res, next) => {
  res.render("drugForm", {
    title: `Add a new drug class`,
    fields: { Name: "name" },
    action: "/catalog/class/create",
  });
};

exports.add_class_post = [
  body("name")
    .trim()
    .escape()
    .isLength({ min: 1 })
    .withMessage(`Name is required`)
    .isAlpha('en-US', {ignore: ' '})
    .withMessage(`Name : No special characters`),

  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      //validation error
      res.redirect(`/catalog/classes/`)
    } else {
      const newClass = new Classes({
        name: req.body.name,
      });

      await newClass.save();
      res.redirect(newClass.url);
    }
  }),
];

exports.del_class_get = asyncHandler(async (req, res, next) => {
  const myClass = await Classes.findById(req.params.id);

  if (myClass === null) {
    //not found
  } else {
    res.render("drugDelete", {
      title: `Delete ${myClass.name} from the database?`,
      id: myClass._id,
      action: `/catalog/class/${myClass._id}/delete`,
    });
  }
});

exports.del_class_post = asyncHandler(async (req, res, next) => {
  const classId = req.body.id;
  //delete should remove the class from each drug too
  await Drugs.updateMany({class: classId}, { $pull: { class: classId } });

  await Classes.findByIdAndRemove(classId);
  res.redirect("/catalog/classes");
});

exports.update_class_get = asyncHandler(async (req, res, next) => {
  const myClass = await Classes.findById(req.params.id);

  if (myClass === null) {
    //not found
    res.redirect("/catalog/class");
  } else {
    res.render("drugForm", {
      title: `Update ${myClass.name}?`,
      item: myClass,
      update: true,
      fields: { Name: "name" },
      action: `/catalog/class/${myClass._id}/update`,
    });
  }
});

exports.update_class_post = [
  body("name")
    .trim()
    .escape()
    .isLength({ min: 1 })
    .withMessage(`Name is required`)
    .isAlpha('en-US', {ignore: ' '})
    .withMessage(`Name : No special characters`),

  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      //validation error
    }

    const classId = req.params.id;

    const newClass = new Classes({
      name: req.body.name,
      _id: classId,
    });
    const update = await Classes.findByIdAndUpdate(classId, newClass, {});
    res.redirect(update.url);
  }),
];
