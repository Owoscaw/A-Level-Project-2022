import React, { useState, Component, useRef } from "react";
import Select from "react-select";
import { useTransition, animated } from "react-spring";

import NetworkDisplay from "./NetworkDisplay";
import BetterMap from "./BetterMap";
import "../styles/newSol.css";

let activeNodes = {};

function NewSol(props){

  //states to show nodeMenu and solution cover
  const [ coverIsOn, setCover ] = useState(false);
  const [ solAvailible, setAvailibility ] = useState(true);
  const [ nodesInMenu, updateMenu ] = useState([]);
  const [ startNode, updateStartNode ] = useState({});
  const [ activeSol, setSol ] = useState({});
  const [ apiResponse, updateResponse ] = useState({ message: "", data: null});
  const selectRef = useRef();
  const nodeTransitions = useTransition(nodesInMenu, {
    from: {
      left: "-110%",
      paddingTop: "0px",
      paddingBottom: "0px",
      height: "100px"
    },
    enter: {
      left: "0%",
      paddingTop: "2px",
      paddingBottom: "2px",
      height: "100px"
    },
    leave: node => async (next) => {
      await next({left: "110%"})
      await next({paddingTop: "0px", paddingBottom: "0xp", height: "0px"})
    }
  });


  const calculateSol = () => {
    if((typeof startNode.name === "undefined") || (typeof startNode.name === "null") || (nodesInMenu.length  < 3) || !solAvailible){
      return;
    }

    updateResponse({ message: "", data: null});
    setAvailibility(false);

    let solNetwork = new Network();
    let toBeArced = [];
    let nodeArray = [];

    for(let i = 0; i < nodesInMenu.length; i++){
      let currentNode = nodesInMenu[i];
      solNetwork.addNode(currentNode);
      nodeArray[i] = currentNode;
      toBeArced[i] = {lat: currentNode.lat, lng: currentNode.lng};
    }

    let matrixPromise = getMatrix(toBeArced, nodeArray, solNetwork);
    matrixPromise.then(function(resolve){
      setSol(solNetwork);
      setCover(true);
      let solJSON = solNetwork.toJSON(startNode.name);
      props.calcSol({
        method: "POST",
        cache: "no-cache",
        headers: { 
          "Accept": "application/json",
          "Content-Type": "application/json"
        },
        body: JSON.stringify(solJSON, null, 4)
      }).then(response => response.json()).then(response => {
        console.log(response);
        updateResponse(response);
        setAvailibility(true);
      });

    }, function(reject){
      console.log(reject);
    });
  };

  const cancelSol = () => {
    setCover(false);
  };

  //reference to the function used to delete and rename a marker/overlay from the map
  const deleteChildNode = useRef(null);
  const renameChildNode = useRef(null);

  //called from betterMap when a node is included in the solution
  const activateNode = (node) => {
    activeNodes[node.name] = node;
    updateMenu(prevState => ([...prevState, node]));
  };

  //opposite of above
  const deactivateNode = (node) => {
    deleteChildNode.current(node);
    delete activeNodes[node.name];
 
    updateMenu(prevState => (prevState.filter(entr => (entr.name !== node.name))));

    if(typeof startNode !== "undefined"){
      if(startNode.name === node.name){
        selectRef.current.clearValue();
        updateStartNode({});
      }
    }
  };

  const renameNode = (node, newName) => {
    let renamedNode = renameChildNode.current(node, newName); 
    delete activeNodes[node.name];
    activeNodes[newName] = renamedNode;

    if(startNode.name === node.name){
      updateStartNode(renamedNode);
    }

    updateMenu(prevState => prevState.map(entr => {
      if(entr.name === node.name){
        entr.name = newName;
        entr.label = newName;
      }
      return entr;
    }));

    return renamedNode;
  };


  const activateStartNode = (event) => {
    updateStartNode(event);
  };

  const passSol = () => {

    props.writeSolution({
      method: "POST",
      cache: "no-cache",
      headers: { 
        "Accept": "application/json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        path: apiResponse.data.path,
        nodes: activeSol.allNodes,
        name: "Route " + props.routeIndex
      }, null, 4)
    }).then(response => response.json()).then(response => {
      if(response.message === "Saved solution"){
        props.changeData({
          path: apiResponse.data.path,
          nodes: activeSol.allNodes,
          name: "Route " + props.routeIndex
        });
        props.changeScreen("prevSol");
        return;
      } else {
        console.log(response);
      }
    });
  }

  const customStyles = {
    control: (styles, state) => ({
      ...styles,
      minWidth: "150px",
      width: "100%",
      maxWidth: "inherit",
      height: "100%",
      margin: "4px",
      border: "1px solid black",
      borderBottom: state.selectProps.menuIsOpen ? "1px solid rgba(210, 210, 210, 0.5)" : "1px solid black",
      borderRadius: "5px",
      borderBottomLeftRadius: state.selectProps.menuIsOpen ? "0px" : "5px",
      borderBottomRightRadius: state.selectProps.menuIsOpen ? "0px" : "5px",
      backgroundColor: "white",
      boxShadow: "none",
      transition: "background-color 0.2s ease",

      '&:hover': {
        border: "1px solid black",
        backgroundColor: "rgba(210, 210, 210, 0.5)",
        cursor: state.selectProps.menuIsOpen ? "default" : "pointer",
        borderBottom: state.selectProps.menuIsOpen ? "1px solid rgba(210, 210, 210, 0.5)" : "1px solid black"
      }
    }),
    dropdownIndicator: (styles, state) => ({
      ...styles,
      color: "rgba(45, 45, 45, 0.5)",
      transform: state.selectProps.menuIsOpen ? "rotate(90deg)" : "none",
      transition: "transform 0.1s ease, color 0.3s ease",

      '&:hover': {
        color: "rgba(45, 45, 45, 1)",
        cursor: "pointer"
      }
    }),
    menu: (styles) => ({
      ...styles,
      minWidth: "150px",
      width: "calc(100% - 8px)",
      maxWidth: "inherit",
      height: "auto",
      border: "1px solid black",
      borderTopLeftRadius: "0px",
      borderTopRightRadius: "0px",
      borderTop: "0px solid black",
      borderRadius: "5px",
      overflow: "hidden",
      marginTop: "0px",
      boxShadow: "none",
      animation: "dropDown 0.5s linear",

      '&:hover': {
        cursor: "default"
      }
    }),
    menuList: (styles) => ({
      ...styles,
      paddingTop: "0px",
      paddingBottom: "0px",
    }),
    option: (styles, state) => ({
      ...styles,
      backgroundColor: "white",
      color: "#969696",
      height: "fit-content",
      transition: "background-color 0.2s ease",

      '&:hover': {
        cursor: "pointer",
        color: "rgba(" + state.data.colour + ", 1)",
        fontWeight: "bold",
        backgroundColor: "rgba(210, 210, 210, 0.5)"
      }
    }),
    singleValue: (styles, state) => ({
      ...styles,
      fontWeight: "bold",
      color: "rgba(" + state.data.colour + ", 1)"
    })
  };

  return (
    <div id="newSolution">
      <div id="UpperPage">
        <BetterMap activateNode={activateNode} deactivateNode={deactivateNode} 
        deleteChildNode={deleteChildNode} renameChildNode={renameChildNode}/>
        <div id="nodeMenu">
          <div id="headOfNodes">
            Node Menu
          </div>
          <div id="divOfNodes">
            <ul id="listOfNodes">
              {
                nodeTransitions((nodeStyle, node) => (
                  <NodeInList key={node.name} node={node} transition={nodeStyle}
                  deleteHandler={deactivateNode} renameHandler={renameNode}/>
                ))
              }
            </ul>
          </div>
        </div>
      </div>

      <div id="LowerPage">
        <input id="backButton" className="LowerMenuButton" type="button" value="Back" onClick={() => props.changeScreen("menu")}/>

        <div id="startNodeDiv" className="LowerMenuButton">
          Starting node: 
          <Select options={nodesInMenu} ref={selectRef} onChange={(event) => activateStartNode(event)}
          className="react-select__container" styles={customStyles} menuPlacement="bottom" 
          noOptionsMessage={() => ("No nodes?")} placeholder="Select node" maxMenuHeight={150}/>
        </div>

        <input id="calculateButton" className="LowerMenuButton" type="button" value="Calculate" 
        onClick={calculateSol}/>

        <div id="statusDiv" className="LowerMenuButton">
          <div id="statusHeader">
            Status:
          </div>
          <div id="statusContent">
            {
              (nodesInMenu.length > 2) ? (typeof startNode.name !== "undefined" ? "Ready to solve" : "Select start node") : "Add at least 3 nodes"
            }
          </div>
        </div>
        
      </div>

      <div id="SolutionOptions">
        <h1>Options:</h1>
      </div>

      {
        coverIsOn ? <NetworkDisplay onCancel={cancelSol} title={apiResponse.message === "Path found" ? "Optimal network" : "Initial network"} 
        nodes={activeSol.allNodes} arcs={activeSol.allArcs} apiStatus={apiResponse} setSol={passSol}/> : null
      }
    </div>
  );
}


//function to query google with lats and lngs, returns a promise with matrix info
function getMatrix(toBeArced, nodeArray, network){

  let matrixStatus = "matrix fully loaded";
   
  let matrixLoop = async _ => {

    for(let i = 0; i < toBeArced.length - 1; i++){

      let currentMatrixPromise = new Promise(function(resolve, reject){

        let currentOrigin = toBeArced[i];
        let currentDestinations = toBeArced.slice(i + 1);

        let fromNode = nodeArray[i];
        let toNodes = nodeArray.slice(i + 1);

        // let solMatrix = new window.google.maps.DistanceMatrixService();
        // solMatrix.getDistanceMatrix({
        //   origins: [currentOrigin],
        //   destinations: currentDestinations,
        //   travelMode: "DRIVING"
        // }, function(response, status){

        //   if(status === "OK"){
        //     for(let sink = 0; sink < response.rows[0].elements.length; sink++){
        //       network.addArc(response.rows[0].elements[sink].distance.value, fromNode, toNodes[sink]);
        //     }

        //     resolve("matrix fully loaded");
        //   } else {
        //     reject("matrix failed to load");
        //   }
        // });

        for(let j = 0; j < toNodes.length; j++){
          network.addArc(Math.floor(Math.random()*1000), fromNode, toNodes[j]);
        }
        resolve("matrix fully loaded");
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


//custom component to represent a node in the node menu
class NodeInList extends Component {

  constructor(props){
    super();

    this.state = {
      name: props.node.name,
      node: props.node,
      divFocused: false,
      nameUsed: false,
      isStartNode: false
    };

    this.nodeStyle = props.transition;
    this.deleteHandler = props.deleteHandler.bind(this);
    this.renameHandler = props.renameHandler.bind(this);
    this.keyPress = this.keyPress.bind(this);
    this.divFocusHandler = this.divFocusHandler.bind(this);
    this.divBlurHandler = this.divBlurHandler.bind(this);
    this.inputChecker = this.inputChecker.bind(this);
  }

  inputChecker(nameInput){

    if((nameInput in activeNodes) || (`\`!@#$%^&*()_+-=[]{};':"\\|<>/?~`.split('').some(char => (nameInput.includes(char))))){
      return false;
    }

    return true;
  }


  keyPress(event){

    if(event.key !== "Enter"){
      return;
    } else if(!this.inputChecker(this.state.name.trim().replace(/\s+/g, " "))){
      event.target.blur();
      this.setState({
        ...this.state,
        divFocused: false,
        nameUsed: true
      });

      return;
    }

    event.target.blur();

    let renamedNode = this.renameHandler(this.state.node, this.state.name.trim().replace(/\s+/g, " "));
    this.setState({
      ...this.state,
      name: renamedNode.name,
      node: renamedNode,
      divFocused: false,
      nameUsed: false
    });
  }


  divFocusHandler(){
    this.setState({
      ...this.state,
      divFocused: true,
      nameUsed: false
    });
  }

  divBlurHandler(event){
    event.target.value = "";
    this.setState({
      ...this.state,
      divFocused: false,
      nameUsed: false
    });
  }


  render(){

    return (
      <animated.li style={{paddingTop: this.nodeStyle.paddingTop, paddingBottom: this.nodeStyle.paddingBottom, height: this.nodeStyle.height}}>
        <animated.div className="NodeInList" style={{left: this.nodeStyle.left}}>
          <div className="NameDiv">{this.state.node.name}</div>
          <input className="RemovalButton" type="button" value="Remove Node"
          onClick={() => {this.deleteHandler(this.state.node);}}/>
          <div className="LatLngDiv">
            {this.state.node.lat.toFixed(8).toString() + ", " + this.state.node.lng.toFixed(8).toString()}
          </div>
          <div className="RenameButtonDiv">
            <input className="TextBox" type="text" maxLength="30" 
            onChange={event => this.setState({...this.state, name: event.target.value})}
            onKeyDown={event => this.keyPress(event)} 
            onBlur={event => this.divBlurHandler(event)} onFocus={this.divFocusHandler}/>
            <div className={this.state.divFocused ? "TextButtonDiv" : "ButtonTextDiv"}>{this.state.nameUsed ? "Invalid Name" : "Rename Node"}</div>
          </div>
        </animated.div>
      </animated.li>
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