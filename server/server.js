// the way it works now is that it checks if the NODE_ENV is production or development from '.env'
// if it is production, it will use the .env file, which in the source code only contains the NODE_ENV variable
// vercel adds its own environment variables, so you don't need to add them in the .env file
// otherwise if its in development, it will use the .env.development file
// so .env.production is useless until we migrate to another host other than vercel
console.log('NODE_ENV: ' + require('dotenv').config({ path: `.env` }).parsed.NODE_ENV)

if(process.env.NODE_ENV === 'production') {
  console.log('Production')
  require('dotenv').config({ path: `.env` })
}
else {
  console.log('Development')
  require('dotenv').config({ path: `.env.${process.env.NODE_ENV}` })
}

console.log('index.js FRONTEND_URL: ' + process.env.FRONTEND_URL)

const express = require("express");
const cors = require("cors");
const app = express();
const touneyRoute = require("./routes/tourneyRoutes");
const userRoute = require("./routes/userRoutes");
const purchaseRoute = require("./routes/purchaseRoutes");
const teamRoute = require("./routes/teamRoutes");
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
console.log(`FRONTEND_URL: ${process.env.FRONTEND_URL}`)
app.use(cookieParser());

//route
app.use("/api/tournement", touneyRoute);
app.use("/api/user", userRoute);
app.use("/api/purchase", purchaseRoute);
app.use("/api/team", teamRoute);

app.all("*", (req, res) => {
  return;
});

mongoose
  .connect(
    `${process.env.DATABASE_URL}`
  )
  .then(() => {
    app.listen(port, () => {
      console.log(`Server running on http://localhost:${port}`);
    });
  })
  .catch((error) => {
    console.log(error);
  });
