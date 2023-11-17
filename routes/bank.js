const router = require("express").Router();

const bankController = require("../controller/bank");

router.get("/", bankController.getIndex);
router.get("/about", bankController.getAbout);
router.get("/contact", bankController.getContact);

module.exports = router;
