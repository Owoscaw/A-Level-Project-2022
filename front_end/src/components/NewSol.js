import React from "react";
import {useState, useMemo, useRef} from "react";
import {useJsApiLoader, GoogleMap, Marker} from "@react-google-maps/api";
//import NewNode from "./NewNode";

let startNode;
let currentNodes = {};
let activeNodes = {};
const possibleIcons = ["markerIcon1.jpg", "markerIcon2.jpg", "markerIcon3.jpg"];
const googleColours = ["66, 133, 244", "234, 67, 53", "251, 188, 5", "52, 168, 83"]

function NewSol(){

  const {isLoaded} = useJsApiLoader({
    googleMapsApiKey: "AIzaSyA4JxaRwAQ18Zvjyxy1CAkuSxKjGpGLzws"
  });

  //function to handle back button presses
  function returnToMainMenu(){
    console.log("returning...");
  }

  const [map, setMap] = useState(/** @type google.maps.Map*/null);

  if(!isLoaded){
    return <div>Loading...</div>;
  }

  return (
  <div id="newSolution">
    <div id="UpperPage">
      <Map />
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

function NewNode(props){

}

function Map(props){

  const mapRef = useRef();
  const mapCenter = useMemo(() => ({lat: 52.4, lng: 0}), []);
  const mapOptions = useMemo(() => ({
    disableDefaultUI: true
  }), []);

  return (
    <GoogleMap zoom={15} center={mapCenter} id="map" options={mapOptions}>

    </GoogleMap>
  );
}



export default NewSol;