import React from "react";

import "../styles/mainMenu.css";

function MainMenu(props){
    return (
        <div id="mainMenu-container">
            <div id="mainMenu-title">
                Travelling Salesman Problem
            </div>
            <div id="mainMenu-options">
                <input type="button" value="Start new route" className="mainMenu-option-button" onClick={() => props.changeScreen("newSol")}/>
                or
                <input type="button" value="View previous routes" className="mainMenu-option-button" onClick={() => props.changeScreen("prevSol")}/>
            </div>
        </div>
    );
}

export default MainMenu;