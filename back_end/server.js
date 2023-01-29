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



const readPrev = (callback) => {
    fs.readFile("./prevData.json", "utf8", (error, data) => callback(error, data));
}

const writePrev = (data, callback) => {
    fs.writeFile("./prevData.json", JSON.stringify(data, null, 4), "utf8", callback);
}



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
                message: "Graph error",
                data: null
            });
            return;
        });
    });

    console.log("calculation successful");
});



app.post("/save", (request, response) => {
    response.setHeader("Content-Type", "application/json");
    let newSolution = request.body;

    readPrev((error, data) => {
        if(error){
            response.send({
                message: "Error reading solutions"
            });
            return;
            
        } else {
            let solutionJson = JSON.parse(data);
            solutionJson.solutions.push(newSolution);
            
            writePrev(solutionJson, () => {
                response.send({
                    message: "Saved solution"
                });
                return;
            });
        }
    });
    console.log("save sucessful");
});



app.post("/delete-route", (request, response) => {

    response.setHeader("Content-Type", "application/json");
    let routeName = request.body.name;

    readPrev((error, data) => {
        let newData = JSON.parse(data).solutions.filter(route => (route.name !== routeName));

        if(error){
            response.send({
                message: "Removal failed"
            });
            return;
        }

        writePrev({solutions: newData}, () => {
            response.send({
                message: "Removal OK"
            });
        });
    });
    console.log("deletion successful");
});



app.post("/rename-route", (request, response) => {

    response.setHeader("Content-Type", "application/json");
    
    readPrev((error, data) => {
        if(error){
            response.send({
                message: "Rename failed"
            });
            return
        }

        let newData = JSON.parse(data).solutions.map(route => {
            if(route.name === request.body.oldName){
                return ({
                    ...route,
                    name: request.body.newName
                });
            } else {
                return route;
            }
        });

        writePrev({solutions: newData}, () => {
            response.send({
                message: "Rename OK"
            });
        });
    });
    console.log("rename sucessful");
});


app.get("/clear", (request, response) => {
    response.setHeader("Content-Type", "application/json");

    writePrev({solutions: []}, () => {
        response.send({
            message: "Solution cleared"
        });
        return;
    });
    console.log("cleared solutions");
});



app.get("/load", (request, response) => {
    response.setHeader("Content-Type", "application/json");

    readPrev((error, data) => {
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
    console.log("loaded solutions");
});



app.listen(port, () => {
    console.log(`server listening on port ${port}`);
});