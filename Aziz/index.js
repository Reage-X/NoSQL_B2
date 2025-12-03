import express from "express";
import { connect } from "./config/mongoClient.js";

const app = express();
app.use(express.json());

let events, incidents, services;

app.locals.start = (async () => {
  const db = await connect();
  events = db.collection("events");
  incidents = db.collection("incidents");
  services = db.collection("services");
})();

app.get("/", (req, res) => res.send("API Paris City"));

app.listen(3000, () => console.log("Serveur lancé sur http://localhost:3000"));
