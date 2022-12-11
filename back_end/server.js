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

app.post("/calculate", (request, response) => {
    response.setHeader("Content-Type", "application/json");
    let requestJson = request.body;
    fs.writeFile("./data.json", JSON.stringify(requestJson, null, 4), "utf8", () => {

        let graphPromise = new Promise((resolve, reject) => {

            execFile("./TSPsolver.exe", (error, data, dataError) => {
                console.log(data, error, dataError);
                if(data.includes("solution found")){
                    resolve(data);
                } else {
                    reject(data);
                }
            });
        });

        graphPromise.then((resolve) => {

            fs.readFile("./data.json", "utf8", (err, data) => {
                if(err){
                    response.send({
                        message: "Failed to write path",
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
        }, (reject) => {
            response.send({
                message: "Internal error",
                data: null
            });
            return;
        });
    });

    return;
});

app.post("/save", (request, response) => {
    response.setHeader("Content-Type", "application/json");
    let newSolution = request.body;
    fs.readFile("./prevData.json", (error, data) => {
        if(error){
            response.send({
                message: "Error reading solutions"
            });
            return;

        } else {
            let solutionJson = JSON.parse(data);
            solutionJson.solutions.push(newSolution);

            fs.writeFile("./prevData.json", JSON.stringify(solutionJson, null, 4), "utf-8", () => {
                response.send({
                    message: "Saved solution"
                });
                return;
            });
        }
    });
});

app.get("/clear", (request, response) => {
    response.setHeader("Content-Type", "application/json");
    fs.writeFile("./prevData.json", JSON.stringify({solutions: []}, null, 4), "utf-8", () => {
        response.send({
            message: "Solution cleared"
        });
        return;
    });
});

app.get("/load", (request, response) => {
    response.setHeader("Content-Type", "application/json");
    fs.readFile("./prevData.json", (error, data) => {
        if(error){
            response.send({
                message: "Error reading solutions",
                data: null
            });
            return;
        } else {
            response.send({
                message: "Solution read successful",
                data: JSON.parse(data).solutions
            });
            return;
        }
    });
});

app.listen(port, () => {
    console.log(`server listening on port ${port}`);
});