import React, { useState, Component, useEffect } from "react";

import NetworkDisplay from "./NetworkDisplay";
import BetterMap from "./BetterMap";
import CoolDropdown from "./CoolDropdown";
import "../styles/newSol.css";



function NewSol(props){

  const [ coverIsOn, setCover ] = useState(false);
  const [ nodes, setNodes ] = useState([]);
  const [ startNode, setStartNode ] = useState(null);
  const [ activeSol, setSol ] = useState({});
  const [ solOptions, setOptions ] = useState({ travelMode: "driving", trafficMode: "bestguess" });
  const [ apiResponse, updateResponse ] = useState({ message: "", data: null});


  //used to make sure startNode is set to null if it is removed from the map
  useEffect(() => {
    if(nodes.indexOf(startNode) === -1){
      setStartNode(null);
    }
  }, [nodes])

  const calculateSol = () => {
    if((typeof startNode.name === "undefined") || (startNode === null) || (nodes.length  < 3)){
      return;
    }

    updateResponse({ message: "", data: null});

    let solNetwork = new Network();
    let toBeArced = [];
    let nodeArray = [];

    //finding most efficient arcs to query
    for(let i = 0; i < nodes.length; i++){
      let currentNode = nodes[i];
      solNetwork.addNode(currentNode);
      nodeArray[i] = currentNode;
      toBeArced[i] = {lat: currentNode.lat, lng: currentNode.lng};
    }

    setSol(solNetwork);
    setCover(true);

    //uses directionsMatrix api to get all arcs in the network
    let matrixPromise = getMatrix(toBeArced, nodeArray, solNetwork, solOptions);

    matrixPromise.then((resolve) => {
      let solJSON = solNetwork.toJSON(startNode.name);
      props.api("calculate", {
        method: "POST",
        cache: "no-cache",
        headers: { 
          "Accept": "application/json",
          "Content-Type": "application/json"
        },
        body: JSON.stringify(solJSON, null, 4)
      }).then(response => response.json()).then(response => {
        updateResponse(response);
      });

    }, (reject) => {
      console.log(reject);
      updateResponse({
        message: "what",
        data: null
      })
    });
  };

  
  //saving solution and changing screen to show route
  const saveSol = (name) => {
    
    props.api("save", {
      method: "POST",
      cache: "no-cache",
      headers: { 
        "Accept": "application/json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        path: apiResponse.data.path,
        nodes: activeSol.allNodes,
        startNode: apiResponse.data.path[0],
        weight: apiResponse.data.weight,
        options: {
          travelMode: solOptions.travelMode,
          trafficMode: solOptions.trafficMode
        },
        name: name
      }, null, 4)
    }).then(response => response.json()).then(response => {
      if(response.message === "Saved solution"){
        props.changeData({
          path: apiResponse.data.path,
          nodes: activeSol.allNodes,
          startNode: apiResponse.data.path[0],
          weight: apiResponse.data.weight,
          options: {
            travelMode: solOptions.travelMode,
            trafficMode: solOptions.trafficMode
          },
          name: name
        });
        props.changeScreen("prevSol");
        return;
      } else {
        console.log(response);
      }
    });
  }

  //loads previous routes from prevData.json
  const loadRoutes = () => {
     return props.api("load", {
      method: "GET",
      cache: "no-cache",
      headers: { 
      "Accept": "application/json",
      "Content-Type": "application/json"
      }}).then(response => response.json());
  }

  return (
    <div id="newSol-container">
      <div id="newSol-upper-container">
          <BetterMap nodes={nodes} setNodes={setNodes}/>
      </div>

      <div id="newSol-lower-container">
        <input id="newSol-back" className="newSol-lower-button" type="button" value="Back" onClick={() => props.changeScreen("menu")}/>

        <div id="newSol-startNode">
          <CoolDropdown maxHeight="150px" options={nodes} onSelect={setStartNode}
          defaultValue="Select node" value={startNode} emptyMessage="No nodes?"/>
        </div>

        <input id="newSol-calculate" className="newSol-lower-button" type="button" value="Calculate" 
        onClick={calculateSol}/>

        <div id="newSol-status" className="newSol-lower-button">
          {
            (nodes.length > 2) ? (startNode !== null ? "Ready to solve" : "Select start node") : "Add at least 3 nodes"
          }
        </div>
      </div>

      <div id="newSol-subpage-container">
        <div id="newSol-options">
          <div id="newSol-options-header">Options:</div>
          <div id="newSol-options-grid">
            <div className="newSol-options-grid-item newSol-travel-options">
              Travel Mode:
              <ul>
                <OptionButton name="driving" type="travel" options={solOptions} setOptions={setOptions}/>
                <OptionButton name="bicycling" type="travel" options={solOptions} setOptions={setOptions}/>
                <OptionButton name="walking" type="travel" options={solOptions} setOptions={setOptions}/>
              </ul>
            </div>
            <div className={`newSol-options-grid-item newSol-traffic-options${solOptions.travelMode === "driving" ? "" : "-disabled"}`}>
              Traffic Mode:
              <ul>
                <OptionButton name="bestguess" type="traffic" options={solOptions} setOptions={setOptions}/>
                <OptionButton name="optimistic" type="traffic" options={solOptions} setOptions={setOptions}/>
                <OptionButton name="pessimistic" type="traffic" options={solOptions} setOptions={setOptions}/>
              </ul>
            </div>
          </div>
        </div>

        <div id="newSol-info">
          Information
        </div>
      </div>

      {
        coverIsOn ? <NetworkDisplay onCancel={() => setCover(false)} title={apiResponse.message === "Path found" ? "Optimal network" : ""} 
        nodes={activeSol.allNodes} arcs={activeSol.allArcs} apiStatus={apiResponse} setSol={saveSol} loadRoutes={loadRoutes}/> : null
      }
    </div>
  );
}


//function to query google with lats and lngs, returns a promise with matrix info
function getMatrix(toBeArced, nodeArray, network, options){

  let matrixStatus = "matrix fully loaded";
   
  //using async ensures that all arcs are loaded before continuing
  let matrixLoop = async _ => {

    for(let i = 0; i < toBeArced.length - 1; i++){

      let currentMatrixPromise = new Promise(function(resolve, reject){

        let currentOrigin = toBeArced[i];
        let currentDestinations = toBeArced.slice(i + 1);

        let fromNode = nodeArray[i];
        let toNodes = nodeArray.slice(i + 1);

        let travelMode = options.travelMode.toUpperCase();
        let drivingOptions = {
          trafficModel: options.trafficMode,
          departureTime: new Date(Date.now())
        };

        let solMatrix = new window.google.maps.DistanceMatrixService();
        solMatrix.getDistanceMatrix({
          origins: [currentOrigin],
          destinations: currentDestinations,
          travelMode: travelMode,
          drivingOptions: drivingOptions
        }, function(response, status){
          console.log(response);
          if(status === "OK"){
            for(let sink = 0; sink < response.rows[0].elements.length; sink++){
              try{
                network.addArc(response.rows[0].elements[sink].distance.value, fromNode, toNodes[sink]);
              } catch {
                reject("matrix failed to load");
              }
            }

            resolve("matrix fully loaded");
          } else {
            reject("matrix failed to load");
          }
        });

        // for(let j = 0; j < toNodes.length; j++){
        //   network.addArc(Math.floor(Math.random()*1000), fromNode, toNodes[j]);
        // }
        // resolve("matrix fully loaded");
      });

      let matrixResult = await currentMatrixPromise;

      if(matrixResult !== "matrix fully loaded"){
        matrixStatus = matrixResult;
      }
    }

    return matrixStatus;
  }

  return matrixLoop();
}


//used to define options to use when calculating distances
class OptionButton extends Component {

  constructor(props){
    super(props);

    this.state = {
      name: props.name,
      type: props.type,
    }

    this.setOptions = props.setOptions.bind(this);
  }

  render(){

    let onClick;
    let additionalClass = "";

    if(this.state.type === "travel"){
      onClick = () => {
        this.setOptions((prevState) => ({...prevState, travelMode: `${this.state.name}`}));
      };
      if(this.state.name === this.props.options.travelMode){
        additionalClass = "newSol-option-button-active";
      }
    } else if(this.state.type === "traffic"){
      onClick = () => {
        this.setOptions((prevState) => ({...prevState, trafficMode: `${this.state.name}`}));
      }
      if(this.state.name === this.props.options.trafficMode){
        additionalClass = "newSol-option-button-active";
      }
    }

    return (
      <li>
        <button className={`newSol-option-button ${additionalClass}`} 
        type="button" onClick={onClick}/>{this.state.name.charAt(0).toUpperCase() + this.state.name.slice(1)}
      </li>
    );
  }
}


class Network {
  
  constructor(){
    this.allNodes = [];
    this.allArcs = [];
    this.table = {};
  }

  addNode(node){
    this.table[node.name] = {};
    this.allNodes.push(node);

    this.populateTable();
  }

  hasArc(weight, node1, node2){
    return this.table[node1.name][node2.name] === weight;
  }

  addArc(weight, node1, node2){

    if((node1.name === node2.name) || (weight === 0) || this.hasArc(weight, node1, node2)){
      return;
    }



    this.table[node1.name][node2.name] = weight;
    this.table[node2.name][node1.name] = weight;
    this.allArcs.push({node1: node1, node2: node2, weight: weight});
  }

  populateTable(){

    for(let i = 0; i < this.allNodes.length; i++){
      let iName = this.allNodes[i].name;

      for(let j = 0; j < this.allNodes.length; j++){
        let jName = this.allNodes[j].name;
        if((typeof this.table[iName][jName] === "undefined") && (iName !== jName)){
          this.table[iName][jName] = 0;
        }
      }
    }
  }

  toJSON(nodeName){

    let shortenedNodes = [];
    for(let i = 0; i < this.allNodes.length; i++){
      shortenedNodes.push(this.allNodes[i].name);
    }

    let shortenedArcs = [];
    for(let j = 0; j < this.allArcs.length; j++){
      shortenedArcs.push({node1: this.allArcs[j].node1.name, node2: this.allArcs[j].node2.name, weight: this.allArcs[j].weight});
    }

    return {
      nodes: shortenedNodes,
      arcs: shortenedArcs,
      startNode: nodeName,
      path: []
    };
  }
}



export default NewSol;