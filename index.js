require("dotenv").config();
const express = require("express");
const usdcRoutes = require("./routes/usdcRoutes");

const app = express();
const cors = require("cors");

app.use(cors());

app.use(express.json());
app.use("/api", usdcRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
