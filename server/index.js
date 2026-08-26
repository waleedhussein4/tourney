// Vercel requires the serverless entry point to be named index.js.

const dns = require("dns");
dns.setServers(["1.1.1.1", "8.8.8.8"]);

// Loads, validates, and normalises the environment. A missing or malformed
// required variable stops the server here, naming what is wrong.
let config;
try {
  config = require("./src/config/env");
} catch (error) {
  console.error(error.message);
  process.exit(1);
}

const express = require("express");
const cors = require("cors");
const app = express();
const touneyRoute = require("./routes/tourneyRoutes");
const userRoute = require("./routes/userRoutes");
const purchaseRoute = require("./routes/purchaseRoutes");
const teamRoute = require("./routes/teamRoutes");
const adminRoute = require("./routes/adminRoutes");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const port = config.port;

const Tournament = require("./models/tourneyModels"); // your tournaments model file name
const { createTournaments } = require("./scripts/generateTestTournaments");
const { createUsers } = require("./scripts/generateTestUsers");


//middleware
app.use(express.json());
app.use((req, res, next) => {
  console.log(req.path, req.method);
  next();
});
app.use(cors({
  origin: true,
  credentials: true
}));

app.options("*", cors({
  origin: true,
  credentials: true
}));


app.use(cookieParser());

//route
app.use("/api/tournement", touneyRoute);
app.use("/api/user", userRoute);
app.use("/api/purchase", purchaseRoute);
app.use("/api/team", teamRoute);
app.use("/api/admin", adminRoute);

app.all("*", (req, res) => res.sendStatus(404));


async function seedTestDataIfTournamentsEmpty() {
  const count = await Tournament.countDocuments();

  if (count === 0) {
    console.log("No tournaments found — seeding test users + tournaments...");

    // tournaments script needs non-admin users first :contentReference[oaicite:0]{index=0}
    await createUsers();        // :contentReference[oaicite:1]{index=1}
    await createTournaments();  // :contentReference[oaicite:2]{index=2}

    console.log("✅ Seed complete.");
  } else {
    console.log(`Tournaments already exist (${count}) — skipping seed.`);
  }
}


mongoose
  .connect(config.mongodbUri)
  .then(async () => {
    await seedTestDataIfTournamentsEmpty();

    app.listen(port, () => {
      console.log(`Server running on http://localhost:${port}`);
    });
  })
  .catch((error) => {
    console.log(error);
  });

