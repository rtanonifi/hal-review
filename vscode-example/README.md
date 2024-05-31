# HAL Custom Processors Example

This is an example for how to register custom transformation processors that are
found in the workspace with the HAL VSCode extension.

The HAL extension will load any processors saved in the current workspace under
the `.hal/load/` folder.

This example contains a pre-configured `.hal/` directory with a `package.json`
and `src/` folder which are prepared as a template. Copy the `.hal/` folder to
your workspace and run `npm install` inside the `.hal/` folder.

Whenever a change to `index.ts` is made, run `npm run pack` (inside `.hal`)
and wait for completion before refreshing the `HAL` view (opened with the `Open HAL`) command.

Any processors registered in the file will immediately be available in HAL.

As example, create two text nodes, connect them with a prototype edge and
set the edge type to `demo`. Set the priority `> 0`. Upon compilation,
the graph will be replaced with a single "Hello, World" node.

You can also find a prepared example for this in the `graph.json` file, which
can be imported via the *Import* button.

You can create arbitrary transformations on `IHGraph` as transformation processors
in this way.