import React from "react";

import "../styles/mainMenu.css";

function MainMenu(props){
    return (
        <div id="mainMenu">
            <div id="optionMenu">
                <input type="button" value="startSol" className="primaryButton" onClick={() => props.changeScreen("newSol")}/>
                <input type="button" value="prevSol" className="primaryButton" onClick={() => props.changeScreen("prevSol")}/>
            </div>
        </div>
    );
}

export default MainMenu;