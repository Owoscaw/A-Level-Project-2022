const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const fs = require("fs");
const app = express();
const port = 9000;

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors());

app.post("/", (request, response) => {
    let requestJson = request.body;
    fs.writeFile("data.json", JSON.stringify(requestJson), "utf8", () => {
        response.setHeader("Content-Type", "application/json");
        response.send("Computing");
    });
});

app.listen(port, () => {
    console.log(`server listening on port ${port}`);
});