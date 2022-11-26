const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY)
const app = express();
const jwt = require("jsonwebtoken");

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
    const bookingCollection = client
      .db("reseller-market")
      .collection("booking");
    app.post("/booking", async (req, res) => {
      const result = await bookingCollection.insertOne(req.body);
      res.send(result);
    });
    app.get("/booking", async (req, res) => {
      const email = req.query.email;
      const result = await bookingCollection.find({ email: email }).toArray();
      res.send(result);
    });
    app.post("/create-payment-intent", async (req, res) => {
      const order = req.body;
      const { price } = order;
      const amount = parseFloat(price) * 100;
      const paymentIntent = await stripe.paymentIntents.create({
        currency:'usd',
        amount:amount,
        "payment_method_types":[
          "card"
        ]
      })
      res.send({
        clientSecret: paymentIntent.client_secret,
      });
    });
    app.get("/booking/:id", async (req, res) => {
      const id = req.params.id;
      const result = await bookingCollection.findOne({ _id: ObjectId(id) });
      res.send(result);
    });
    app.get("/category", async (req, res) => {
      const result = await categoriesItemCollection.find({}).toArray();
      const newItem = [...new Set(result.map((item) => item.brand))];
      res.send(newItem);
    });
    app.get("/categoriesItem", async (req, res) => {
      const brand = req.query.brand;
      const query = { brand: brand };
      const result = await categoriesItemCollection.find(query).toArray();

      res.send(result);
    });
    app.get("/allItem", async (req, res) => {
      const result = await categoriesItemCollection.find({}).toArray();
      res.send(result);
    });
    app.put("/users/seller/:email", async (req, res) => {
      const { email } = req.params;
      const status = req.body.status;
      const updateStatus = {
        $set: {
          status: status,
        },
      };
      const result = await userCollection.updateOne(
        { email: email },
        updateStatus
      );
      res.send(result);
    });
    app.put("/products/:id", async (req, res) => {
      const { id } = req.params;
      const status = req.body.status;
      const updateStatus = {
        $set: {
          status: status,
        },
      };
      const result = await categoriesItemCollection.updateOne(
        { _id: ObjectId(id) },
        updateStatus
      );
      res.send(result);
    });
    app.get("/categoriesItemDetails/:id", async (req, res) => {
      const id = req.params.id;
      const result = await categoriesItemCollection.findOne({
        _id: ObjectId(id),
      });
      res.send(result);
    });
    app.post("/addCategoryItem", async (req, res) => {
      const filter = req.body;
      const result = await categoriesItemCollection.insertOne(filter);
      res.send(result);
    });
    app.get("/myProducts", async (req, res) => {
      const email = req.query.email;
      const query = { email: email };
      const result = await categoriesItemCollection.find(query).toArray();
      res.send(result);
    });
    app.delete("/myProducts/:id", async (req, res) => {
      const id = req.params.id;
      const result = await categoriesItemCollection.deleteOne({
        _id: ObjectId(id),
      });
      res.send(result);
    });
    app.delete("/users/:id", async (req, res) => {
      const id = req.params.id;
      const result = await userCollection.deleteOne({ _id: ObjectId(id) });
      res.send(result);
    });
    app.post("/users", async (req, res) => {
      const user = req.body;
      const result = await userCollection.insertOne(user);
      res.send(result);
    });
    app.get("/users/admin/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const user = await userCollection.findOne(query);
      res.send({ isAdmin: user?.account === "admin" });
    });
    app.get("/users/verified/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const user = await userCollection.findOne(query);
      res.send({ isVerified: user?.status === "Verified" });
    });
    app.get("/users/seller/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const user = await userCollection.findOne(query);
      res.send({ isSeller: user?.account === "seller" });
    });
    app.get("/users/user", async (req, res) => {
      const account = req.query.account;
      const query = { account: account };
      const result = await userCollection.find(query).toArray();
      res.send(result);
    });
    app.get("/users/seller", async (req, res) => {
      const account = req.query.account;
      const query = { account: account };
      const result = await userCollection.find(query).toArray();
      res.send(result);
    });
    app.get("/jwt", async (req, res) => {
      const email = req.query.email;
      const filter = { email: email };
      const user = await userCollection.findOne(filter);
      if (user) {
        const token = jwt.sign({ email }, process.env.ACCESS_TOKEN, {
          expiresIn: "1d",
        });
        return res.send({
          success: true,
          accessToken: token,
        });
      }
      res.send({ status: "unAuthorized Access" });
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
