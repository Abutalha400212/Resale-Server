const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
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
