"use strict";
const mongoose = require("mongoose");
const app = require("./app");
const config = require("./config/config");
const routes = require("./routes/v1");
let server;

// TODO: CRIO_TASK_MODULE_UNDERSTANDING_BASICS - Create Mongo connection and get the express app to listen on config.port
(async () => {
  await mongoose.connect(config.mongoose.url, config.mongoose.options);

  app.listen(config.port, () => {
    console.log("Listening on port", config.port);
  });
})();
