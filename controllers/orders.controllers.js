const db = require("../db");
const nodemailer = require("nodemailer");
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

const STATUS_ENUMS = {
  ALLOT: "allot",
  HOLD: "hold",
  COMPLETE: "complete",
};

// taken an array of items, and also status
const countStatus = (arrayOfItems, status) => {
  return arrayOfItems?.filter((value) => value.status == status).length;
};

const getAllTotolStatus = (arrayOfStatus, status) => {
  let rep = arrayOfStatus.reduce((prv, currentValue) => {
    if (status == STATUS_ENUMS.ALLOT) {
      return (prv += currentValue?.allotCount || 0);
    } else if (status == STATUS_ENUMS.HOLD) {
      return (prv += currentValue?.holdCount || 0);
    } else if (status == STATUS_ENUMS.COMPLETE) {
      return (prv += currentValue?.completeCount || 0);
    }
  }, 0);
  //  console.log("🚀 ~ file: orders.controllers.js:33 ~ rep ~ rep:", rep)
  return rep;
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
          if (err) {
            res
              .status(400)
              .send({ status: false, message: "Error getting dashboard data" });
          }

          let mappedRes = await result.map(async (item) => {
            if (item.order_status === "draft") {
              // ! do not send the result with status draft
              console.log("dont show the res");
            } else {
              // ! another query with res of the status other than the draft
              // ! call the user details api here from the user service

              const id = item.id;
              const _user_id = item.user_id;
              let totalStatusCount = {
                totalHold: 0,
                totalCompleted: 0,
                totalAssign: 0,
              };
              const order_requirement_query = `SELECT * FROM order_requirement WHERE order_info_id = ${id}`;
              try {
                let _result = await queryData(order_requirement_query);
                let _resultUser = await axios.get(
                  `http://localhost:4000/user/userDataById/${_user_id}`
                );

                return {
                  ...item,
                  data: _result,
                  user: _resultUser.data,
                };
              } catch (error) {
                console.log("errrr", error);
              }
              // console.log("show the res");
            }
          });

          let data = await Promise.all(mappedRes);
          let allStatusDetails = data.map((item) => {
            let loopObj = {
              allotCount: countStatus(item?.data, STATUS_ENUMS.ALLOT),
              holdCount: countStatus(item?.data, STATUS_ENUMS.HOLD),
              completeCount: countStatus(item?.data, STATUS_ENUMS.COMPLETE),
            };
            return loopObj;
          });
          // total status count
          getAllTotolStatus(allStatusDetails, STATUS_ENUMS.ALLOT);
          let status = {
            allotCount: getAllTotolStatus(allStatusDetails, STATUS_ENUMS.ALLOT),
            holdCount: getAllTotolStatus(allStatusDetails, STATUS_ENUMS.HOLD),
            completeCount: getAllTotolStatus(
              allStatusDetails,
              STATUS_ENUMS.COMPLETE
            ),
          };
          data.unshift(status);
          res.send({ status: true, data });
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

  changeStatusById: (req, res, next) => {
    let _id = req.params.id;
    let status = req.body.status;

    if (status === "hold") {
      // res.status(400).send({ status: false, message: "Status is on HOLD" });
      let _sql = "UPDATE order_info SET order_status = ? WHERE id = ?";
      db.query(_sql, [status, _id], (err, result) => {
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
    } else {
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

          let mailTransporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
              user: "abbaszaheer216@gmail.com",
              pass: "ypljjcxiysxmajda",
            },
          });
          let mailDetails = {
            from: "abbaszaheer216@gmail.com",
            to: "abbaszaheer216@gmail.com",
            subject: "Test mail",
            text: "Test Mail from Cosmonet",
          };
          mailTransporter.sendMail(mailDetails, function (err, data) {
            console.log("triggred");
            if (err) {
              console.log("Error Occurs");
            } else {
              console.log("Email sent successfully");
            }
          });
          res.status(200).send({ status: true, message: "OK", data: resp });
        });
      });
    }
  },

  // createOrderReqquirements :(req, res)

  updateOrderRequirementsById: (req, res, next) => {
    let _id = req.params.id;

    let sql = `UPDATE order_requirement 
    SET 
    title ="${req.body.title}",
    order_content_type_id = ${req.body.order_content_type_id},
    content_creator_id = ${req.body.content_creator_id},
    keywords = "${req.body.keywords}",
    words_id = ${req.body.words_id},
    images_id = ${req.body.images_id},
    additional_comments = "${req.body.additional_comments}" 
    WHERE id = ${req.params.id}`;

    db.query(sql, (err, result) => {
      if (err) {
        res
          .status(400)
          .send({ status: false, message: "Error updating the status" });
      }

      db.query(
        "SELECT * from order_requirement WHERE id = ?",
        _id,
        (err, resp) => {
          if (err) {
            res
              .status(400)
              .send({ status: false, message: "Error finding the order" });
          }
          res.status(200).send({
            status: true,
            message: "Updated Successfully",
            data: resp,
          });
        }
      );
    });
  },
};
