import React, { useState, Component, useRef, createRef } from "react";
import Select from "react-select";
import { useTransition, animated } from "react-spring";
 
import NetworkDisplay from "./NetworkDisplay";
import BetterMap from "./BetterMap";
import { ReactComponent as TrashIcon } from "../styles/icons8-trash.svg";
import "../styles/newSol.css";
import { Data } from "@react-google-maps/api";

let activeNodes = {};

function NewSol(props){

  //states to show nodeMenu and solution cover
  const [ coverIsOn, setCover ] = useState(false);
  const [ solAvailible, setAvailibility ] = useState(true);
  const [ nodesInMenu, updateMenu ] = useState([]);
  const [ startNode, updateStartNode ] = useState({});
  const [ activeSol, setSol ] = useState({});
  const [ solOptions, setOptions ] = useState({ travelMode: "driving", trafficMode: "bestguess" });
  const [ apiResponse, updateResponse ] = useState({ message: "", data: null});
  const selectRef = useRef();

  const nodeTransitions = useTransition(nodesInMenu, {
    from: {
      left: "-110%",
      height: "100px",
      paddingTop: "8px"
    },
    enter: {
      left: "0%",
      height: "100px",
      paddingTop: "8px"
    },
    leave: node => async(next, cancel) => {
      await next({ left: "110%" })
      await next({ height: "0px", paddingTop: "0px" })
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

    setSol(solNetwork);
    setCover(true);
    let matrixPromise = getMatrix(toBeArced, nodeArray, solNetwork, solOptions);
    matrixPromise.then(function(resolve){
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

  const passSol = (name) => {
    
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

  const loadRoutes = () => {
     return props.api("load", {
      method: "GET",
      cache: "no-cache",
      headers: { 
      "Accept": "application/json",
      "Content-Type": "application/json"
      }}).then(response => response.json());
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
        <div id="newMapContainer">
          <div id="newMapHeader">
            Map
          </div>
          <BetterMap activateNode={activateNode} deactivateNode={deactivateNode} 
          deleteChildNode={deleteChildNode} renameChildNode={renameChildNode}/>
        </div>
        <div id="nodeMenu">
          <div id="headOfNodes">
            Node Menu
          </div>
          <div id="divOfNodes">
            <ul id="listOfNodes">
              {
                nodeTransitions((styles, node) => (
                  <NodeInList key={node.name} node={node} styles={styles}
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

      <div id="SubPage">
        <div id="SolutionOptions">
          <div id="optionHead">Options:</div>
          <div id="optionGrid">
            <div className="optionGrid-item travelDiv">
              Travel Mode:
              <ul>
                <OptionButton name="driving" type="travel" options={solOptions} setOptions={setOptions}/>
                <OptionButton name="bicycling" type="travel" options={solOptions} setOptions={setOptions}/>
                <OptionButton name="walking" type="travel" options={solOptions} setOptions={setOptions}/>
              </ul>
            </div>
            <div className={`optionGrid-item trafficDiv${solOptions.travelMode === "driving" ? "" : " trafficDiv-disabled"}`}>
              Traffic Mode:
              <ul>
                <OptionButton name="bestguess" type="traffic" options={solOptions} setOptions={setOptions}/>
                <OptionButton name="optimistic" type="traffic" options={solOptions} setOptions={setOptions}/>
                <OptionButton name="pessimistic" type="traffic" options={solOptions} setOptions={setOptions}/>
              </ul>
            </div>
          </div>
        </div>

        <div id="InfoArea">
          Information
        </div>
      </div>

      {
        coverIsOn ? <NetworkDisplay onCancel={cancelSol} title={apiResponse.message === "Path found" ? "Optimal network" : ""} 
        nodes={activeSol.allNodes} arcs={activeSol.allArcs} apiStatus={apiResponse} setSol={passSol} loadRoutes={loadRoutes}/> : null
      }
    </div>
  );
}


//function to query google with lats and lngs, returns a promise with matrix info
function getMatrix(toBeArced, nodeArray, network, options){

  let matrixStatus = "matrix fully loaded";
   
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

        // let solMatrix = new window.google.maps.DistanceMatrixService();
        // solMatrix.getDistanceMatrix({
        //   origins: [currentOrigin],
        //   destinations: currentDestinations,
        //   travelMode: travelMode,
        //   drivingOptions: drivingOptions
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
        additionalClass = "optionButton-active";
      }
    } else if(this.state.type === "traffic"){
      onClick = () => {
        this.setOptions((prevState) => ({...prevState, trafficMode: `${this.state.name}`}));
      }
      if(this.state.name === this.props.options.trafficMode){
        additionalClass = "optionButton-active";
      }
    }

    return (
      <li>
        <button className={`optionButton ${additionalClass}`} 
        type="button" onClick={onClick}/>{this.state.name.charAt(0).toUpperCase() + this.state.name.slice(1)}
      </li>
    );
  }
}

//custom component to represent a node in the node menu
class NodeInList extends Component {

  constructor(props){
    super(props);

    this.state = {
      name: props.node.name,
      node: props.node,
      divFocused: false,
      nameUsed: false,
      isStartNode: false
    };

    this.name = props.node.name
    this.deleteHandler = props.deleteHandler.bind(this);
    this.renameHandler = props.renameHandler.bind(this);
    this.keyPress = this.keyPress.bind(this);
    this.divFocusHandler = this.divFocusHandler.bind(this);
    this.divBlurHandler = this.divBlurHandler.bind(this);
    this.inputChecker = this.inputChecker.bind(this);
  }

  inputChecker(nameInput){

    return !((nameInput in activeNodes) || (`\`!@#$%^&*()_+-=[]{};':"\\|<>/?~`.split('').some(char => (nameInput.includes(char)))));
  }


  keyPress(event){

    if(event.key !== "Enter"){
      return;
    } else if(!this.inputChecker(this.name.trim().replace(/\s+/g, " "))){
      event.target.blur();
      this.setState({
        ...this.state,
        divFocused: false,
        nameUsed: true
      });

      return;
    }

    event.target.blur();

    let renamedNode = this.renameHandler(this.state.node, this.name.trim().replace(/\s+/g, " "));
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
      <animated.li style={this.props.styles}>
        <div className="NodeInList">
          <div className="NameDiv">{this.state.name}</div>
          <button className="RemovalButton" type="button" onClick={() => {this.deleteHandler(this.state.node);}}>
            <TrashIcon/>
          </button>
          <div className="LatLngDiv">
            {this.state.node.lat.toFixed(8).toString() + ", " + this.state.node.lng.toFixed(8).toString()}
          </div>
          <div className="RenameButtonDiv">
            <input className="TextBox" type="text" maxLength="30" 
            onChange={event => this.name = event.target.value}
            onKeyDown={event => this.keyPress(event)} 
            onBlur={event => this.divBlurHandler(event)} onFocus={this.divFocusHandler}/>
            <div className={this.state.divFocused ? "TextButtonDiv" : "ButtonTextDiv"}>{this.state.nameUsed ? "Invalid Name" : "Rename Node"}</div>
          </div>
        </div>
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