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
  const selectDivRef = useRef();

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
    menu: (styles, state) => ({
      ...styles,
      minWidth: "150px",
      width: "calc(100% - 8px)",
      maxWidth: "inherit",
      border: "1px solid black",
      borderTopLeftRadius: "0px",
      borderTopRightRadius: "0px",
      borderTop: "0px solid black",
      borderRadius: "5px",
      overflow: "hidden",
      marginTop: "0px",
      boxShadow: "none",

      '&:hover': {
        cursor: "default"
      }
    }),
    menuList: (styles) => ({
      ...styles,
      paddingTop: "0px",
      paddingBottom: "0px"
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
    valueContainer: (styles) => ({
      ...styles,
      
    })
  }

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
          <Select options={nodesInMenu} ref={selectRef} onChange={(event) => activateStartNode(event)}
          className="react-select__container" styles={customStyles} menuPlacement="bottom"
          noOptionsMessage={() => ("No nodes?")} placeholder="Select node" maxMenuHeight={150}/>
        </div>

        <input id="calculateButton" className="LowerMenuButton" type="button" value="Calculate" onClick={calculateSol}/>
      </div>

      <div id="SolutionOptions">
        <h1>Options:</h1>
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