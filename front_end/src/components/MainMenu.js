import React from "react";

import "../styles/mainMenu.css";

function MainMenu(props){
    return (
        <div id="mainMenu-container">
            <img id="mainMenu-background" alt="background"/>
            <div id="mainMenu-title">
                Welcome to Google Maps 2!
            </div>
            <div id="mainMenu-description">
                <div id="mainMenu-description-container">
                    Google Maps 2 innovates on it's predecessor by offering the ability to create and configure your own routes, that will be fully optimised using a state of the art algorithm.
                    Routes can feature renamable nodes, that can be saved with a custom name for ease of use. 
                    Many modes of transport are availible, as well as 3 different traffic models when driving.
                </div>
            </div>
            <div id="mainMenu-options">
                <input type="button" value="Start new route" className="mainMenu-option-button" onClick={() => props.changeScreen("newSol")}/>
                <input type="button" value="View previous routes" className="mainMenu-option-button" onClick={() => props.changeScreen("prevSol")}/>
            </div>
        </div>
    );
}

export default MainMenu;