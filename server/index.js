// this file is a copy of server.js
// vercel requires the entry point to be called index.js, hence you should make this file available for production/deployment on vercel

// the way it works now is that it checks if the NODE_ENV is production or development from '.env'
// if it is production, it will use the .env file, which in the source code only contains the NODE_ENV variable
// vercel adds its own environment variables, so you don't need to add them in the .env file
// otherwise if its in development, it will use the .env.development file
// so .env.production is useless until we migrate to another host other than vercel

const dns = require("dns");
dns.setServers(["1.1.1.1", "8.8.8.8"]);


console.log('NODE_ENV: ' + require('dotenv').config({ path: `.env` }).parsed.NODE_ENV)

if (process.env.NODE_ENV === 'production') {
  require('dotenv').config({ path: `.env` })
}
else {
  require('dotenv').config({ path: `.env.${process.env.NODE_ENV}` })
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
const port = 2000;

const Tournament = require("./models/tourneyModels"); // your tournaments model file name
const { createTournaments } = require("./scripts/generateTestTournaments");
const { createUsers } = require("./scripts/generateTestUsers");


//middleware
app.use(express.json());
app.use((req, res, next) => {
  console.log(req.path, req.method);
  next();
});
// app.use(cors({ origin: `${process.env.FRONTEND_URL}`, credentials: true }));
app.use(cors({
  origin: true,
  credentials: true
}));

app.options("*", cors({
  origin: true,
  credentials: true
}));


console.log(`FRONTEND_URL: ${process.env.FRONTEND_URL}`)
app.use(cookieParser());

//route
app.use("/api/tournement", touneyRoute);
app.use("/api/user", userRoute);
app.use("/api/purchase", purchaseRoute);
app.use("/api/team", teamRoute);
app.use("/api/admin", adminRoute);

app.all("*", (req, res) => {
  return;
});

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
  .connect(`${process.env.DATABASE_URL}`)
  .then(async () => {
    await seedTestDataIfTournamentsEmpty();

    app.listen(port, () => {
      console.log(`Server running on http://localhost:${port}`);
    });
  })
  .catch((error) => {
    console.log(error);
  });

