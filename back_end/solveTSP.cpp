#include "solveTSP.h"

//initialises bound to not optimal
Bound::Bound(const Graph& parentGraph):Graph(parentGraph){
	std::cout<<"\nBound initialised"<<std::endl;
	isOptimal = false;
}
Bound::Bound(){
	std::cout<<"\nBound initialised"<<std::endl;
	isOptimal = false;
}


//returns a path that is a solution to the travelling salesman problem
path Bound::findPath(std::string startNode){

	path newPath;

	if(!isOptimal){
		return newPath;
	}

	//keep track of unvisited nodes
	std::vector<std::string> unvisitedNodes = allNodes;
	newPath.startNode = startNode;
	newPath.endNode = startNode;
	std::string currentNode = startNode;

	//while there are still nodes to visit
	while(!unvisitedNodes.empty()){

		//getting all nodes that can be travelled to from current node
		std::vector<std::string> adjacentNodes;
		std::vector<std::string> availibleNodes;
		for(auto const& pair : adjTable[currentNode]){
			adjacentNodes.push_back(pair.first);
		}
		
		//only considering nodes that have not yet been added
		for(auto const& adjNode: adjacentNodes){
			if(std::find(unvisitedNodes.begin(), unvisitedNodes.end(), adjNode) != unvisitedNodes.end()){
				availibleNodes.push_back(adjNode);
			}
		}

		std::vector<std::string>::iterator nodeIterator = unvisitedNodes.begin();
		nodeIterator += findNode(unvisitedNodes, currentNode);
		unvisitedNodes.erase(nodeIterator);
		newPath.path.push_back(currentNode);
		newPath.pathSize ++;

		if(availibleNodes.size() == 0){
			//we have reached the end of the path
			newPath.path.push_back(startNode);
			newPath.pathWeight += adjTable[currentNode][startNode];
		} else {
			std::string nextNode = availibleNodes[0];
			newPath.pathWeight += adjTable[currentNode][nextNode];
			currentNode = nextNode;
		}
	}
	return newPath;
}


//used to compare the weights of bounds
bool compareGraphs(const Graph &graph1, const Graph &graph2){
	return graph1.weight < graph2.weight;
}


//calculates lower bound
void Bound::calculateLowerBound(){
	if(!floydsComplete){
		calculateFloyds();
	}

	std::vector<Graph> possibleSolutions;

	//selecting each node in turn
	for(auto const& nodeIterator: allNodes){

		//calculate the RMST for each node
		Graph tempGraph = findRMST(*this, nodeIterator);
		tempGraph.addNode(nodeIterator);

		if(adjTable[nodeIterator].size() > 1){

			//add the two arcs that reconnect the removed node, shortest weight
			if(isComplete()){

				//it is much easier to do this on a complete graph
				std::vector<std::string> endNodes;

				for(auto const& endIterator: tempGraph.allNodes){
					if(tempGraph.adjTable[endIterator].size() == 1){
						endNodes.push_back(endIterator);
					}
				}

				arc endArc1 = createArc(adjTable[nodeIterator][endNodes[0]], nodeIterator, endNodes[0]);
				arc endArc2 = createArc(adjTable[nodeIterator][endNodes[1]], nodeIterator, endNodes[1]);
				tempGraph.addArc(endArc1);
				tempGraph.addArc(endArc2);
			} else {

				std::vector<arc> possibleArcs;
				for(auto const& adjIterator: adjTable[nodeIterator]){
					arc tempArc = createArc(adjIterator.second, adjIterator.first, nodeIterator);
					possibleArcs.push_back(tempArc);
				}

				sort(possibleArcs.begin(), possibleArcs.end(), compareArcs);


				tempGraph.addArc(possibleArcs[0]);
				tempGraph.addArc(possibleArcs[1]);
			}

		} else{

			for(auto const& adjIterator: adjTable[nodeIterator]){
				arc tempArc = createArc(adjIterator.second, adjIterator.first, nodeIterator);
				tempGraph.addArc(tempArc);
			}
		}

		//adding this to possible solutions
		possibleSolutions.push_back(tempGraph);
	}	

	//finding the best lower bound
	sort(possibleSolutions.begin(), possibleSolutions.end(), compareGraphs);
	Graph bestSolution = possibleSolutions.back();

	*this = bestSolution;
	return;
}


//calculates upper bound
void Bound::calculateUpperBound(){
	if(!floydsComplete){
		calculateFloyds();
	}

	std::vector<Graph> possibleSolutions;

	//selecting each node in turn
	for(auto const& nodeIterator: allNodes){
		std::string currentNode = nodeIterator;

		//initialising current tour
		Graph tempGraph;
		tempGraph.distTable = distTable;
		for(auto const& initialIterator: allNodes){
			tempGraph.addNode(initialIterator);
		}

		//keeping track of unvisted nodes
		std::vector<std::string> unvisitedNodes = allNodes;

		while(true){

			//marking the current node as visited
			unvisitedNodes.erase(unvisitedNodes.begin() + findNode(unvisitedNodes, currentNode));

			//if there are now no nodes to visit, terminate
			if(unvisitedNodes.empty()){
				break;
			}

			//remove the current nodes's row from the distance matrix
			for(auto const& distIterator: allNodes){
				tempGraph.distTable[distIterator].erase(currentNode);
			}

			//find all the possible arcs remaining
			std::vector<arc> possibleArcs;
			for(auto const& arcIterator: tempGraph.distTable[currentNode]){
				arc possibleArc = createArc(arcIterator.second, arcIterator.first, currentNode);
				possibleArcs.push_back(possibleArc);
			}

			//sort the possible arcs to find the shortest one that visits an unvisited node
			sort(possibleArcs.begin(), possibleArcs.end(), compareArcs);
			arc shortestArc = possibleArcs[0];

			//adding the shortest arc into the graph
			if(adjTable[shortestArc.node1][shortestArc.node2] == shortestArc.weight){

				//the arc is a valid, direct, arc in the original graph so it can be added without issue
				tempGraph.addArc(shortestArc);
			} else{

				//the arc does not represent a true arc in the original graph, so it needs to be
				//broken down into the full path
				path truePath = pathBetweenNodes(shortestArc.node1, shortestArc.node2);
				for(int trueIterator = 0; trueIterator < truePath.path.size() - 1; trueIterator ++){
					std::string fromNode = truePath.path[trueIterator];
					std::string toNode = truePath.path[trueIterator + 1];

					arc currentArc = createArc(distTable[toNode][fromNode], toNode, fromNode);
					tempGraph.addArc(currentArc);
				}
			}

			//selecting the next node to visit
			currentNode = shortestArc.node1;
		}

		//return to the starting node using the shortest availible path
		path returnPath = pathBetweenNodes(currentNode, nodeIterator);
		for(int returnIterator = 0; returnIterator < returnPath.path.size() - 1; returnIterator ++){
			std::string returnFromNode = returnPath.path[returnIterator];
			std::string returnToNode = returnPath.path[returnIterator + 1];

			arc returnArc = createArc(distTable[returnToNode][returnFromNode], returnToNode, returnFromNode);
			tempGraph.addArc(returnArc);
		}

		possibleSolutions.push_back(tempGraph);
	}

	sort(possibleSolutions.begin(), possibleSolutions.end(), compareGraphs);
	*this = possibleSolutions[0];

	return;
}


//solves the travelling salesman problem
Bound solve(Graph tempGraph){
	Bound upperBound = tempGraph;
	Bound lowerBound = tempGraph;

	upperBound.calculateUpperBound();
	lowerBound.calculateLowerBound();

	if(lowerBound.containsHamiltonianCycle()){
		lowerBound.isOptimal = true;
		std::cout<<"solution found"<<std::endl;
		lowerBound.calculateFloyds();
		return lowerBound;
	}

	std::cout<<"solution not found"<<std::endl;
	//an upper bound will always have a viable solution, though it may not be optimal
	upperBound.calculateFloyds();
	return upperBound;
}


int main(){
	//Graph Cheddar;

	// Cheddar.addNode("tesco");
	// Cheddar.addNode("school");
	// Cheddar.addNode("bus station");
	// Cheddar.addNode("wedmore");
	// Cheddar.addNode("easton");
	// Cheddar.addNode("weston");

	// arc arc1 = createArc(7, "tesco", "school");
	// arc arc2 = createArc(2, "tesco", "bus station");
	// arc arc3 = createArc(11, "bus station", "school");
	// arc arc4 = createArc(50, "wedmore", "school");
	// arc arc5 = createArc(55, "wedmore", "bus station");
	// arc arc6 = createArc(20, "bus station", "easton");
	// arc arc7 = createArc(5, "wedmore", "tesco");
	// arc arc8 = createArc(500, "weston", "bus station");

	// arc arc13 = createArc(445, "weston", "easton");
	// arc arc14 = createArc(330, "wedmore", "weston");

	// Cheddar.addArc(arc1);
	// Cheddar.addArc(arc2);
	// Cheddar.addArc(arc3);
	// Cheddar.addArc(arc4);
	// Cheddar.addArc(arc5);
	// Cheddar.addArc(arc6);
	// Cheddar.addArc(arc7);
	// Cheddar.addArc(arc8);
	// Cheddar.addArc(arc13);
	// Cheddar.addArc(arc14);

	// Cheddar.calculateFloyds();
	// Cheddar.showGraph();

	// Bound CheddarLowerBound = Cheddar;
	// CheddarLowerBound.calculateLowerBound();
	// std::cout<<"LOWER BOUND"<<std::endl;
	// CheddarLowerBound.showGraph();

	// std::cout<<CheddarLowerBound.containsHamiltonianCycle()<<std::endl;

	// Bound CheddarUpperBound = Cheddar;
	// CheddarUpperBound.calculateUpperBound();
	// std::cout<<"UPPER BOUND"<<std::endl;
	// CheddarUpperBound.showGraph();

	// path UpperPath = CheddarUpperBound.findPath("weston");
	// for(auto const& pathIterator: UpperPath.path){
	// 	std::cout<<pathIterator<<std::endl;
	// }

	// Bound CheddarOptimalSolution = solve(Cheddar);
	// CheddarOptimalSolution.showGraph();
	// path optimalPath = CheddarOptimalSolution.findPath("tesco");
	// for(auto const& pathIterator: optimalPath.path){
	// 	std::cout<<pathIterator<<std::endl;
	// }

	// Graph hamiltonianTest;

	// hamiltonianTest.addNode("n1");
	// hamiltonianTest.addNode("n2");
	// hamiltonianTest.addNode("n3");
	// hamiltonianTest.addNode("n4");

	// hamiltonianTest.addArc(createArc(2, "n1", "n2"));
	// hamiltonianTest.addArc(createArc(4, "n1", "n3"));
	// hamiltonianTest.addArc(createArc(1, "n1", "n4"));
	// hamiltonianTest.addArc(createArc(6, "n2", "n3"));
	// hamiltonianTest.addArc(createArc(9, "n2", "n4"));
	// hamiltonianTest.addArc(createArc(18, "n3", "n4"));

	//std::cout<<hamiltonianTest.containsHamiltonianCycle()<<std::endl;

	//Bound hamiltonianBound = solve(hamiltonianTest);
	// Bound hamiltonianLowerBound = hamiltonianTest;
	// hamiltonianLowerBound.calculateLowerBound();

	// hamiltonianLowerBound.showGraph();

	// std::cout<<hamiltonianLowerBound.containsHamiltonianCycle()<<std::endl;

	Graph solGraph;

	std::ifstream jsonFile("data.json");
	Json::Value solJson;
	Json::Reader jsonReader;

	jsonReader.parse(jsonFile, solJson);
	Json::Value solNodes = solJson["nodes"];
	Json::Value solArcs = solJson["arcs"];
	std::string startNode = solJson["startNode"].asString();

	for(int i = 0; i < solNodes.size(); i++){
		std::string currentNode = solNodes[i].asString();
		solGraph.addNode(currentNode);
	}

	for(int j = 0; j < solArcs.size(); j++){
		Json::Value currentArc = solArcs[j];
		int currentArcWeight = currentArc["weight"].asInt();
		std::string solNode1 = currentArc["node1"].asString();
		std::string solNode2 = currentArc["node2"].asString();

		arc newSolArc = createArc(currentArcWeight, solNode1, solNode2);
		solGraph.addArc(newSolArc);
	}

	Bound solBound = solve(solGraph);

	path solPath = solBound.findPath(startNode);
	Json::Value path;
	for(int k = 0; k < solPath.pathSize + 1; k++){
		path[k] = solPath.path[k];
	}
	solJson["path"] = path;

	Json::StreamWriterBuilder builder;
	builder["commentStyle"] = "None";
	builder["indentation"] = "	";

	std::unique_ptr<Json::StreamWriter> writer(builder.newStreamWriter());
	std::ofstream outputFileStream("data.json");
	writer -> write(solJson, &outputFileStream);

	return 0;
};