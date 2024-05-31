import React, { useState, useEffect } from 'react';
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
                console.log(inputArray);
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
    return (
        <div>
            <h1>Motifs</h1>
            {output ? <pre> total output nums: {output.length}</pre> : <p>Loading model and running inference...</p>}
        </div>
    );
};
export default Motifs;

