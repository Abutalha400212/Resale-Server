const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const port = process.env.PORT || 5000;
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const app = express();

app.use(cors());
app.use(express.json());
//......... MongoDb Integration........//
const url = process.env.DB_URL;
const client = new MongoClient(url, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});
function JWTVerifyToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send("UnAuthorized Access");
  }
  const token = authHeader.split(" ")[1];
  jwt.verify(token, process.env.ACCESS_TOKEN, (err, decoded) => {
    if (err) {
      return res.send({ message: "Forbidden Access" });
    }
    req.decoded = decoded;
    next();
  });
}
async function runRellerDb() {
  try {
    // Database Collection //
    console.log("db connected");
    const categoriesItemCollection = client
      .db("reseller-market")
      .collection("categories-item");
    const userCollection = client.db("reseller-market").collection("users");
    const bookingCollection = client
      .db("reseller-market")
      .collection("booking");
    const paymentsCollection = client
      .db("reseller-market")
      .collection("payments");
    const advertiseCollection = client
      .db("reseller-market")
      .collection("advertise");
    const wishlistCollection = client
      .db("reseller-market")
      .collection("wishlist");

    const verifySeller = async (req, res, next) => {
      const decodedEmail = req.decoded.email;
      const query = { email: decodedEmail };
      const user = await userCollection.findOne(query);
      if (user?.account !== "seller") {
        return res.send("Fobidden Access");
      }
      next();
    };
    app.post("/booking", JWTVerifyToken, async (req, res) => {
      const result = await bookingCollection.insertOne(req.body);
      res.send(result);
    });
    app.get("/advertise", async (req, res) => {
      const items = await advertiseCollection.find({}).toArray();
      const results = items.filter((obj) => {
        return !obj.status;
      });
      res.send(results);
    });
    app.post("/advertise", async (req, res) => {
      const filter = req.body;
      const query = {
        Cellphone: filter.Cellphone,
        _id: filter._id,
      };
      const alreadyBooked = await advertiseCollection.find(query).toArray();
      if (alreadyBooked.length) {
        return res.send({
          success: false,
          message: `Already Booked `,
        });
      }
      const result = await advertiseCollection.insertOne(filter);
      if (result.insertedId) {
        res.send({
          success: true,
        });
      }
    });
    app.post("/payments", JWTVerifyToken, async (req, res) => {
      const result = await paymentsCollection.insertOne(req.body);
      res.send(result);
    });
    app.get("/booking", JWTVerifyToken, async (req, res) => {
      const email = req.query.email;
      const query = { email: email };
      const result = await bookingCollection.find(query).toArray();
      res.send(result);
    });
    app.post("/create-payment-intent", JWTVerifyToken, async (req, res) => {
      const order = req.body;
      const { price } = order;
      console.log(price);
      const amount = parseFloat(price) * 100;
      const paymentIntent = await stripe.paymentIntents.create({
        currency: "usd",
        amount: amount,
        payment_method_types: ["card"],
      });
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
    app.get("/category/:id", async (req, res) => {
      const { id } = req.params;
      const result = await categoriesItemCollection.findOne({
        _id: ObjectId(id),
      });
      res.send(result);
    });
    app.get("/categoriesItem", async (req, res) => {
      const brand = req.query.brand;
      const query = { brand: brand };
      const result = await categoriesItemCollection.find(query).toArray();

      res.send(result);
    });
    app.put(
      "/users/seller/:email",

      async (req, res) => {
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
      }
    );
    app.put("/products/:id", async (req, res) => {
      const { id } = req.params;
      const status = req.body.status;
      const updateStatus = {
        $set: {
          status: status,
        },
      };
      const result = await bookingCollection.updateOne(
        { _id: ObjectId(id) },
        updateStatus
      );
      res.send(result);
    });

    app.put("/ordersOne/:Cellphone", async (req, res) => {
      const { Cellphone } = req.params;
      const status = req.body.status;
      const updateStatus = {
        $set: {
          status: status,
        },
      };
      const result = await advertiseCollection.updateOne(
        { Cellphone: Cellphone },
        updateStatus
      );
      res.send(result);
    });
    app.put("/ordersTwo/:Cellphone", async (req, res) => {
      const { Cellphone } = req.params;
      const status = req.body.status;
      const updateStatus = {
        $set: {
          status: status,
        },
      };
      const result = await categoriesItemCollection.updateOne(
        { Cellphone: Cellphone },
        updateStatus
      );
      res.send(result);
    });
    app.delete("/orders/:id", async (req, res) => {
      const { id } = req.params;
      const result = await bookingCollection.deleteOne({ _id: ObjectId(id) });
      res.send(result);
    });

    app.post(
      "/addCategoryItem",
      JWTVerifyToken,
      verifySeller,
      async (req, res) => {
        const filter = req.body;
        const result = await categoriesItemCollection.insertOne(filter);
        res.send(result);
      }
    );
    app.get("/myProducts", JWTVerifyToken, async (req, res) => {
      const email = req.query.email;
      const query = { email: email };
      const result = await categoriesItemCollection.find(query).toArray();
      res.send(result);
    });
    app.delete("/myProducts/:id", JWTVerifyToken, async (req, res) => {
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
    app.get("/users/generalUser/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const user = await userCollection.findOne(query);
      res.send({ isUser: user?.account === "user" });
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
    app.post("/wishlist", async (req, res) => {
      const filter = req.body;
      const query = {
        Cellphone: filter.Cellphone,
        _id: filter._id,
      };
      const alreadyBooked = await wishlistCollection.find(query).toArray();
      if (alreadyBooked.length) {
        return res.send({
          success: false,
          message: `Already Booked `,
        });
      }

      const result = await wishlistCollection.insertOne(filter);
      if (result.insertedId) {
        res.send({
          success: true,
        });
      }
    });
    app.get("/wishlist", async (req, res) => {
      const email = req.query.email;
      const items = await wishlistCollection.find({ email: email }).toArray();
      const results = items.filter((obj) => {
        return !obj.status;
      });
      res.send(results);
    });
    app.put("/wishlist/:Cellphone", async (req, res) => {
      const { Cellphone } = req.params;
      const status = req.body.status;
      const updateStatus = {
        $set: {
          status: status,
        },
      };
      const result = await wishlistCollection.updateOne(
        { Cellphone: Cellphone },
        updateStatus
      );
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
