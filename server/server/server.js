require('dotenv').config();
console.log(process.env.SECRET);
const express = require('express');
const cors = require('cors');
const app = express();
const touneyRoute = require('./routes/tourneyRoutes');
const userRoute = require('./routes/userRoutes');
const purchaseRoute = require('./routes/purchaseRoutes')
//const teamRoute = require('./routes/teamRoutes');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser')
const port = 2000;

//middleware
app.use(express.json())
app.use((req,res,next) => {
    console.log(req.path, req.method)
    next()
});
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(cookieParser())

//route
app.use('/api/tournement',touneyRoute);
app.use('/api/user',userRoute);
app.use('/api/purchase', purchaseRoute)
//app.use('/api',teamRoute);

mongoose.connect('REDACTED_MONGODB_URI')
.then(()=>{
    app.listen(port,()=>{
    console.log(`Server running on http://localhost:${port}`)
    });
})
.catch((error)=>{
    console.log(error)
})




