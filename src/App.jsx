import React, { useState, useEffect, useRef } from 'react'
import './App.css'

function App() {
  const [seq, setSeq] = useState([]);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [center, setCenter] = useState(5531000);
  // left sequence backup
  const [lSeqBack, setLSeqBack] = useState(null);
  const sequenceDiv = useRef(null);
  const seqHalfLen = 1000
  const [displayCenter, setDisplayCenter] = useState(center);

  const fetchSeq = center => {
    const chr = 'chr7';
    const strand = '+';
    // Fetch sequence data
    return fetch(`http://localhost:5000/api/seq?chr=${chr}&center=${center}&strand=${strand}`)
      .then(res => res.json())
      .then(result => {
        const sequence = result.sequence;
        const length = sequence.length;
        const halfsize = (length - 1) / 2;
        const start = center - halfsize;
        const tooltips = sequence.split('').map((_, index) => start + index);
        const sequenceWithTooltip = sequence.split('').map((char, index) => {
          // Assign the background color base on the index (start, center, end).
          let backColor = '';
          if (index === 70 || index === 90 || index === 110 || index === 50 || (index <= 30 && index >= 10)) { backColor = 'red'; }
          if (index === halfsize || index === halfsize + 20 || index === halfsize + 40 || index === halfsize + 60 || (index <= halfsize - 20 && index >= halfsize - 40)) { backColor = 'cyan'; }
          return { char, tooltip: tooltips[index], color: backColor };
        });

        return sequenceWithTooltip;
      })
  }
  const fetchBackupLeft = center => {
    fetchSeq(center - seqHalfLen) // Fetch backup sequence half_len positions left
      .then((sequenceWithTooltip) => { setLSeqBack(sequenceWithTooltip); })
  }

  useEffect(() => {
    let initialCener = 5531000;
    setCenter(initialCener);
    fetchSeq(initialCener)
      .then(
        (sequenceWithTooltip) => { setSeq(sequenceWithTooltip); fetchBackupLeft(initialCener); },
        (error) => { console.log(error); }
      )
  }, []);

  // scroll to 50% once sequence is loaded
  useEffect(() => {
    if (seq) {
      let halfWayPoint = sequenceDiv.current.scrollWidth / 2 - sequenceDiv.current.offsetWidth / 2;
      sequenceDiv.current.scrollLeft = halfWayPoint;
      setScrollPosition(50);
      let newDisplayCenter = center + (seqHalfLen * 2 * (scrollPosition - 50) / 100);
      setDisplayCenter(Math.round(newDisplayCenter));
    }
  }, [seq]);


  const handleScroll = e => {
    const element = e.target;
    // Calculate the percentage of the scrollbar position
    let scrollPosition = (element.scrollLeft / (element.scrollWidth - element.offsetWidth)) * 100;

    setScrollPosition(scrollPosition);
    // console.log(`scroll percent ${scrollPosition}`)

    if (scrollPosition < 0.2 && lSeqBack) {
      setSeq(lSeqBack);  // Replace sequence with left backup
      setCenter(center => center - seqHalfLen);  // Move center half_len positions left
      setLSeqBack(null);  // Clear backup
      fetchBackupLeft(center); // Fetch new backup
    }

    let newDisplayCenter = center + (seqHalfLen * 2 * (scrollPosition - 50) / 100);
    setDisplayCenter(Math.round(newDisplayCenter));
  };

  return (
    <>
      <h1> Sequence viewer </h1>
      <p>Chr7 + <br/>Approx center Coord: {displayCenter}</p> 
      <div
        className="sequence-box"
        contentEditable="true"
        suppressContentEditableWarning={true} // suppress console warning
        onScroll={handleScroll}
        ref={sequenceDiv}
      >
        {seq.map((seqValue, i) => (
          <span key={i} title={seqValue.tooltip} style={{ backgroundColor: seqValue.color }}>{seqValue.char}</span>
        ))}
      </div>
    </>
  )
}

export default App
