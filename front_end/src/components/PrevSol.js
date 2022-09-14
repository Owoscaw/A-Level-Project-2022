import React from "react";

function PrevSol(props){
    return (
        <div>
            Test
            <input type="button" value="click me" onClick={() => props.changeScreen("menu")}/>
        </div>
    );
}

export default PrevSol;