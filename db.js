const mysql = require("mysql");

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "content_market_order",
});

db.connect((err) => {
  if (err) {
    console.log("error connecting to the orders database");
  }
  console.log("connectd to the orders database successfully");
});

module.exports = db;
