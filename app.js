require("dotenv").config();

const path = require("path");
const express = require("express");
const appConfig = require("./config/appConfig");
const { ensureDatabase } = require("./config/database");
const ensureTables = require("./config/initDatabase");
const { storeRsvp } = require("./controllers/rsvpController");
const webRoutes = require("./routes/webRoutes");
const apiRoutes = require("./routes/apiRoutes");

const app = express();

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
app.use("/vendor/bootstrap", express.static(path.join(__dirname, "node_modules/bootstrap/dist")));
app.use("/vendor/bootstrap-icons", express.static(path.join(__dirname, "node_modules/bootstrap-icons/font")));
app.use("/vendor/fonts/dm-sans", express.static(path.join(__dirname, "node_modules/@fontsource/dm-sans/files")));
app.use("/vendor/fonts/playfair-display", express.static(path.join(__dirname, "node_modules/@fontsource/playfair-display/files")));

app.use("/", webRoutes);
app.use("/api", apiRoutes);
app.post("/rsvp", storeRsvp);

app.use((error, req, res, next) => {
  console.error(error);
  if (req.path.startsWith("/api") || req.path === "/rsvp") {
    return res.status(500).json({ message: "Terjadi kendala pada server." });
  }
  res.status(500).send("Terjadi kendala pada server.");
});

ensureDatabase()
  .then(ensureTables)
  .then(() => {
    app.listen(appConfig.port, () => {
      console.log(`Server berjalan di http://localhost:${appConfig.port}`);
    });
  })
  .catch((error) => {
    console.error("Gagal menyiapkan database:", error.message || error.code || error);
    process.exit(1);
  });
