import { TransformationProcessor } from "@pragmatic-programming/ihgraph";
import { IHGraph, SimpleNode, SimpleNodeContent, assert } from "@pragmatic-programming/ihgraph";

import {CICDProcessor} from "./CICDProcessor"
import {SequenceProcessor} from "./SequenceProcessor"

class DemoProcessor extends TransformationProcessor {

    getId() {
        return "demo"
    };

    getName() {
        return "demo"
    }

    process() {
        const targetGraph = this.createTargetGraph();
        const sourceNode = targetGraph.createSimpleNode("Hello");
        sourceNode.setContent("World");
        this.setModel(targetGraph);
    }

    processAsync() {
        console.log("Process async...")
        return new Promise<void>(resolve => console.log("Processing test processor async..."));
    }

    createTargetGraph() {
        return new IHGraph();
    }
}

const _window = (window as any);
if (_window.__additionalProcessors == undefined)
    _window.__additionalProcessors = [];
_window.__additionalProcessors.push(["demo", DemoProcessor]);

_window.__additionalProcessors.push(["ci", CICDProcessor]);
_window.__additionalProcessors.push(["ci:needs", SequenceProcessor]);