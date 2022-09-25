import React, { useState, Component, useRef, useEffect } from "react";
import Select from "react-select";



import NetworkDisplay from "./NetworkDisplay";
import BetterMap from "./BetterMap";
import "../styles/newSol.css";

let startNode;
let activeNodes = {};
const googleColours = ["66, 133, 244", "234, 67, 53", "251, 188, 5", "52, 168, 83"];

function NewSol(props){

  //states to show nodeMenu and solution cover
  const [ coverIsOn, setCover ] = useState(false);
  const [ nodesInMenu, updateMenu ] = useState([]);
  const selectRef = useRef();

  const calculateSol = () => {
    setCover(true);
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
      }
    }
  };

  const renameNode = (node, newName) => {
    let renamedNode = renameChildNode.current(node, newName); 
    delete activeNodes[node.name];
    activeNodes[newName] = renamedNode;

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
    startNode = event;
  };

  const selectStyles = {
    menu: (styles, state) => ({
      ...styles,
      minWidth: "150px",
      width: "calc(100% - 20px)",
      maxWidth: "400px",
      border: "1px solid black",
      borderRadius: "5px",
      overflow: "hidden",
      marginTop: 0,

      '&:hover': {
        cursor: "default"
      },
    }),
    menuList: (styles, state) => ({
      ...styles,
      paddingTop: 0,
      paddingBottom: 0
    }),
    control: (styles, state) =>({
      ...styles,
      minWidth: "150px",
      width: "100%",
      maxWidth: "400px",
      height: "80%",
      float: "right",
      margin: "4px",
      border: "1px solid black",
      borderRadius: "5px",
      boxShadow: "none",
      transition: "background-color 0.2s ease",

      '&:hover': {
        border: "1px solid black",
        cursor: state.selectProps.menuIsOpen ? "default" : "pointer",
        backgroundColor: state.selectProps.menuIsOpen ? "white" : "rgba(210, 210, 210, 0.2)"
      }
    }),
    dropdownIndicator: (styles, state) => ({
      ...styles,
      transform: state.selectProps.menuIsOpen ? "rotate(90deg)" : null,
      transition: "transform 0.1s ease, color 0.3s ease",

      '&:hover': {
        color: "rgb(45, 45, 45)",
        cursor: "pointer"
      }
    }),
    option: (styles) => ({
      ...styles,
      backgroundColor: "white",
      color: "black",
      height: "fit-content",
      transition: "background-color 0.2s ease",

      '&:hover': {
        cursor: "pointer",
        backgroundColor: "rgba(210, 210, 210, 0.5)"
      }
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
                nodesInMenu.map((node) => {
                  return (
                    <NodeInList key={node.name} node={node} deleteHandler={deactivateNode} renameHandler={renameNode}/>
                  );
                })
              }
            </ul>
          </div>
        </div>
      </div>

      <div id="LowerPage">
        <input id="backButton" className="LowerMenuButton" type="button" value="Back" onClick={() => props.changeScreen("menu")}/>

        <div id="startNodeDiv" className="LowerMenuButton">
          Starting node: 
          <div id="startNodeMenu">
              <Select options={nodesInMenu} ref={selectRef} onChange={(event) => activateStartNode(event)}
              styles={selectStyles} id="selectControl" menuPlacement="bottom" 
              noOptionsMessage={() => ("No nodes?")} placeholder="Select node"/>
          </div>
        </div>

        <input id="calculateButton" className="LowerMenuButton" type="button" value="Calculate" onClick={calculateSol}/>
      </div>

      {coverIsOn ? <NetworkDisplay onCancel={cancelSol}/> : null}

      <script src="https://code.createjs.com/1.0.0/createjs.min.js"></script>
    </div>
  );
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
      <li>
        <div className="NodeInList">
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
        </div>
      </li>
    );
  }
}


export default NewSol;