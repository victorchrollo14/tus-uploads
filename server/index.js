const { Server } = require("@tus/server");
const { FileStore } = require("@tus/file-store");
const express = require("express");
const cors = require("cors");

const host = "127.0.0.1";
const port = 4000;
const app = express();
const uploadApp = express();

const server = new Server({
  path: "/uploads",
  datastore: new FileStore({ directory: "./files" }),
});

uploadApp.all("*", server.handle.bind(server));

// Enable CORS
app.use(cors({ origin: "*" }));
uploadApp.use(cors({ origin: "*" }));

app.use("/uploads", uploadApp);
app.listen(port, host);
console.log("running on port" + port);
