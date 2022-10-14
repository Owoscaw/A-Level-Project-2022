import React from "react";

function PrevSol(props){
    console.log(props.solution);
    return (
        <div>
            Test
            <input type="button" value="click me" onClick={() => props.changeScreen("menu")}/>
        </div>
    );
}

export default PrevSol;