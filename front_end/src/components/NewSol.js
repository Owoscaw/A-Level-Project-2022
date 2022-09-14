import React from "react";
import { useState } from "react";


import NetworkDisplay from "./NetworkDisplay";
import BetterMap from "./BetterMap";
import "../styles/newSol.css";

let startNode;
let currentNodes = [];
let activeNodes = [];
const possibleIcons = ["markerIcon1.jpg", "markerIcon2.jpg", "markerIcon3.jpg"];
const googleColours = ["66, 133, 244", "234, 67, 53", "251, 188, 5", "52, 168, 83"];

function NewSol(props){

  const [ coverIsOn, setCover ] = useState(false);

  const calculateSol = () => {
    setCover(true);
  };

  const cancelSol = () => {
    setCover(false);
  };

  const activateNode = (node) => {
    activeNodes.push(node);
    console.log("node activated");
  };

  const addNode = (node) => {
    currentNodes.push(node);
    console.log(currentNodes);
  };

  return (
    <div id="newSolution">
      <div id="UpperPage">
        <BetterMap addNode={addNode} activateNode={activateNode} />
        <div id="nodeMenu">
          <div id="headOfNodes">
            Node Menu
          </div>
          <div id="divOfNodes">
            <ul id="listOfNodes"></ul>
          </div>
        </div>
      </div>

      <div id="LowerPage">
        <input id="backButton" type="button" value="Back" onClick={() => props.changeScreen("menu")}/>

        <div id="startNodeNameDiv">
          <div id="startNodeHead">
            Starting Node:
          </div>
          <div id="startNodeName">
            None
          </div>
        </div>

        <div id="statusDiv">
          <div id="statusHead">
            Status:
          </div>
          <div id="statusContent">
            Add more than two nodes
          </div>
        </div>

        <input id="calculateButton" type="button" value="Calculate" onClick={calculateSol}/>
      </div>

      {coverIsOn ? <NetworkDisplay onCancel={cancelSol}/> : null}

      <script async src="https://maps.googleapis.com/maps/api/js?key=AIzaSyA4JxaRwAQ18Zvjyxy1CAkuSxKjGpGLzws" defer></script>
      <script src="https://code.createjs.com/1.0.0/createjs.min.js"></script>
    </div>
  );
}





export default NewSol;