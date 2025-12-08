const express = require("express");
const app = express();
const PORT = 5000;
const connectDb = require("./utils/db");
require("dotenv").config();
const cors = require("cors");
const authRoute = require("./Router/auth-router");
// const productRoutes = require("./Router/product-router");
// const adminRoute = require('./Router/admin-router');
// const contactRoute = require('./Router/contact-router');
// const BuyRoute = require('./Router/Buy-router');
// const AddCard = require('./Router/AddCard');

const corsOptions = {
    origin:"http://localhost:3000",
    methods:"GET,POST,PUT,DELETE,PATCH,HEAD",
    credentials:true,
};
app.use(cors(corsOptions));
app.use(express.json());
app.use("/api/auth",authRoute);
// app.use("/api/products",productRoutes);
// app.use("/api/admin",adminRoute);
// app.use("/api/form",contactRoute);
// app.use("/api/orders",BuyRoute);
// app.use("/api/Addcard",AddCard)
connectDb().then(()=>{
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
})
.catch((error)=>{
    console.log(`Database connection failed: ${error.message}`);
});