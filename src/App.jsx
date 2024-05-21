import React, { useState, useEffect, useRef } from 'react'
import './App.css'

function App() {
  const [seq, setSeq] = useState([]);
  // const [scrollPosition, setScrollPosition] = useState(0);
  const [center, setCenter] = useState(5531000);
  const seqDiv = useRef(null);
  const [displayCenter, setDisplayCenter] = useState(center);
  const [lb, setLb] = useState([]); // Left buffer
  const [rb, setRb] = useState([]); // Right buffer
  const lThresh = 50 / 4001;
  const rThresh = 3951 / 4001;

  const fetchSeq = async (center, length = 4001) => {
    const chr = 'chr7';
    const strand = '+';
    const halflen = (length - 1) / 2;
    const res = await fetch(`http://localhost:5000/api/seq?chr=${chr}&center=${center}&len=${halflen}&strand=${strand}`);
    const result = await res.json();
    const sequence = result.sequence;
    const start = center - halflen;
    const tooltips = sequence.split('').map((_, index) => start + index);
    return sequence.split('').map((char, index) => {
      let backColor = '';
      if (index <= 151 && index >= 50) { backColor = 'green'; }
      if (index <= halflen + 151 && index >= halflen + 50) { backColor = 'red'; }
      if (index <= length - 51 && index >= length - 150) { backColor = 'yellow'; }
      if (index === halflen || index == 0 || index == length-1) { backColor = 'cyan'; }
      return { char, tooltip: tooltips[index], color: backColor }
    });
  }

  // load initial sequence
  useEffect(() => {
    let initialCenter = 5531000; setCenter(initialCenter);

    const initialize = async () => {
      const initialSeq = await fetchSeq(initialCenter);
      // const halflen = (initialSeq.length - 1) / 2;
      setSeq(initialSeq);
      // scroll to 50 %
      setTimeout(() => {
        const halfway = (seqDiv.current.scrollWidth - seqDiv.current.clientWidth) / 2;
        seqDiv.current.scrollLeft = halfway;
        setDisplayCenter(initialCenter);
      }, 0);
      const lb = await fetchSeq(initialCenter - 4000, 4001); setLb(lb);
      const rb = await fetchSeq(initialCenter + 4000, 4001); setRb(rb);
    }
    initialize();
  }, []);

  // base on new ceter point
  const updateLBuff = async (newCen) => {
    const lCen = newCen - 5000;
    const newL = await fetchSeq(lCen, 2001);
    const newlb = newL.concat(lb.slice(1, 2001))
    setLb(newlb)
  }

  const updateRBuff = async (newCen) => {
    const rCen = newCen + 5000;
    const newR = await fetchSeq(rCen, 2001);
    const newrb = rb.slice(2000, -1).concat(newR)
    console.log(`newR len ${newR.length}`)
    console.log(`newrb len ${newrb.length}`)
    setRb(newrb)
  }

  // when scroll past left 5%, pad 5% and reset it to 5%

  const handleScroll = () => {

    const elem = seqDiv.current;
    const lmax = elem.scrollWidth - elem.clientWidth;
    const scrollPos = elem.scrollLeft / lmax;
    const visibleLen = 4001 / elem.scrollWidth * elem.clientWidth; // num of visible chars
    // setScrollPosition(scrollPos);
    const resetPos = 2100 / 4001 * lmax;
    const resetPosR = 1900 / 4001 * lmax;

    if (scrollPos < lThresh) {

      const newhead = lb.slice(2000,); // len should be 2001
      const oldtail = seq.slice(1, 2001); // 2000
      const newseq = newhead.concat(oldtail);  setSeq(newseq);
      const newCen = center - 2000;            setCenter(newCen);
      elem.scrollLeft = resetPos;              //setScrollPosition(resetPos);
      updateLBuff(newCen);
    }

    if (scrollPos > rThresh) {

      const rbhead = rb.slice(0, 2001); // len should be 2001
      const seqtail = seq.slice(2000,-1); // 2000
      console.log(`seq tail ${seqtail.length}`)
      const newseq = seqtail.concat(rbhead);   setSeq(newseq);
      const newCen = center + 2000;            setCenter(newCen);
      elem.scrollLeft = resetPosR;              //setScrollPosition(resetPos);
      updateRBuff(newCen);
    }

    let seqBoxCenCoord = 4001 * scrollPos + center - 2000 - (scrollPos - 0.5) * visibleLen ;
    setDisplayCenter(Math.round(seqBoxCenCoord));
  };

  return (
    <>
      <h1> Sequence viewer </h1>
      <p>Chr7 + <br />Center Coord: {displayCenter}</p>

      <div className="sequence-box-wrapper">
        <div className="sequence-box" ref={seqDiv} contentEditable="true" suppressContentEditableWarning={true} onScroll={handleScroll}>
          {seq.map((seqVal, i) => (
            <span key={i} title={seqVal.tooltip} style={{ backgroundColor: seqVal.color }}>{seqVal.char}</span>
          ))}
        </div>
        <div className="middle-marker"></div>
      </div>

    </>
  )
}

export default App