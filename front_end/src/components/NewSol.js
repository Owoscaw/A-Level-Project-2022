import React from "react";
import {Wrapper, Status} from "@googlemaps/react-wrapper";
//import NewNode from "./NewNode";
import InitMap from "./InitMap";

function NewSol(){

  //function to handle back button presses
  function returnToMainMenu(){
    console.log("returning...");
  }

  return (
  <div id="newSolution">
    <div id="UpperPage">
      <InitMap latLng={new google.Maps.LatLng(0, 52.4)} zoom={15}/>
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
      <input id="backButton" type="button" value="Back" onClick={returnToMainMenu}/>

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

      <input id="calculateButton" type="button" value="Calculate"/>
    </div>

    <div id="coverDiv"></div>

    <script async src="https://maps.googleapis.com/maps/api/js?key=AIzaSyA4JxaRwAQ18Zvjyxy1CAkuSxKjGpGLzws" defer></script>
    <script src="solution.js" type="module"></script>
    <script src="https://code.createjs.com/1.0.0/createjs.min.js"></script>
  </div>
  );
}

export default NewSol;