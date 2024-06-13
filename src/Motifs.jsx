import React, { useState, useEffect, useRef } from 'react';
import Plot from 'react-plotly.js';
import * as ort from 'onnxruntime-web';

const Motifs = () => {
    const [output, setOutput] = useState(null);
    const scrollContainerRef = useRef(null);

    const halfLen = 2000

    const fetchSeq = async () => {
        const res2 = await fetch(`https://api.genome.ucsc.edu/getData/sequence?genome=hg38;chrom=chr7;start=${5536000 - halfLen - 1 - 14};end=${5536000 + halfLen + 14}`); // padd 14 on each to make output the same as seq len
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
                const tensor = new ort.Tensor('float32', inputArray, [1, 4, halfLen * 2 + 29]); // Hard coded dimension for now
                // Run the model
                const feeds = { input: tensor };
                const results = await session.run(feeds);
                const outputData = results.output.data;
                setOutput(outputData);
            } catch (err) { console.error(err); }
        };
        runModel();
    }, []);

    useEffect(() => {
        if (scrollContainerRef.current) {
            // Set scroll position to the middle (50%) after the output is set
            scrollContainerRef.current.scrollLeft = scrollContainerRef.current.scrollWidth / 2 - scrollContainerRef.current.clientWidth / 2;
        }
    }, [output]);

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
        const pointsPerMotif = halfLen * 2 + 1;
        const numMotifs = 243;
        const data = [];

        for (let i = 0; i < numMotifs; i++) { 
            // reduce precision to 2 digit after decimal
            const motif = output.slice(i * pointsPerMotif, (i + 1) * pointsPerMotif).map(value => parseFloat(value.toFixed(2)));
            const allZero = motif.every(value => value === 0);
            if (allZero) continue; // Skip this motif if all values are zero
            data.push({
                x: Array.from({ length: pointsPerMotif }, (_, j) => j + 1),
                y: motif,
                type: 'scatter',
                mode: 'lines',
                name: `Motif ${i + 1}`, 
            });
        }

        return (
            <div ref={scrollContainerRef}  style={{ overflowX: 'scroll', width: '1000px' }}>
                <div style={{ width: `${halfLen*20}px` }}>
                    <Plot data={data} useResizeHandler={true} style={{ width: '100%', height: '300px' }} 
                        layout={{ showlegend:false, }}
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

