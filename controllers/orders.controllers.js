const db = require("../db");
const axios = require("axios").default;
const queryData = (sql_query) => {
  return new Promise((resolve, reject) => {
    db.query(sql_query, (err, resp) => {
      if (err) {
        reject(err);
      }

      resolve(resp);
    });
  });
};

module.exports = {
  getOrderInfo: (req, res, next) => {
    let sql = "SELECT * from order_info";
    db.query(sql, (err, result) => {
      if (err) {
        res
          .status(400)
          .send({ status: false, message: "error getting orders" });
      }
      res
        .status(200)
        .send({ status: true, message: "order details", data: result });
    });
  },
  getOrderRequirement: (req, res, next) => {
    let sql = "SELECT * from order_requirement";
    db.query(sql, (err, result) => {
      if (err) {
        res.status(400).send({
          status: false,
          messgae: "error getting the order requirements",
        });
      }
      res
        .status(200)
        .send({ status: true, messgae: "order requirements", data: result });
    });
  },

  getDashboard: async (req, res, next) => {
    try {
      db.query(
        `SELECT 
        oi.*, 
        ot.content_type,
        opg.project_goal_name,
        otov.voice_type
        FROM 
        order_info as oi 
        join 
        order_type as ot 
        join 
        order_project_goal as opg
        join 
        order_tone_of_voice as otov
        on 
        oi.order_type_id = ot.id AND oi.project_goal_id = opg.id AND oi.voice_tone_id = otov.id`,
        async (err, result) => {
          // db.query(`SELECT * FROM order_info join order_type on order_info.order_type_id = order_type.id`, (err, result) => {
          if (err) {
            res
              .status(400)
              .send({ status: false, message: "Error getting dashboard data" });
          }

          let mappedRes = await result.map(async (item) => {
            // console.log("🚀 ~ file: orders.controllers.js:71 ~ mappedRes ~ item:", item.user_id)
            if (item.order_status === "draft") {
              // ! do not send the result with status draft
              console.log("dont show the res");
            } else {
              // ! another query with res of the status other than the draft
              // ! call the user details api here from the user service

              const id = item.id;
              const _user_id = item.user_id;
              const order_requirement_query = `SELECT * FROM order_requirement WHERE order_info_id = ${id}`;
              try {
                let _result = await queryData(order_requirement_query);
                let _resultUser = await axios.get(
                  `http://localhost:4000/user/userDataById/${_user_id}`
                );
                return { ...item, data: _result, user: _resultUser.data };
              } catch (error) {
                console.log("errrr", error);
              }
              console.log("show the res");
            }
          });

          res.send({ status: true, data: await Promise.all(mappedRes) });
        }
      );
    } catch (error) {
      next(error);
    }
  },

  changeOrderStatus: (req, res, next) => {
    let _id = req.params.id;
    let status = req.body.status;
    let sql = "UPDATE order_info SET order_status = ? WHERE id = ?";
    db.query(sql, [status, _id], (err, result) => {
      if (err) {
        res
          .status(400)
          .send({ status: false, message: "Error updating the status" });
      }

      db.query("SELECT * FROM order_info WHERE id = ?", _id, (err, resp) => {
        if (err) {
          res
            .status(400)
            .send({ status: false, message: "error finding the order" });
        }
        res.status(200).send({ status: true, message: "OK", data: resp });
      });
    });
  },
};
