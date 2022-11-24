const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const jwt = require("jsonwebtoken");
require("dotenv").config();
const port = process.env.PORT || 5000;
app.use(cors());
app.use(express.json());
//......... MongoDb Integration........//
const url = process.env.DB_URL;
const client = new MongoClient(url, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});
async function runRellerDb() {
  try {
    console.log("db connected");
    const categoriesItemCollection = client
      .db("reseller-market")
      .collection("categories-item");
    const userCollection = client.db("reseller-market").collection("users");
    app.get("/category", async (req, res) => {
      const query = {};
      const result = await categoriesItemCollection
        .find(query)
        .project({ brand: 1 })
        .toArray();
      res.send(result);
    });
    app.get("/categoriesItem", async (req, res) => {
      const brand = req.query.brand;
      const query = { brand: brand };
      const result = await categoriesItemCollection.find(query).toArray();
      res.send(result);
    });
    app.get("/categoriesItemDetails/:id", async (req, res) => {
      const id = req.params.id;
      const result = await categoriesItemCollection.findOne({
        _id: ObjectId(id),
      });
      res.send(result);
    });
    app.post("/users", async (req, res) => {
      const user = req.body;
      const result = await userCollection.insertOne(user);
      res.send(result);
    });
    app.get('/users/admin/:email',async(req,res)=>{
      const email = req.params.email
      const query = {email:email}
      const user = await userCollection.findOne(query)
      res.send({isAdmin: user?.account === 'admin'})
    })
    app.get('/users/seller/:email',async(req,res)=>{
      const email = req.params.email
      const query = {email:email}
      const user = await userCollection.findOne(query)
      res.send({isSeller: user?.account === 'seller'})
    })
    app.get('/users/user',async(req,res)=>{
      const account = req.query.account
      const query = {account: account}
      const result = await userCollection.find(query).toArray()
      res.send(result)
    })
    app.get('/users/seller',async(req,res)=>{
      const account = req.query.account
      const query = {account: account}
      const result = await userCollection.find(query).toArray()
      res.send(result)
    })
    app.get("/jwt", async (req, res) => {
      const email = req.query.email;
      const filter = { email: email };
      const user = await userCollection.findOne(filter);
      if (user) {
        const token = jwt.sign({email}, process.env.ACCESS_TOKEN, {
          expiresIn: "1d",
        });
        return res.send({
          success: true,
          accessToken: token,
        });
      }
      res.send({status:'unAuthorized Access'})
    });
  } finally {
  }
}
runRellerDb().catch((err) => console.log(err));
app.get("/", (req, res) => {
  res.send(`reseller market is running`);
});
app.listen(port, () => {
  console.log(`Reseller market is running on ${port}`);
});
