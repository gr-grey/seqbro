from flask import Flask, jsonify, request
from flask_cors import CORS
from pyfaidx import Fasta

GENOME = '/Users/ruiguo/Documents/bigFiles/hg38.fa'
app = Flask(__name__)
CORS(app)

def getseq(chr, start, end, strand):
    genome = Fasta(GENOME)
    seq = genome.get_seq(chr, start, end)
    final_seq = seq.reverse.complement if strand == '-' else seq
    return str(final_seq).upper()

@app.route('/api/seq')
def get_sequence():
    chr = request.args.get('chr')
    center = int(request.args.get('center'))
    strand = request.args.get('strand')
    start = center - 1050
    end = center + 1050
    seq = getseq(chr, start, end, strand)
    return jsonify({'sequence':seq, 'chr':chr})

if __name__ == "__main__":
    app.run(debug=True)