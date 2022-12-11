#ifndef GRAPH_H
#define GRAPH_H

#include <iostream>
#include <string>
#include <map>
#include <iterator>
#include <vector>
#include <algorithm>
#include <iomanip>
#include <fstream>
#include "jsoncpp/dist/json/json.h"
#include "jsoncpp/dist/json/json-forwards.h"
#include "jsoncpp/dist/jsoncpp.cpp"



class Arc {
    public:
        std::string node1;
        std::string node2;
        int weight;

        Arc(int Iweight, std::string Inode1, std::string Inode2);

        bool operator==(Arc compArc){
            bool node1Match = (this->node1 == compArc.node1) || (this->node1 == compArc.node2);
            bool node2Match = (this->node2 == compArc.node1) || (this->node2 == compArc.node2);
            return (node1Match && node2Match);
        };

        bool operator<(Arc compArc){
            return this->weight < compArc.weight;
        }

        bool operator>(Arc compArc){
            return this->weight > compArc.weight;
        }

        Arc operator=(Arc compArc){
            this->node1 = compArc.node1;
            this->node2 = compArc.node2;
            this->weight = compArc.weight;
            return *this;
        }
};



class Path {
    public:
        std::vector<std::string> nodeSequence;
        std::vector<Arc> arcSequence;
        std::string startNode;
        std::string endNode;
        int pathWeight;

        Path(std::vector<std::string> Isequence);

        void arcify(std::map<std::string, std::map<std::string, int>> adjMatrix);
};



class Graph {
    public:
        std::map<std::string, std::map<std::string, int>> adjMatrix;

        std::map<std::string, std::map<std::string, int>> distTable;
		std::map<std::string, std::map<std::string, std::string>> routeTable;

        bool floydComplete;
        bool optimal;

        std::vector<std::string> allNodes;
		std::vector<Arc> allArcs;
		int weight;

        Graph();

		void addNode(std::string nodeName);

		void removeNode(std::string nodeName);

		void addArc(Arc arcName);

		void removeArc(Arc arcName);

        void calculateFloyds();

        Path pathBetweenNodes(std::string node1, std::string node2);

        bool containsCycle();

        Graph getRMST(std::string nodeName);

        Path findHamiltonianCycle(std::string startNode);

        Graph getLowerBound();

        Graph getUpperBound();

        Graph operator=(Graph compGraph){
            this->adjMatrix = compGraph.adjMatrix;
            this->allNodes = compGraph.allNodes;
            this->allArcs = compGraph.allArcs;
            this->routeTable = compGraph.routeTable;
            this->distTable = compGraph.distTable;
            this->floydComplete = compGraph.floydComplete;
            this->weight = compGraph.weight;
            return *this;
        }

        bool operator<(Graph compGraph){
            return this->weight < compGraph.weight;
        }

        bool operator>(Graph compGraph){
            return this->weight > compGraph.weight;
        }

        void showGraph();

    private:

        Graph getMST();

        bool areAdjacent(std::string node1, std::string node2);
};



int findNode(std::string nodeName, std::vector<std::string> searchVector);

int findArc(Arc arcName, std::vector<Arc> searchVector);

#endif