const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const cors = require("cors");
const PORT = 4001;
require("./db");
const orderRoutes = require("./routes/orders.routes");
const userRoutes = require("./routes/users.routes");

app.use(bodyParser.json());
app.use(cors());
app.use("/orders", orderRoutes);
app.use("/users", userRoutes);

app.listen(PORT, () => {
  console.log("orders services are running!");
});
