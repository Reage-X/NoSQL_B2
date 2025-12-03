import fs from "fs";
import { connect } from "../config/mongoClient.js";

async function seed() {
  const db = await connect();

  const events = JSON.parse(fs.readFileSync("./data/events.json"));
  const incidents = JSON.parse(fs.readFileSync("./data/incidents.json"));
  const services = JSON.parse(fs.readFileSync("./data/services.json"));

  await db.collection("events").deleteMany({});
  await db.collection("events").insertMany(events);

  await db.collection("incidents").deleteMany({});
  await db.collection("incidents").insertMany(incidents);

  await db.collection("services").deleteMany({});
  await db.collection("services").insertMany(services);

  console.log("🎉 Base de données initialisée !");
  process.exit();
}

seed();
