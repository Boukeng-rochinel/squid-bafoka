const express = require("express");
// const {
//   createJob,
//   getAllJobs,
//   findJobByName,
//   deleteJob,
// } = require("../Controllers/JobsController");
// const auth = require("../Middlewares/AuthMiddlewares");
const home = require("../Controllers/homeControllers")

const router = express.Router();

// router.post("/", auth, createJob);
router.post("/", home);

// router.get("/", getAllJobs);
// router.get("/:name", auth, findJobByName);
// // router.put("/:id", auth, updateJob);
// router.delete("/:id", auth, deleteJob);

module.exports = router;
