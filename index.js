const dns = require("node:dns");
dns.setServers(["1.1.1.1", "8.8.8.8"]);
const express = require("express");
const app = express();
const dotenv = require("dotenv");
const cors = require("cors");
dotenv.config();
const PORT = process.env.PORT;
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const { createRemoteJWKSet, jwtVerify } = require("jose-cjs");
app.use(cors());
app.use(express.json());
const uri = process.env.DB_URI;
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});
const JWKS = createRemoteJWKSet(new URL("http://localhost:3000/api/auth/jwks"));
const verifyToken = async (req, res, next) => {
  const headers = req?.headers.authorization;
  if (!headers) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  const token = headers.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  try {
    const { payload } = await jwtVerify(token, JWKS);
    console.log(payload);
    next();
  } catch (error) {
    return res.status(403).json({ message: "Forbidden" });
  }
};
async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    const db = client.db("CarRent");
    const carCollection = db.collection("car");
    const bookingCollection = db.collection("booking");
    //Car related API

    app.post("/car", async (req, res) => {
      const carData = req.body;
      console.log(carData);
      const result = await carCollection.insertOne(carData);
      res.send(result);
    });

    app.get("/car", async (req, res) => {
      const result = await carCollection.find().toArray();
      res.send(result);
    });

    app.get("/car/:id", async (req, res) => {
      const { id } = req.params;
      const _id = new ObjectId(id);
      const result = await carCollection.findOne(_id);
      res.send(result);
    });
    app.delete("/car/:userId", async (req, res) => {
      const userId = req.params;
      console.log(userId);

      const result = await carCollection.deleteOne(userId);
      res.send(result);
    });

    app.patch("/car/:userId", async (req, res) => {
      const userId = req.params;
      const updateData = req.body;
      const result = await carCollection.updateOne(userId, {
        $set: updateData,
      });
      res.send(result);
    });
    //Booking related API
    app.post("/booking", verifyToken, async (req, res) => {
      const bookingData = req.body;
      const result = await bookingCollection.insertOne(bookingData);
      res.send(result);
    });

    app.get("/booking/:userId", verifyToken, async (req, res) => {
      const userId = req.params;

      const result = await bookingCollection.find(userId).toArray();
      res.send(result);
    });

    app.delete("/booking/:bookingId", verifyToken, async (req, res) => {
      const { bookingId } = req.params;
      const result = await bookingCollection.deleteOne({
        _id: new ObjectId(bookingId),
      });
      res.send(result);
    });
    app.patch("/booking/:bookingId", verifyToken, async (req, res) => {
      const { bookingId } = req.params;
      const updateData = req.body;
      const result = await bookingCollection.updateOne(
        { _id: new ObjectId(bookingId) },
        { $set: updateData },
      );
      res.send(result);
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!",
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);
app.get("/", (req, res) => {
  res.send("Server is running");
});
app.listen(PORT, (req, res) => {
  console.log(`Server running on port ${PORT}`);
});
