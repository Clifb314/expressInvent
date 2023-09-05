const Manu = require('../models/manufactModel')
const Drug = require('../models/drugModel')
const asyncHandler = require('express-async-handler');
const { body, validationResult } = require("express-validator");
//Display list of manufacturers
exports.manu_list = asyncHandler(async (req, res, next) => {
    const allManus = await Manu.find({})
        .sort({ name: -1 })
        .exec();

    res.render('drugList', {
        title: 'Manufacturer Catalog',
        list: allManus,
        action: `/catalog/manu/create`,
        fields: {country: 'Country'}
    })
})


//detail page
exports.manu_detail = asyncHandler(async (req, res, next) => {
    const [myManu, manuDrugs] = await Promise.all([
        Manu.findById(req.params.id).exec(),
        Drug.find({ 'products.manufact': req.params.id }, 'name').exec()
    ])

    if (!myManu) {
    // No results.
    const err = new Error("Not found");
    err.status = 404;
    return next(err);    
    } else {
        res.render('genericDetail', {
            item: myManu,
            title: myManu.name,
            drugs: manuDrugs,
            fields: [{Country: `country`}],
            type: 'manufacturer',
            btnType: 'manu'
        })
    }
})

exports.add_manu_get = (req, res, next) => {
    res.render('drugForm', {
        title: `Add a new drug manufacturer`,
        fields: {'Name': 'name', 'Country': 'country'},
        action: `/catalog/manu/create`
    })
}

exports.add_manu_post = [
    body('name')
    .trim()
    .escape()
    .isLength({ min: 1 })
    .withMessage(`Name is required`)
    .isAlpha('en-US', {ignore: ' '})
    .withMessage(`Name : No special characters`),
    body('country')
    .trim()
    .escape()
    .isLength({ min: 1 })
    .withMessage(`Country is required`)
    .isAlpha('en-US', {ignore: [' ', ',']})
    .withMessage(`Country: No special characters`),
    
    
    
    
    
    asyncHandler(async (req, res, next) => {
        const errors = validationResult(req)


        if (!errors.isEmpty()) {
            //validation error
            res.redirect(`/catalog/manus/`)
        } else {
            const newManu = new Manu({
                name: req.body.name,
                country: req.body.country,
            })

            await newManu.save()
            res.redirect(newManu.url)
        }
})]

exports.del_manu_get = asyncHandler(async (req, res, next) => {
    const myManu = await Manu.findById(req.params.id).exec()

    if (!myManu) {
        res.redirect('/catalog/manus')
        //not found
    } else {
        res.render('drugDelete', {
            title: `Delete ${myManu.name} from the database?`,
            id: myManu._id,
            action: `/catalog/manu/${myManu._id}/delete`
        })
    }
})

exports.del_manu_post = asyncHandler(async (req, res, next) => {
    const manuId = req.body.id
    //delete should remove the manufacturer from each drug too
    await Drug.updateMany({'products.manufact': manuId}, { $pull: {'products.$.manufact': manuId} }).exec()

    await Manu.findByIdAndRemove(manuId).exec()
    res.redirect('/catalog/manus')
})

exports.update_manu_get = asyncHandler(async (req, res, next) => {
    const myManu = await Manu.findById(req.params.id)

    if (!myManu) {
        //not found
        res.redirect('/catalog/manus')
    } else {
        res.render('drugForm', {
            title: `Update ${myManu.name}?`,
            item: myManu,
            update: true,
            fields: {'Name': 'name', 'Country': 'country'},
            action: `/catalog/manu/${myManu._id}/update`
        })
    }
})

exports.update_manu_post = [
    
    body('name')
    .trim()
    .escape()
    .isLength({ min: 1 })
    .withMessage(`Name is required`)
    .isAlpha('en-US', {ignore: ' '})
    .withMessage(`Name : No special characters`),
    body('country')
    .trim()
    .escape()
    .isLength({ min: 1 })
    .withMessage(`Country is required`)
    .isAlpha('en-US', {ignore: [' ','']})
    .withMessage(`Country : No special characters`),
    
    
    
    
    
    asyncHandler(async (req, res, next) => {
        const errors = validationResult(req)

        if (!errors.isEmpty()) {
            //validation error
        }

        const manuId = req.params.id

        const newManu = new Manu({
            name: req.body.name,
            country: req.body.country,
            _id: manuId,
        })
        const update = await Manu.findByIdAndUpdate(manuId, newManu, {}).exec()
        res.redirect(update.url)

})]