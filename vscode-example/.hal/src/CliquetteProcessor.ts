import { IHGraph, SimpleNode, SimpleNodeContent, assert, TransformationProcessor, IHNode } from "@pragmatic-programming/ihgraph";
import { Property } from "@pragmatic-programming/kico";


export class CliquetteProcessor extends TransformationProcessor {

    // The clique that was identified by the CSP. This is used for the replacement.
    public static readonly NEXT_CLIQUE_ORIGIN: Property<IHGraph | null> =
        new Property<IHGraph | null>("HAL.clique.next.origin", () => null);
    
    // The current working copy of the next clique.
    public static readonly NEXT_CLIQUE: Property<IHGraph | null> =
        new Property<IHGraph | null>("HAL.clique.next", () => null);

    // The new clique that will replace the old clique.
    public static readonly NEW_CLIQUE: Property<IHGraph | null> =
        new Property<IHGraph | null>("HAL.clique.new", () => null);

    // The next clique is a model extension. (obsolete?)
    public static readonly NEXT_CLIQUE_MODEL_EXTENSION: Property<boolean> =
        new Property<boolean>("HAL.clique.next.model.extension", () => true);


    // protected getCurrentClique(): IHGraph {
    //     const graph = this.getModel();
    //     const nextClique = this.getNextClique();

    //     if (nextClique == null) {
    //         return graph;
    //     } else {
    //         return graph.getClique(nextClique.);
    //     }

    //     return graph;
    // }

    protected getCurrentClique(): IHGraph {
        return this.getNextClique();
    }


    protected getNextClique(): IHGraph {
        const clique = this.getProperty(CliquetteProcessor.NEXT_CLIQUE);

        if (clique == null) {
            if (this.getProperty(CliquetteProcessor.NEXT_CLIQUE_MODEL_EXTENSION)) {
                return this.getModel();
            } else {
                throw new Error("Next clique is empty!");
            }
        }

        return clique;
    }

    protected setNextClique(clique: IHGraph): void {
        this.setProperty(CliquetteProcessor.NEXT_CLIQUE, clique);
    }

    protected setNewClique(clique: IHGraph): void {
        this.setProperty(CliquetteProcessor.NEW_CLIQUE, clique);
        this.executeCliqueReplacement();
    }

    protected isImmediate(): boolean {
        const graph = this.getNextClique();
        return graph.getEdgeTypes().every(edgeType => edgeType.isImmediate());
    }

    protected set(): void {
        this.setNewClique(this.getNextClique());
    }

    /**
     * All simple nodes without incoming edges (source nodes)
     * 
     * @returns
     */
    protected getSourceNodes(): SimpleNode[] {
        const graph = this.getNextClique();
        return graph.getSimpleNodes().filter(node => node.getIncomingEdges().length === 0);
    }

    /**
     * All simple nodes with incoming edges (being target of an edge)
     * 
     * @returns 
     */
    protected getTargetNodes(): SimpleNode[] {
        const graph = this.getNextClique();
        return graph.getSimpleNodes().filter(node => node.getIncomingEdges().length > 0);
    }

    /**
     * All simple nodes that serve as sinks in the clique (no outgoing edges)
     * 
     * @returns 
     */
    protected getSinkNodes(): SimpleNode[] {
        const graph = this.getNextClique();
        return graph.getSimpleNodes().filter(node => node.getOutgoingEdges().length === 0);
    }

    /**
     * Breadth-first unrolled list of all nodes in the clique, starting at source
     * nodes and ending in sink nodes.
     * @returns 
     */
    protected getCliqueNodes(): SimpleNode[] {
        const visited = new Set<SimpleNode>();
        const result = new Array<SimpleNode>();

        const nodes = this.getSourceNodes();
        while (nodes.length > 0) {
            const node: SimpleNode = nodes[0]
            visited.add(node);
            const newNodes = node.getOutgoingEdges()
                //.filter(edge => edge.getTargetNode() instanceof SimpleNode)
                .map(edge => edge.getTargetNode() as SimpleNode)
                .filter(node => !visited.has(node) && !nodes.includes(node));
            result.push(nodes.shift()!);
            nodes.push(...newNodes);
        }

        return result;
    }

    protected executeCliqueReplacement(): void {
        const nextClique = this.getProperty(CliquetteProcessor.NEXT_CLIQUE_ORIGIN);
        const newClique = this.getProperty(CliquetteProcessor.NEW_CLIQUE);

        if (newClique != null && nextClique != null) {
            const graph = this.getModel()
            graph.replaceClique(nextClique, newClique);
            assert(graph.consistency());
            this.setModel(graph);
        }
    }

    protected getContents(): SimpleNodeContent[] {
        const contents: SimpleNodeContent[] = [];

        const graph = this.getNextClique();
        graph.getSimpleNodes().forEach(node => {
            const content = node.getContent();
            contents.push(content);
        });

        return contents;
    }

    protected createTargetGraph(): IHGraph {
        return new IHGraph();
    }

    protected getLabelFor(node : IHNode) : string {
        return node.getAnnotation<any>("nodeData")?.data.label
    }

    protected setLabelFor(node : IHNode, label : string) {
        node.getAnnotation<any>("nodeData")!.data.label = label;
    }
}