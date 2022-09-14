import React from "react";

function NetworkDisplay(props){

    return (
        <div id="cover">
            <div id="canvasDiv">
                <input id="cancelButton" type="button" value="×" onClick={props.onCancel}/>
            </div>
        </div>
    );
}


export default NetworkDisplay;