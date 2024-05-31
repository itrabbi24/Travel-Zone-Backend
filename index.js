// index.js

const express = require("express");
const cors = require("cors");
const app = express();
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DBUser}:${process.env.DBPass}@cluster0.f7nunbs.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // await client.connect();

    // database name
    const database = client.db("TravelsZone001");

    // table name
    const mainCategoryCollection = database.collection("MainCategory");
    const subCategoryCollection = database.collection("SubCategory");
    const touristDataByUserCollection =
      database.collection("TouristDataByUser");

    //=============== get all main category

    app.get("/main-category", async (req, res) => {
      try {
        const cursor = mainCategoryCollection.find();
        const result = await cursor.toArray();
        res.send(result);
      } catch (error) {
        console.error("Error fetching data:", error);
        res
          .status(500)
          .json({ success: false, message: "Failed to fetch data" });
      }
    });

    //=============== get id by multiple data
    app.get("/main-category/:country", async (req, res) => {
      try {
        const country = req.params.country;
        const sortBy = req.query.sort || "asc";
        const query = { country: country };
        const sortCriteria =
          sortBy === "asc" ? { average_cost: 1 } : { average_cost: -1 };
        const category = await subCategoryCollection
          .find(query)
          .sort(sortCriteria)
          .toArray();
        res.send(category);
      } catch (error) {
        console.error("Error fetching data:", error);
        res.status(500).send("An error occurred while fetching data");
      }
    });

    //================ get single tourist spot data
    app.get("/single-tourist-data-view/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const details = await subCategoryCollection.findOne(query);

        if (!details) {
          return res.status(404).json({ error: "Tourist data not found" });
        }
        res.send(details);
      } catch (error) {
        console.error("Error fetching single tourist data:", error);
        res.status(500).json({ error: "Failed to fetch single tourist data" });
      }
    });

    //================ get all tourist spot

    app.get("/getAllTooristData", async (req, res) => {
      try {
        const cursor = subCategoryCollection.find();
        const sortBy = req.query.sort || "asc"; // Default sorting order is ascending
        const sortCriteria =
          sortBy === "asc" ? { average_cost: 1 } : { average_cost: -1 };
        const result = await cursor.sort(sortCriteria).toArray();
        res.send(result);
      } catch (error) {
        console.error("Error fetching data:", error);
        res
          .status(500)
          .json({ success: false, message: "Failed to fetch data" });
      }
    });

    // ================create tourist data by login user
    app.post("/insertTouristDataByUser", async (req, res) => {
      try {
        const requestBody = req.body;
        console.log(requestBody);
        const result = await touristDataByUserCollection.insertOne(requestBody);
        res.json({ success: true, message: "Insert Success" }); // Sending success response
      } catch (error) {
        console.error("Error Insert:", error);
        res.status(500).json({ success: false, message: "Failed to Insert" }); // Sending error response
      }
    });

    //================ get user wise data
    app.get("/getUserWiseData/:userName", async (req, res) => {
      try {
        const userName = req.params.userName;
        const query = { UserEmail: userName };
        const details = await touristDataByUserCollection.find(query).toArray();

        if (details.length === 0) {
          return res.status(404).json({ error: "Tourist data not found" });
        }
        res.send(details);
      } catch (error) {
        console.error("Error fetching tourist data:", error);
        res.status(500).json({ error: "Failed to fetch tourist data" });
      }
    });

    // ================= update login user own data
    app.put("/updateLoginUserOwnData/:id", async (req, res) => {
      const id = req.params.id;
      const requestBody = req.body;

      console.log(id, requestBody);

      const filter = { _id: new ObjectId(id) };
      const options = {upsert: true}
      const updateFeild = {
          $set: {
              imageURL: requestBody.imageURL,
              countryDropdown: requestBody.countryDropdown,
              tourists_spot_name: requestBody.tourists_spot_name,
              location: requestBody.location,
              short_description: requestBody.short_description,
              average_cost: requestBody.average_cost,
              seasonality: requestBody.seasonality,
              totaVisitorsPerYear: requestBody.totaVisitorsPerYear,            
              travel_time: requestBody.travel_time
          },
      };

      const result = await touristDataByUserCollection.updateOne(
        filter,
        updateFeild,
        options
      );

      res.send(result);
    });


    //============ delete user own data
    app.delete("/deleteUserOwnDataAPI/:id", async (req, res) => {
        const id = req.params.id;
        try {
            const result = await touristDataByUserCollection.deleteOne({ _id: new ObjectId(id) });
            if (result.deletedCount === 1) {
                res.sendStatus(204); // Successfully deleted
            } else {
                res.sendStatus(404); // Item not found
            }
        } catch (error) {
            console.error("Error deleting item:", error);
            res.status(500).json({ error: "Internal server error" });
        }
    });
    

    // app.put("/users/:country", async (req, res) => {
    //     try {
    //         const country = req.params.country;

    //         const filter = { country: country };

    //         // Define the update operation
    //         const updateOperation = {
    //             $set: {
    //                 userName: 'itrabbi24@gmail.com',
    //                 inputDate: new Date()
    //             }
    //         };

    //         // Perform the update operation
    //         const result = await subCategoryCollection.updateMany(filter, updateOperation);

    //         res.send(result);
    //     } catch (error) {
    //         console.error('Error updating documents:', error);
    //         res.status(500).send('Internal Server Error');
    //     }
    // });

    // await client.db("admin").command({ ping: 1 });
    // console.log(
    //   "Pinged your deployment. You successfully connected to MongoDB!"
    // );
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
  }
}

run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Server Is Running");
});

app.listen(port, (req, res) => {
  console.log(`simple app is running, ${port}`);
});
