var express = require("express");
var route = express.Router();
const { generateToken, decryptToken } = require("../service/tokenservice");
const { generateUUID } = require("../service/uuidservice");
const passport = require("../authenticate/passport_init");
const key = require("../service/key");
const fileUpload = require("express-fileupload");

const { Donation } = require("../db/donationmodel");
const { Donor } = require("../db/donormodel");
const { Company, Fundraiser } = require("../db/companymodel");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
var multer = require("multer");
route.use(fileUpload());

// var storage = multer.diskStorage({
//       destination: function (req, file, cb) {
//       cb(null, 'public')
//     },
//     filename: function (req, file, cb) {
//       cb(null, Date.now() + '-' +file.originalname )
//     }
// })

var storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, "public");
  },
  filename: function(req, file, cb) {
    cb(null, new Date() + "-" + file.originalname);
  }
});

var upload = multer({ storage: storage });

route.get(
  "/:companyFilter/:locationFilter/:categoryFilter/:sortFilter",
  async (req, res) => {
    console.log("----------getting jobs");
    Decryptedtoken = decryptToken(req.headers.authorization);
    var sort = "";
    var whereCondition = {};
    if(req.params.companyFilter !== "empty"){
      whereCondition={companyName:req.params.companyFilter}
                }
          if (req.params.categoryFilter !== "empty") {
            whereCondition = {
              ...whereCondition,
              $or: [
                { title: { $regex: new RegExp(req.params.categoryFilter, "i") } },
                { category: { $regex: new RegExp(req.params.categoryFilter, "i") } }
              ]
            };
          }
      
    console.log(Decryptedtoken.email);

    try {
      await Company.findOne({
        emailId: Decryptedtoken.email
      })
        .then(tokenuser => {
          console.log(tokenuser + "in details ------------------------");
          studentId = tokenuser._id;
          email = tokenuser.emailId;
          name = tokenuser.name;
        })
        .catch(err => {
          console.log(`error posting student journey ${err}`);
        });
      var { page, limit } = req.query;
      console.log(parseInt(page, 10));
      var options = {
        populate: "companyId",
        page: parseInt(page, 10) || 1,
        limit: parseInt(limit, 10) || 10
        // sort: sort,
      };
      console.log(whereCondition);
      const result = await Fundraiser.paginate(whereCondition, options);
      console.log("sending jobs-----------------" + result);
      console.log(result);
      res.status(201).send({
        result: result.docs,
        total: result.total,
        pages: result.pages
      });
    } catch (err) {
      console.log(`error getting jobs ${err}`);
      res.status(500).send({
        errors: {
          body: err
        }
      });
    }
  }
);

route.post("/", async (req, res) => {
  console.log("----------create fundraiser");
  var companyId, name;
  Decryptedtoken = decryptToken(req.headers.authorization);
  try {
    await Company.findOne({
      emailId: Decryptedtoken.email
    })
      .then(tokenuser => {
        console.log(tokenuser);
        if (tokenuser) {
          companyId = tokenuser._id;
          email = tokenuser.emailId;
          name = tokenuser.companyName;
        } else {
          res.status(403).send({
            errors: {
              err: "Unauthenticated user"
            }
          });
        }
      })
      .catch(err => {
        console.log(`error posting jobs ${err}`);
      });

    const result = await Fundraiser.create({
      companyName: name,
      companyId: companyId,
      title: req.body.fundraiser.title,
      description: req.body.fundraiser.description,
      category: req.body.fundraiser.category,
      amount: req.body.fundraiser.amount,
      amountDonated: 0
    });

    if (result) {
      res.status(201).send({ result });
    } else {
      res.status(403).send({
        errors: {
          err: "Unable to add job"
        }
      });
    }
  } catch (err) {
    console.log(err);
    res.status(403).send({
      errors: {
        err: err
      }
    });
  }
});

route.post("/apply", async (req, res) => {
  console.log(req.body);
  console.log("applying for job");
  var studentId;
  var student, studentObjectId;
  Decryptedtoken = decryptToken(req.headers.authorization);
  try {
    await Donor.findOne({
      emailId: Decryptedtoken.email
    })
      .then(tokenuser => {
        if (tokenuser) {
          student = tokenuser;
          studentId = tokenuser._id;
          studentObjectId = tokenuser._id;
          email = tokenuser.emailId;
          name = tokenuser.name;
        } else {
          res.status(403).send({
            errors: {
              err: "Unauthenticated user"
            }
          });
        }
      })
      .catch(err => {
        console.log(`error getting student basic details ${err}`);
      });

    console.log(
      student,
      "-----------------------------------",
      req.body.job.job_id
    );
    const result = await Donation.create({
      job_id: req.body.job.job_id,
      student_basic_detail_id: studentId,
      student_id: studentObjectId,
      status: "Pending"
    });
    if (result) {
      res.status(201).send(result);
    }
  } catch (err) {
    console.log(err);
    res.status(403).send({
      errors: {
        err: err
      }
    });
  }
});

route.get("/applicants", async (req, res) => {
  console.log("----------getting jobs");
  Decryptedtoken = decryptToken(req.headers.authorization);
  try {
    var companyId;
    await Company.findOne({
      emailId: Decryptedtoken.email
    })
      .then(tokenuser => {
        if (tokenuser) {
          companyId = tokenuser.company_basic_detail_id;
          email = tokenuser.emailId;
          name = tokenuser.company_name;
        } else {
          res.status(403).send({
            errors: {
              err: "Unauthenticated User"
            }
          });
        }
      })
      .catch(err => {
        console.log(`error getting student applicant ${err}`);
      });

    const result = await Fundraiser.find({
      company_basic_detail_id: companyId
    });
    console.log("sending jobs-----------------" + result);
    res.status(201).send({
      result: result
    });
  } catch (err) {
    console.log(`error getting jobs ${err}`);
    res.status(500).send({
      errors: {
        body: err
      }
    });
  }
});

route.get("/applied/:statusFilter", async (req, res) => {
  console.log("----------getting applied jobs");
  Decryptedtoken = decryptToken(req.headers.authorization);
  var studentId;
  var { page, limit } = req.query;
  console.log(parseInt(page, 10));
  var options = {
    page: parseInt(page, 10) || 1,
    limit: parseInt(limit, 10) || 10,
    populate: ["fundraiserId", "companyId"]
  };
  try {
    var whereCondition = {};
    if (req.params.statusFilter !== "empty") {
      whereCondition = {
        ...whereCondition,
        status: req.params.statusFilter
      };
    }

    await Donor.findOne({
      emailId: Decryptedtoken.email
    })
      .then(tokenuser => {
        console.log(tokenuser._id + "in details ------------------------");
        studentId = tokenuser._id;
        email = tokenuser.emailId;
        name = tokenuser.name;
      })
      .catch(err => {
        console.log(`applying for jobs ${err}`);
      });

    const doantionarr = await Donation.paginate(
      {
        donorId: studentId,
        ...whereCondition
      },
      options
    ).then(finalarray => {
      console.log(finalarray);
      res.status(201).send({
        result: finalarray.docs,
        total: finalarray.total
      });
    });
  } catch (err) {
    console.log(`error getting jobs ${err}`);
    res.status(500).send({
      errors: {
        body: err
      }
    });
  }
});

route.get("/:id/students", async (req, res) => {
  console.log("----------getting all students");
  Decryptedtoken = decryptToken(req.headers.authorization);
  try {
    await Company.findOne({
      emailId: Decryptedtoken.email
    })
      .then(tokenuser => {
        if (tokenuser) {
          studentId = tokenuser.company_basic_detail_id;
          email = tokenuser.emailId;
          name = tokenuser.company_name;
        } else {
          res.status(403).send({
            errors: {
              err: "Unauthenticated User"
            }
          });
        }
      })
      .catch(err => {
        console.log(`getting students who applied for this job ${err}`);
      });
    var finalarray = [];
    await Donation.find({
      job_id: req.params.id
    })
      .populate("student_id")
      .then(tokenuser => {
        if (tokenuser) {
          // console.log(tokenuser)
          tokenuser.map(t => {
            finalusereducation = t.student_id.educations.filter(
              e => e.isPrimary == 1
            );
            // console.log(finalusereducation)
            t.student_id.educations = finalusereducation;
            console.log(t);
            finalarray.push(t);
          });
          console.log(finalarray);
        }
        res.send({
          success: true,
          msg: "Successfully fetched student profile",
          msgDesc: finalarray
        });
      });
  } catch (err) {
    console.log(`error getting jobs ${err}`);
    res.status(500).send({
      errors: {
        body: err
      }
    });
  }
});

route.post("/:jobId/:studentId", async (req, res) => {
  try {
    console.log(req.body.company.status);
    Decryptedtoken = decryptToken(req.headers.authorization);
    await Company.findOne({
      emailId: Decryptedtoken.email
    })
      .then(tokenuser => {
        if (tokenuser) {
          console.log(
            tokenuser.company_basic_detail_id +
              "in details ------------------------"
          );
          companyId = tokenuser.company_basic_detail_id;
          email = tokenuser.emailId;
          name = tokenuser.company_name;
        } else {
          res.status(403).send({
            errors: {
              body: "Unauthenticated user"
            }
          });
        }
      })
      .catch(err => {
        console.log(`getting students who applied for this job ${err}`);
      });

    const filter = {
      job_id: req.params.jobId,
      student_basic_detail_id: req.params.studentId
    };
    const update = { status: req.body.company.status };

    await Donation.findOneAndUpdate(filter, update, {
      new: true,
      useFindAndModify: true
    })
      .then(tokenuser => {
        if (tokenuser) res.status(201).send(tokenuser);
        else
          res.status(500).send({
            errors: {
              body: "No match found"
            }
          });
      })
      .catch(err => {
        console.log(err);
        res.status(500).send({
          errors: {
            body: err
          }
        });
      });
  } catch (err) {
    console.log(`error getting jobs ${err}`);
    res.status(500).send({
      errors: {
        body: err
      }
    });
  }
});

module.exports = route;
