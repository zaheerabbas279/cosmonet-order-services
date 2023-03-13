const express = require("express");
const db = require("../db");
const app = express();
// const axios = require("axios").default;
const axios = require("axios").default;

module.exports = {
  getUsersDataByEmail: async (req, res, next) => {
    try {
      let payload = {
        email: "rashmi.kr@dollarbirdinc.com",
      };
      // let _result = await axios.get("http://localhost:4000/pinguser");
      let _result = await axios.get("http://localhost:4000/user/getuserdata", {
        data: payload,
      });

      res.send({ status: true, data: _result.data });
    } catch (error) {
      console.log("error", error);
      next(error);
    }
  },

  getAllUsersList: async (req, res, next) => {
    try {
      let _result = await axios.get("http://localhost:4000/user/getAllUsers");
      res.send({ status: true, data: _result.data });
    } catch (error) {
      next(error);
    }
  },

  getUserDetailsById: async (req, res, next) => {
    let _id = req.params.id;
    try {
      let _result = await axios.get(
        `http://localhost:4000/user/userDataById/${_id}`
      );
      res.send({ status: true, data: _result.data });
    } catch (error) {
      next(error);
    }
  },
};
