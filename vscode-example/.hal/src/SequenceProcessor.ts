import { CliquetteProcessor } from "./CliquetteProcessor";
import { Job } from './CICDProcessor'

export class SequenceProcessor extends CliquetteProcessor {

    public getId(): string {
        return "ci:needs";
    }

    public getName(): string {
        return "ci:needs";
    }

    public process() {
        const targetGraph = this.createTargetGraph();

        const targetNode = targetGraph.createSimpleNode("CI/CD Configuration");
        const cliqueNodes = this.getCliqueNodes();

        let config : any = {};

        cliqueNodes.forEach(node => {

            const job : Job = JSON.parse(node.getContent() + "");

            job.needs =  node.getIncomingEdges()
                 .map(edge => edge.getSourceNode())
                 .map(node => this.getLabelFor(node))

            config[job.name] = job;

        });
        targetNode.setContent(JSON.stringify(config, null, "\t"));
        this.setModel(targetGraph);
    }
}