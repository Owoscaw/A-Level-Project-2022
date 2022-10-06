#include "solveTSP.h"

//initialises bound to not optimal
Bound::Bound(const Graph& parentGraph):Graph(parentGraph){
	std::cout<<"Bound initialised"<<std::endl;
	isOptimal = false;
}
Bound::Bound(){
	std::cout<<"Bound initialised"<<std::endl;
	isOptimal = false;
}


//returns a path that is a solution to the travelling salesman problem
path Bound::findPath(std::string startNode){
	path tempPath;
	tempPath.startNode = startNode;
	tempPath.endNode = startNode;

	std::vector<arc> arcsToBeUsed = allArcs;
	std::vector<std::string> nodesToBeAdded = allNodes;
	std::string currentNode = startNode;
	std::string nextNode;

	while(!nodesToBeAdded.empty()){

		tempPath.path.push_back(currentNode);

		//if currentNode hasnt already been marked as visited, mark it
		if(findNode(nodesToBeAdded, currentNode) != -1){
			nodesToBeAdded.erase(nodesToBeAdded.begin() + findNode(nodesToBeAdded, currentNode));
		}
		tempPath.pathSize ++;

		//finding all nodes that need to be added, and are adjacent
		std::vector<std::string> adjacentNodes;
		for(auto const& adjIterator: adjTable[currentNode]){

			adjacentNodes.push_back(adjIterator.first);
			arc tempArc = createArc(adjIterator.second, adjIterator.first, currentNode);

			//if it is only connected to the current node, go to it then straight back
			//if it is accessible through a viable arc
			//if it is unvisited
			if((adjTable[adjIterator.first].size() == 1) && (findArc(arcsToBeUsed, tempArc) != -1) && (findNode(nodesToBeAdded, adjIterator.first) != -1)){
				tempPath.path.push_back(adjIterator.first);
				tempPath.path.push_back(currentNode);

				//arc used twice, there and back
				arcsToBeUsed.erase(arcsToBeUsed.begin() + findArc(arcsToBeUsed, tempArc));
				arcsToBeUsed.erase(arcsToBeUsed.begin() + findArc(arcsToBeUsed, tempArc));
				tempPath.pathWeight += 2*tempArc.weight;
				tempPath.pathSize += 2;

				//it is visited, and can be removed from adjacent nodes
				nodesToBeAdded.erase(nodesToBeAdded.begin() + findNode(nodesToBeAdded, adjIterator.first));
				adjacentNodes.erase(adjacentNodes.begin() + findNode(adjacentNodes, adjIterator.first));
			}
		}

		//making the next node the next accessable node
		for(auto const& nextNodeIterator: adjacentNodes){
			arc testArc = createArc(adjTable[currentNode][nextNodeIterator], currentNode, nextNodeIterator);

			//checking if the potential node has viable arcs to traverse
			bool hasViableArcs;
			int viableCount = 0;
			for(auto const& viableIterator: arcsToBeUsed){
				if((viableIterator.node1 == nextNodeIterator) || (viableIterator.node2 == nextNodeIterator)){
					viableCount ++;
				}
			}
			hasViableArcs = viableCount > 1;

			//only consider the arc if we can safely return (or it is the end of a "branch"), and it doesnt cause us to get stuck
			if(((arcCount(arcsToBeUsed, testArc) > 1) ||  hasViableArcs) && (adjTable[nextNodeIterator].size() > 1)){
				//the arc is availible, traverse to next node
				nextNode = testArc.node2;
				tempPath.pathWeight += testArc.weight;
				arcsToBeUsed.erase(arcsToBeUsed.begin() + findArc(arcsToBeUsed, testArc));
				break;
			}
		}

		//we have gotten stuck
		if((currentNode == nextNode) && (!nodesToBeAdded.empty())){
			tempPath.path.push_back("PATH TERMINATED");
			return tempPath;
		}

		//loopin back
		currentNode = nextNode;
	}

	//returning to the starting node
	path returnPath = pathBetweenNodes(currentNode, startNode);
	for(auto const& returnIterator: returnPath.path){
		if((returnIterator != tempPath.path.back() && (returnIterator != startNode))){
			tempPath.path.push_back(returnIterator);
		}
	}
	tempPath.path.push_back(startNode);

	tempPath.pathWeight += returnPath.pathWeight;
	tempPath.pathSize += returnPath.pathSize + 1;

	return tempPath;
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
			std::vector<arc> possibleArcs;
			for(auto const& adjIterator: adjTable[nodeIterator]){
				arc tempArc = createArc(adjIterator.second, adjIterator.first, nodeIterator);
				possibleArcs.push_back(tempArc);
			}

			sort(possibleArcs.begin(), possibleArcs.end(), compareArcs);


			tempGraph.addArc(possibleArcs[0]);
			tempGraph.addArc(possibleArcs[1]);

		} else{

			std::vector<arc> possibleArcs;
			for(auto const& adjIterator: adjTable[nodeIterator]){
				arc tempArc = createArc(adjIterator.second, adjIterator.first, nodeIterator);
				possibleArcs.push_back(tempArc);
			}

			tempGraph.addArc(possibleArcs[0]);
			tempGraph.addArc(possibleArcs[0]);
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

	//if a lower bound is equal in weight to an upper bound then the lower bound is optimal
	if((upperBound.weight == lowerBound.weight) || (lowerBound.containsHamiltonianCycle())){
		lowerBound.isOptimal = true;
		std::cout<<"Optimal solution found"<<std::endl;
		//a lower bound only contains a viable path if it is hamiltonian
		lowerBound.calculateFloyds();
		return lowerBound;
	}

	std::cout<<"No solution found, returning upper bound"<<std::endl;
	//an upper bound will always have a viable solution, though it may not be optimal
	upperBound.calculateFloyds();
	return upperBound;
}


int main(){
	Graph Cheddar;
	// Graph hamiltonianTest;

	Cheddar.addNode("tesco");
	Cheddar.addNode("school");
	Cheddar.addNode("bus station");
	Cheddar.addNode("wedmore");
	Cheddar.addNode("easton");
	Cheddar.addNode("weston");

	// hamiltonianTest.addNode("testNode1");
	// hamiltonianTest.addNode("testNode2");
	// hamiltonianTest.addNode("testNode3");
	// hamiltonianTest.addNode("testNode4");

	arc arc1 = createArc(7, "tesco", "school");
	arc arc2 = createArc(2, "tesco", "bus station");
	arc arc3 = createArc(11, "bus station", "school");
	arc arc4 = createArc(50, "wedmore", "school");
	arc arc5 = createArc(55, "wedmore", "bus station");
	arc arc6 = createArc(20, "bus station", "easton");
	arc arc7 = createArc(5, "wedmore", "tesco");
	arc arc8 = createArc(500, "weston", "bus station");

	// arc arc9 = createArc(1, "testNode1", "testNode2");
	// arc arc10 = createArc(1, "testNode2", "testNode3");
	// arc arc11 = createArc(1, "testNode3", "testNode4");
	// arc arc12 = createArc(1, "testNode4", "testNode1");

	arc arc13 = createArc(445, "weston", "easton");
	arc arc14 = createArc(330, "wedmore", "weston");

	Cheddar.addArc(arc1);
	Cheddar.addArc(arc2);
	Cheddar.addArc(arc3);
	Cheddar.addArc(arc4);
	Cheddar.addArc(arc5);
	Cheddar.addArc(arc6);
	Cheddar.addArc(arc7);
	Cheddar.addArc(arc8);
	Cheddar.addArc(arc13);
	Cheddar.addArc(arc14);

	// hamiltonianTest.addArc(arc9);
	// hamiltonianTest.addArc(arc10);
	// hamiltonianTest.addArc(arc11);
	// //hamiltonianTest.addArc(arc12);

	Cheddar.calculateFloyds();
	Cheddar.showGraph();

	Bound CheddarLowerBound = Cheddar;
	CheddarLowerBound.calculateLowerBound();
	std::cout<<"LOWER BOUND"<<std::endl;
	CheddarLowerBound.showGraph();

	std::cout<<CheddarLowerBound.containsHamiltonianCycle()<<std::endl;

	Bound CheddarUpperBound = Cheddar;
	CheddarUpperBound.calculateUpperBound();
	std::cout<<"UPPER BOUND"<<std::endl;
	CheddarUpperBound.showGraph();

	path UpperPath = CheddarUpperBound.findPath("weston");
	for(auto const& pathIterator: UpperPath.path){
		std::cout<<pathIterator<<std::endl;
	}

	Bound CheddarOptimalSolution = solve(Cheddar);
	CheddarOptimalSolution.showGraph();
	path optimalPath = CheddarOptimalSolution.findPath("tesco");
	for(auto const& pathIterator: optimalPath.path){
		std::cout<<pathIterator<<std::endl;
	}

	system("pause");

	return 0;
};