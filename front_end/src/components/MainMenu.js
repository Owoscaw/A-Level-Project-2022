import React from "react";

function MainMenu(props){
    return (
        <div id="mainMenu">
            <input type="button" value="startSol" onClick={() => props.changeScreen("newSol")}/>
            <input type="button" value="prevSol" onClick={() => props.changeScreen("prevSol")}/>
        </div>
    );
}

export default MainMenu;