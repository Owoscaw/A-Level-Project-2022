import React, { useRef, useEffect, useState, Component } from "react";
import * as createjs from "createjs-module";
import { ReactComponent as EditIcon } from "../styles/icons8-edit.svg"; 
import { ReactComponent as ValidIcon } from "../styles/icons8-done.svg";
import { ReactComponent as InvalidIcon } from "../styles/icons8-close.svg";
import { jsx } from "@emotion/react";

import "../styles/networkDisplay.css";

function NetworkDisplay(props){

    const solRef = useRef();
    const [ pathFound, setFound ] = useState(false);
    const [ networkTitle, setTitle ] = useState("");
    const [ networkValid, setValidity ] = useState(true);

    const drawNetwork = (canvasRef) => {

        console.log("drawing");

        canvasRef.current.width = 850 * window.devicePixelRatio;
        canvasRef.current.height = 425 * window.devicePixelRatio;
        const ctx = canvasRef.current.getContext("2d");
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
        ctx.fillStyle = "#F1F1F1";
        ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);

        let transparentLayer = canvasRef.current.cloneNode();
        let transparentCtx = transparentLayer.getContext("2d");
        let nameStage = new createjs.Stage(canvasRef.current);

        let thetaIncrement = Math.PI*2/props.nodes.length;
        let rad = (canvasRef.current.height - 125)/2;
        let cntr = {x: canvasRef.current.width/2, y: canvasRef.current.height/2};

        let fontSize = Math.floor(36/window.devicePixelRatio);
        let nodeXY = {};
        for(let i = 0; i < props.nodes.length; i++){

            let currentTheta = i*thetaIncrement;
            let currentX = rad*Math.cos(currentTheta) + cntr.x;
            let currentY = rad*Math.sin(currentTheta) + cntr.y;

            transparentCtx.fillStyle = "rgb(" + props.nodes[i].colour + ")";
            transparentCtx.beginPath();
            transparentCtx.arc(currentX, currentY, 15, 0, 2*Math.PI);
            transparentCtx.fill();

            let nodeText = new createjs.Text(props.nodes[i].name, `${fontSize}px Google Sans`, "#000000");
            nodeText.textAlign = "center";
            nodeText.textBaseline = "top";
            nodeText.lineWidth = 125;
            nodeText.maxWidth = 125;
            let textHeight = nodeText.getMeasuredHeight();
            nodeText.x = currentX;
            nodeText.y = currentY - textHeight/2;
            nameStage.addChild(nodeText);

            nodeXY[props.nodes[i].name] = {x: currentX, y: currentY, colour: props.nodes[i].colour};
        }

        nameStage.update();
        transparentCtx.lineWidth = 5;

        for(let j = 0; j < props.apiStatus.data.path.length - 1; j++){

            let node1X = nodeXY[props.apiStatus.data.path[j]].x;
            let node1Y = nodeXY[props.apiStatus.data.path[j]].y;
            let node1Colour = "rgb(" + nodeXY[props.apiStatus.data.path[j]].colour + ")";

            let node2X = nodeXY[props.apiStatus.data.path[j + 1]].x;
            let node2Y = nodeXY[props.apiStatus.data.path[j + 1]].y;
            let node2Colour = "rgb(" + nodeXY[props.apiStatus.data.path[j + 1]].colour + ")";

            let grad = transparentCtx.createLinearGradient(node1X, node1Y, node2X, node2Y);
            grad.addColorStop(0.3, node1Colour);
            grad.addColorStop(0.7, node2Colour);

            transparentCtx.strokeStyle = grad;
            transparentCtx.beginPath();
            transparentCtx.moveTo(node1X, node1Y);
            transparentCtx.lineTo(node2X, node2Y);
            transparentCtx.stroke();
        }

        ctx.globalAlpha = 0.4;
        ctx.globalCompositeOperation = "destination-over";
        ctx.drawImage(transparentLayer, 0, 0);
    }

    useEffect(() => {

        if(props.apiStatus.message === "Path found"){
            setFound(true);
            setTitle(props.title + ": " + props.apiStatus.data.weight + "m");;
        } else {
            setTitle(props.title);
        }

        props.loadRoutes().then(routes => {
            solRef.current = routes.data.map(route => (route.name));
        });

    }, [props]);


    const saveSol = (name) => {
        console.log(name);
        props.setSol(name);
    } 

    return (
        <div id="cover">
            <div id="canvasDiv">
                <div id="networkHeader">
                    {
                        pathFound ? 
                        <NetworkHeader defaultName={networkTitle} setTitle={setTitle} 
                        setValidity={setValidity} prevNames={solRef.current}/> 
                        : null
                    }
                </div>
                {
                    pathFound
                    ?   <>
                        <NetworkCanvas pathFound={pathFound} drawNetwork={drawNetwork}/>
                        <input className={`solutionButton ${networkValid ? "solutionButton-valid" : "solutionButton-invalid"}`} 
                        type="button" value={networkValid ? "Save route" : "Invalid name"} onClick={() => saveSol(networkTitle)}/>
                    </>
                    :   <>
                        <input id="cancelButton" type="button" value="×" onClick={props.onCancel}/>
                        <div id="apiStatus" className={props.apiStatus.message === "" ? "apiLoading" : "apiWarning"}>
                            {
                                props.apiStatus.message === "" ? "Loading" : props.apiStatus.message
                            }
                        </div>
                    </>
                }
            </div>
        </div>
    );
}

class NetworkCanvas extends Component{

    constructor(props){
        super(props);

        this.state = {
            pathFound: props.pathFound,
        }

        this.canvasRef = React.createRef();
        this.draw = props.drawNetwork.bind(this);
    }

    componentDidMount(){
        this.draw(this.canvasRef);
    }

    render(){

        return (
            <canvas ref={this.canvasRef} id="networkCanvas"/> 
        );
    }
}

class NetworkHeader extends Component{

    constructor(props){
        super(props);

        this.state = {
            inputFocused: true,
            nameValid: true,
            defaultName: props.defaultName 
        }

        this.titleRef = React.createRef();
        this.prevNames = props.prevNames;
        this.setTitle = props.setTitle.bind(this);
        this.setValidity = props.setValidity.bind(this);
        this.focusInput = this.focusInput.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
        this.handleChange = this.handleChange.bind(this);
    }

    focusInput(){

        this.setState(prevState => ({
            ...prevState,
            inputFocused: true
        }));

        this.titleRef.current.focus();
    }

    handleChange(event){

        if(event.key === "Enter"){
            this.handleSubmit();
        }
    }

    handleSubmit(){

        let newName = this.titleRef.current.value.trim().replace(/\s+/g, " ");

        if((`\`!@#$%^&*()_+-=[]{}"\\|<>/?~`.split('').some(char => (newName.includes(char))))
        || (this.prevNames.includes(newName)) || (newName === "")){
            this.setState(prevState => ({
                ...prevState,
                defaultName: newName,
                nameValid: false
            }));

            this.setValidity(false);
        
        } else {

            this.setState(prevState => ({
                ...prevState,
                defaultName: newName,
                inputFocused: false,
                nameValid: true
            }));

            this.setValidity(true);
            this.setTitle(newName);
            this.titleRef.current.blur();
        }
    }

    render(){

        return(
            <div id="networkTitle-container">
                <button id="networkButton" onClick={this.focusInput}>
                    <EditIcon/>
                </button>
                <input type="text" defaultValue={this.state.defaultName} onKeyDown={event => this.handleChange(event)}
                onFocus={() => this.setState(prevState => ({...prevState, inputFocused: true}))} onBlur={this.handleSubmit}
                ref={this.titleRef} className={`networkTitle ${this.state.nameValid ? "networkTitle-valid" : "networkTitle-invalid"}`} 
                autoComplete="off" maxLength={30}/>
                {
                    this.state.nameValid ? <ValidIcon id="validIcon"/> : <InvalidIcon id="invalidIcon"/>
                }
            </div>
        );
    }
}

export default NetworkDisplay;