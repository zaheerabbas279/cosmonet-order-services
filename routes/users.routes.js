const express = require("express");
const router = express.Router();
const userController = require("../controllers/users.controllers");

router.get("/getuserdata", userController.getUsersDataByEmail);
router.get("/getAllUsersList", userController.getAllUsersList);
router.get("/userById/:id", userController.getUserDetailsById);

module.exports = router;
