const express = require("express");
const route = express.Router();
const orderController = require("../controllers/orders.controllers");

route.get("/getAllOrders", orderController.getOrderInfo);
route.get("/getAllOrdersRequirements", orderController.getOrderRequirement);
route.get("/getDashboard", orderController.getDashboard);
route.put("/updateOrderStatus/:id", orderController.changeOrderStatus);

module.exports = route;
