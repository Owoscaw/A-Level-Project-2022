import React, { useRef, useEffect } from "react";
import * as createjs from "createjs-module";
import { jsx } from "@emotion/react";

import "../styles/networkDisplay.css";

function NetworkDisplay(props){

    const canvasRef = useRef(null);

    const drawNetwork = (nodes, arcs, path, ctx) => {
        let transparentLayer = canvasRef.current.cloneNode();
        let transparentCtx = transparentLayer.getContext("2d");
        let nameStage = new createjs.Stage(canvasRef.current);

        let thetaIncrement = Math.PI*2/nodes.length;
        let rad = (canvasRef.current.height - 75)/2;
        let cntr = {x: canvasRef.current.width/2, y: canvasRef.current.height/2};

        let fontSize = Math.floor(36/window.devicePixelRatio);
        let nodeXY = {};
        for(let i = 0; i < nodes.length; i++){

            let currentTheta = i*thetaIncrement;
            let currentX = rad*Math.cos(currentTheta) + cntr.x;
            let currentY = rad*Math.sin(currentTheta) + cntr.y;

            transparentCtx.fillStyle = "rgb(" + nodes[i].colour + ")";
            transparentCtx.beginPath();
            transparentCtx.arc(currentX, currentY, 15, 0, 2*Math.PI);
            transparentCtx.fill();

            let nodeText = new createjs.Text(nodes[i].name, `${fontSize}px Google Sans`, "#000000");
            nodeText.textAlign = "center";
            nodeText.textBaseline = "top";
            nodeText.lineWidth = 125;
            nodeText.maxWidth = 125;
            let textHeight = nodeText.getMeasuredHeight();
            nodeText.x = currentX;
            nodeText.y = currentY - textHeight/2;
            nameStage.addChild(nodeText);

            nodeXY[nodes[i].name] = {x: currentX, y: currentY, colour: nodes[i].colour};
        }
        nameStage.update();

        transparentCtx.lineWidth = 5;

        if(path.length > 0){
            for(let j = 0; j < path.length - 1; j++){

                let node1X = nodeXY[path[j]].x;
                let node1Y = nodeXY[path[j]].y;
                let node1Colour = "rgb(" + nodeXY[path[j]].colour + ")";
    
                let node2X = nodeXY[path[j + 1]].x;
                let node2Y = nodeXY[path[j + 1]].y;
                let node2Colour = "rgb(" + nodeXY[path[j + 1]].colour + ")";
    
                let grad = transparentCtx.createLinearGradient(node1X, node1Y, node2X, node2Y);
                grad.addColorStop(0.3, node1Colour);
                grad.addColorStop(0.7, node2Colour);
    
                transparentCtx.strokeStyle = grad;
                transparentCtx.beginPath();
                transparentCtx.moveTo(node1X, node1Y);
                transparentCtx.lineTo(node2X, node2Y);
                transparentCtx.stroke();
            }
        } else {
            for(let j = 0; j < arcs.length; j++){

                let node1X = nodeXY[arcs[j].node1.name].x;
                let node1Y = nodeXY[arcs[j].node1.name].y;
                let node1Colour = "rgb(" + nodeXY[arcs[j].node1.name].colour + ")";
    
                let node2X = nodeXY[arcs[j].node2.name].x;
                let node2Y = nodeXY[arcs[j].node2.name].y;
                let node2Colour = "rgb(" + nodeXY[arcs[j].node2.name].colour + ")";
    
                let grad = transparentCtx.createLinearGradient(node1X, node1Y, node2X, node2Y);
                grad.addColorStop(0.3, node1Colour);
                grad.addColorStop(0.7, node2Colour);
    
                transparentCtx.strokeStyle = grad;
                transparentCtx.beginPath();
                transparentCtx.moveTo(node1X, node1Y);
                transparentCtx.lineTo(node2X, node2Y);
                transparentCtx.stroke();
            }
        }

        ctx.globalAlpha = 0.4;
        ctx.globalCompositeOperation = "destination-over";
        ctx.drawImage(transparentLayer, 0, 0);
    }

    useEffect(() => {
        canvasRef.current.width = 850 * window.devicePixelRatio;
        canvasRef.current.height = 425 * window.devicePixelRatio;
        const networkContext = canvasRef.current.getContext("2d");
        networkContext.scale(window.devicePixelRatio, window.devicePixelRatio);
        networkContext.fillStyle = "#F1F1F1";
        networkContext.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);

        if(props.apiStatus.message === "Path found"){
            drawNetwork(props.nodes, props.arcs, props.apiStatus.data.path, networkContext);
        } else {
            drawNetwork(props.nodes, props.arcs, [], networkContext);
        }
    }, [props.nodes, props.arcs, props.apiStatus.message]);


    return (
        <div id="cover">
            <div id="canvasDiv">
                <div id="networkTitle">
                    {
                        props.title
                    }
                </div>
                {
                    props.apiStatus.message !== "Path found" ? <input id="cancelButton" type="button" value="×" onClick={props.onCancel}/> : null
                }
                <canvas ref={canvasRef} id="networkCanvas"/>
                <div id="apiStatus" className={props.apiStatus.message === "" ? "apiLoading" : null}>
                    {
                        props.apiStatus === "" ? "Calculating" : props.apiStatus.message
                    }
                </div>
            </div>
        </div>
    );
}

export default NetworkDisplay;