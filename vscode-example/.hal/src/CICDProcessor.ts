import {CliquetteProcessor} from './CliquetteProcessor'

export type Job = {
    name : string,
    script : string;
    needs? : string[]
}

export class CICDProcessor extends CliquetteProcessor {

    getId(): string {
        return "ci"
    }

    getName(): string {
        return "ci"
    }

    public process() {
            const targetGraph = this.createTargetGraph();

            
            const cliqueNodes = this.getNextClique().getSimpleNodes();

            let jobs : any = {}
    
            cliqueNodes.forEach(node => {

                const job : Job = {
                    name: this.getLabelFor(node),
                    script: node.getContent() + "",
                    // needs: node.getIncomingEdges()
                    //     .map(edge => edge.getSourceNode())
                    //     .map(node => this.getJobName(node))
                };
                const jobNode = targetGraph.createSimpleNode(job.name);
                jobNode.setContent(JSON.stringify(job, null, "\t"));
                targetGraph.addNode(jobNode);
                jobs[job.name] = jobNode;
                targetGraph.addNode(jobNode);
            });

            this.getNextClique().getEdges().forEach(edge => {
                targetGraph.createTransformationEdge(
                    targetGraph.createEdgeType("ci:needs", 1), 
                    jobs[this.getLabelFor(edge.getSourceNode())], 
                    jobs[this.getLabelFor(edge.getTargetNode())]
                );

                // edge.setTargetNode(jobs[this.getJobName(edge.getTargetNode())]);
                // edge.setSourceNode(jobs[this.getJobName(edge.getSourceNode())]);
                // edge.setType(targetGraph.createEdgeType("ci:needs", 1)); 
            });
          
            this.setModel(targetGraph);
    }
}