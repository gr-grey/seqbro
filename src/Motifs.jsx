import React, { useState, useEffect } from 'react';
import Plot from 'react-plotly.js';
import * as ort from 'onnxruntime-web';

const Motifs = () => {
    const [output, setOutput] = useState(null);

    const fetchSeq = async () => {
        const res2 = await fetch(`https://api.genome.ucsc.edu/getData/sequence?genome=hg38;chrom=chr7;start=${5530600 - 2000 - 1};end=${5530600 + 2000}`);
        const r2 = await res2.json();
        const sequence = r2.dna.toUpperCase();
        return sequence
    }

    useEffect(() => {
        const runModel = async () => {
            try {
                // Load the ONNX model
                const session = await ort.InferenceSession.create('model.onnx');
                // Prepare the input data
                const inputSequence = await fetchSeq();
                const inputArray = oneHotEncode(inputSequence);
                const tensor = new ort.Tensor('float32', inputArray, [1, 4, 4001]); // Adjust the shape if needed
                // Run the model
                const feeds = { input: tensor };
                const results = await session.run(feeds);
                // Get the output
                const outputData = results.output.data;
                setOutput(outputData);
            } catch (err) {
                console.error(err);
            }
        };
        runModel();
    }, []);
    const oneHotEncode = (seq) => {
        const mapping = { 'A': 0, 'C': 1, 'G': 2, 'T': 3 };
        const indices = Array.from(seq).map(char => mapping[char]);
        const oneHot = new Float32Array(4 * seq.length);
        indices.forEach((index, i) => {
            oneHot[i * 4 + index] = 1;
        });
        return oneHot;
    };

    // Function to plot all motifs
    const plotAllMotifs = () => {
        if (!output) return null;
        // Number of data points per motif
        const pointsPerMotif = 3973;
        // Total number of motifs
        const numMotifs = 243;
        // Create traces for each motif
        const data = [];
        for (let i = 0; i < 50; i++) { // Adjust the number of motifs to avoid crashing
            // const motif = output.slice(i * pointsPerMotif, (i + 1) * pointsPerMotif);
            const motif = output.slice(i * pointsPerMotif, (i + 1) * pointsPerMotif).map(value => parseFloat(value.toFixed(1)));

            data.push({
                x: Array.from({ length: pointsPerMotif }, (_, j) => j + 1),
                y: motif,
                type: 'scatter',
                mode: 'lines+markers',
                name: `Motif ${i + 1}`, // Optional: assign a name to each motif
            });
        }
        return (
            <div style={{ overflowX: 'scroll', width: '1000px' }}>
                <div style={{ width: '40000px' }}>
                    <Plot
                        data={data}
                        layout={{
                            title: 'All Motifs Plot',
                            width: 40000, // Set plot width to 40000px
                            xaxis: {
                                range: [0, pointsPerMotif], // Set initial x-axis range
                            },
                        }}
                        useResizeHandler={true}
                        style={{ width: '100%', height: '600px' }} // Adjust height as needed
                    />
                </div>
            </div>
        );
    };



    return (
        <div>
            <h1>Motifs</h1>
            {output ? <div>
                <pre> total output nums: {output.length}</pre>
                {plotAllMotifs()}
            </div> : <p>Loading model and running inference...</p>}
        </div>
    );
};
export default Motifs;

