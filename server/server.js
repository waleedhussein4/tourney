require('dotenv').config({ path: `.env.${process.env.NODE_ENV}` })

const express = require("express");
const cors = require("cors");
const app = express();
const touneyRoute = require("./routes/tourneyRoutes");
const userRoute = require("./routes/userRoutes");
const purchaseRoute = require("./routes/purchaseRoutes");
const teamRoute = require("./routes/teamRoutes");
const creditRoute = require("./routes/creditRoutes");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const port = 2000;

//middleware
app.use(express.json());
app.use((req, res, next) => {
  console.log(req.path, req.method);
  next();
});
app.use(cors({ origin: `${process.env.FRONTEND_URL}`, credentials: true }));
app.use(cookieParser());

//route
app.use("/api/tournement", touneyRoute);
app.use("/api/user", userRoute);
app.use("/api/purchase", purchaseRoute);
app.use("/api/team", teamRoute);
app.use("/api/credit", creditRoute);

app.all("*", (req, res) => {
  return;
});

mongoose
  .connect(
    "REDACTED_MONGODB_URI"
  )
  .then(() => {
    app.listen(port, () => {
      console.log(`Server running on http://localhost:${port}`);
    });
  })
  .catch((error) => {
    console.log(error);
  });
