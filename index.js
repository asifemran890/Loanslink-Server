require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const port = process.env.PORT || 3000;
const app = express();
app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:5174"],
    credentials: true,
    optionSuccessStatus: 200,
  })
);
app.use(express.json());

const client = new MongoClient(process.env.MONGODB_URI, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    const db = client.db("LoanLink");
    const loansCollection = db.collection("loans");
    const UsersCollection = db.collection("users");
    const LoanApplicationCollection = db.collection("loanapplication");

    // GET all loans
    app.get("/loans", async (req, res) => {
      const loans = await loansCollection.find().toArray();
      res.send(loans);
    });
    app.get("/loanapplication", async (req, res) => {
      const loan = await LoanApplicationCollection.find().toArray();
      res.send(loan);
    });

    // get 1 loans from db
    app.get("/loans/:id", async (req, res) => {
      const id = req.params.id;
      const result = await loansCollection.findOne({ _id: new ObjectId(id) });
      res.send(result);
    });
    // latest loans
    app.get("/latest-loans", async (req, res) => {
      const cursor = loansCollection.find().sort({ created_at: -1 }).limit(6);
      const result = await cursor.toArray();
      res.send(result);
    });

    // POST new loan
    app.post("/loans", async (req, res) => {
      const loanData = req.body;
      const result = await loansCollection.insertOne(loanData);
      res.send(result);
    });

    // save or update a user in db
    app.post("/user", async (req, res) => {
      const userData = req.body;
      console.log(userData);
      res.send(userData);
      userData.created_at = new Date().toISOString();
      userData.last_loggedIn = new Date().toISOString();
      userData.role = "custome";
      const query = {
        email: userData.email,
      };
      const alreadyExists = await UsersCollection.findOne(query);
      console.log("User Already Exists---> ", !!alreadyExists);
      if (alreadyExists) {
        console.log("Updating user info......");
        const result = await UsersCollection.updateOne(query, {
          $set: {
            last_loggedIn: new Date().toISOString(),
          },
        });
        return res.send(result);
      }

      console.log("Saving new user info......");
      const result = await UsersCollection.insertOne(userData);
      res.send(result);
    });

    // get a user's role
    app.get("/user/role/:email", async (req, res) => {
      const email = req.params.email;
      const result = await UsersCollection.findOne({ email });
      res.send({ role: result?.role });
    });
    //loan application
    app.post("/loanapplication", async (req, res) => {
      const userLoanData = req.body;
      console.log(userLoanData);
      res.send(userLoanData);
      userLoanData.Status = "Pending";
      userLoanData.ApplicationFeeStatus = "unpaid";
      // const query = {
      //   email: userLoanData.email,
      // };
      // const alreadyExists = await LoanApplicationCollection.findOne(query);
      // console.log("User Already Exists---> ", !!alreadyExists);
      // if (alreadyExists) {
      //   console.log("Updating user info......");
      //   const result = await LoanApplicationCollection.updateOne(query, {});
      //   return res.send(result);
      // }
      console.log("Saving new user info......");
      const result = await LoanApplicationCollection.insertOne(userLoanData);
      res.send(result);
    });
  } catch (error) {
    console.error(error);
  }
}

run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("LoanLink Backend Working");
});

app.listen(port, () => console.log(`Server running on port ${port}`));
