import React, { useRef, useEffect, useState, Component } from "react";
import * as createjs from "createjs-module";
import { ReactComponent as EditIcon } from "../styles/icons8-edit.svg"; 
import { ReactComponent as ValidIcon } from "../styles/icons8-done.svg";
import { ReactComponent as InvalidIcon } from "../styles/icons8-close.svg";

import "../styles/networkDisplay.css";

function NetworkDisplay(props){

    const solRef = useRef();
    const [ pathFound, setFound ] = useState(false);
    const [ networkTitle, setTitle ] = useState("");

    //manages state of network name
    const [ networkValid, setValidity ] = useState(true);


    //bunch of canvas stuff, did some cool math to make regular polygons
    //i am not commenting all of this
    const drawNetwork = (canvasRef) => {

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

        //used to check input name against previously used network names
        props.loadRoutes().then(routes => {
            solRef.current = routes.data.map(route => (route.name));
        });

    }, [props]);


    const saveSol = (name) => {
        console.log(name);
        props.setSol(name);
    } 

    return (
        <div id="ntwrk-container">
            <div id="ntwrk-canvas-container">
                <div id="ntwrk-header">
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
                        <input className={`ntwrk-save ${networkValid ? "ntwrk-save-valid" : "ntwrk-save-invalid"}`} 
                        type="button" value={networkValid ? "Save route" : "Invalid name"} onClick={() => saveSol(networkTitle)}/>
                    </>
                    :   <>
                        <input id="ntwrk-cancel" type="button" value="×" onClick={props.onCancel}/>
                        <div id="ntwrk-api-status" className={props.apiStatus.message === "" ? "ntwrk-api-loading" : "ntwrk-api-warning"}>
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

    //drawing the graph only when it loads
    componentDidMount(){
        this.draw(this.canvasRef);
    }

    render(){

        return (
            <canvas ref={this.canvasRef} id="ntwrk-canvas"/> 
        );
    }
}

class NetworkHeader extends Component{

    constructor(props){
        super(props);

        this.state = {
            nameValid: true,
            defaultName: props.defaultName 
        }

        this.titleRef = React.createRef();
        this.prevNames = props.prevNames;
        this.setTitle = props.setTitle.bind(this);
        this.setValidity = props.setValidity.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
        this.handleChange = this.handleChange.bind(this);
    }

    handleChange(event){

        if(event.key === "Enter"){
            this.handleSubmit();
        }
    }

    handleSubmit(){

        //trimming whitespace
        let newName = this.titleRef.current.value.trim().replace(/\s+/g, " ");

        //testing if the name contains any special characters or has been used before
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
                nameValid: true
            }));

            this.setValidity(true);
            this.setTitle(newName);
            this.titleRef.current.blur();
        }
    }

    render(){

        return(
            <div id="ntwrk-title-container">
                <button id="ntwrk-title-edit" onClick={() => this.titleRef.current.focus()}>
                    <EditIcon/>
                </button>
                <input type="text" defaultValue={this.state.defaultName} onKeyDown={event => this.handleChange(event)}
                onBlur={this.handleSubmit} ref={this.titleRef} className={`ntwrk-title ${this.state.nameValid ? "ntwrk-title-valid" : "ntwrk-title-invalid"}`} 
                autoComplete="off" maxLength={30}/>
                {
                    this.state.nameValid ? <ValidIcon id="validIcon"/> : <InvalidIcon id="invalidIcon"/>
                }
            </div>
        );
    }
}

export default NetworkDisplay;