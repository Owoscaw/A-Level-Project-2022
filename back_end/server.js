const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const fs = require("fs");
const { execFile } = require("child_process");

const app = express();
const port = 9000;

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors());

app.post("/", (request, response) => {
    response.setHeader("Content-Type", "application/json");
    let requestJson = request.body;
    console.log("test");
    fs.writeFile("./data.json", JSON.stringify(requestJson, null, 4), "utf8", () => {

        let graphPromise = new Promise((resolve, reject) => {

            execFile("./solveTSP.exe", [], (error, data, dataError) => {
                if(error || (data.includes("solution not found"))){
                    reject(error, dataError);
                } else {
                    resolve(data);
                }
            });
        });

        graphPromise.then((resolve) => {
            console.log(resolve);

            fs.readFile("./data.json", "utf8", (err, data) => {
                if(err){
                    response.send({
                        message: "Failed to read path",
                        data: null
                    });
                    return;
                } else {
                    response.send({
                        message: "Path found",
                        data: JSON.parse(data)
                    });
                    return;
                }
            });
        }, (reject, rejectData) => {
            console.log(reject, rejectData);
            response.send({
                message: "Error finding path",
                data: null
            });
            return;
        });
    });

    return;
});

app.listen(port, () => {
    console.log(`server listening on port ${port}`);
});