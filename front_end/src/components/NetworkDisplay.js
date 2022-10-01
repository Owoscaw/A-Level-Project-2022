import React, { useRef, useEffect } from "react";

function NetworkDisplay(props){

    const canvasRef = useRef(null);
    useEffect(() => {
        canvasRef.current.width = 850 
        canvasRef.current.height = 425
        const networkContext = canvasRef.current.getContext("2d");
        networkContext.fillStyle = "#F1F1F1";
        networkContext.fillRect(0, 0, networkContext.canvas.width, networkContext.canvas.height);
    }, []);

    return (
        <div id="cover">
            <div id="canvasDiv">
                <div id="networkTitle">
                    {
                        props.title
                    }
                </div>
                <input id="cancelButton" type="button" value="×" onClick={props.onCancel}/>
                <canvas ref={canvasRef} id="networkCanvas"/>
            </div>
        </div>
    );
}

export default NetworkDisplay;