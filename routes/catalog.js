const express = require("express");
const router = express.Router();

//controllers
const classControl = require('../controllers/classControl')
const drugControl = require('../controllers/drugControl')
const manuControl = require('../controllers/manuControl')
const lotControl = require('../controllers/lotControl')


router.get('/', drugControl.catalog)

//Drug pages

router.get('/drugs', drugControl.drug_list)

router.get('/drug/create', drugControl.add_drug_get)
router.post('/drug/create', drugControl.add_drug_post)

router.get('/drug/:id/delete', drugControl.del_drug_get)
router.post('/drug/:id/delete', drugControl.del_drug_post)

router.get('/drug/:id/update', drugControl.update_drug_get)
router.post('/drug/:id/update', drugControl.update_drug_post)

    //to manipulate the products within a drug
router.get('/drug/:id/addproduct', drugControl.product_form)
router.post('/drug/:id/addproduct', drugControl.add_products)

router.get('/drug/:id/:ndc/delproduct', drugControl.del_prod_get)
router.post('/drug/:id/:ndc/delproduct', drugControl.del_prod_post)

router.get('/drug/:id/:ndc/updateprod', drugControl.update_product_get)
router.post('/drug/:id/:ndc/updateprod', drugControl.update_product_post)

    //detail page
router.get('/drug/:id/', drugControl.drug_detail)


//Lot pages

router.get('/lots', lotControl.lot_list)

router.get('/lot/create', lotControl.lot_add_get)
router.post('/lot/create', lotControl.lot_add_post)

router.get('/lot/:id/delete', lotControl.del_lot_get)
router.post('/lot/:id/delete', lotControl.del_lot_post)

router.get('/lot/:id/update', lotControl.update_lot_get)
router.post('/lot/:id/update', lotControl.update_lot_post)

router.get('/lot/:id/', lotControl.lot_detail)


//Manufacturer pages

router.get('/manus', manuControl.manu_list)

router.get('/manu/create', manuControl.add_manu_get)
router.post('/manu/create', manuControl.add_manu_post)

router.get('/manu/:id/delete', manuControl.del_manu_get)
router.post('/manu/:id/delete', manuControl.del_manu_post)

router.get('/manu/:id/update', manuControl.update_manu_get)
router.post('/manu/:id/update', manuControl.update_manu_post)

router.get('/manu/:id', manuControl.manu_detail)

//Class pages

router.get('/classes', classControl.class_list)

router.get('/class/create', classControl.add_class_get)
router.post('/class/create', classControl.add_class_post)

router.get('/class/:id/delete', classControl.del_class_get)
router.post('/class/:id/delete', classControl.del_class_post)

router.get('/class/:id/update', classControl.update_class_get)
router.post('/class/:id/update', classControl.update_class_post)

router.get('/class/:id', classControl.class_detail)

module.exports = router;