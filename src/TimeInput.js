import React, { useState } from 'react';

function TimeInput({ onChange, prevMin, prevSec }) {
    const [minutes, setMinutes] = useState(prevMin||0);
    const [seconds, setSeconds] = useState(prevSec||0);

    const handleMinuteInput = (e) => {
        const value = parseInt(e.target.textContent) || 0;
        const clampedValue = Math.min(Math.max(value, 0), 999);
        setMinutes(clampedValue);

    }

    const handleSecondInput = (e) => {
        const value = parseInt(e.target.textContent);
        const clampedValue = Math.min(Math.max(value, 0), 59);
        setSeconds(clampedValue);
    }

    const placeCaretAfterLastTypedCharacter = (element) => {
        const selection = window.getSelection();
        const range = document.createRange();
        const textNode = element.firstChild;
        const currentPosition = window.getSelection().getRangeAt(0).endOffset;
        const lastTypedCharacterPosition = Math.max(currentPosition, 0);
        range.setStart(textNode, lastTypedCharacterPosition);
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);
    }

    const handleKeyDown = (e) => {
        const isValidKey = /^[\d]|ArrowLeft|ArrowRight|Backspace|Delete$/.test(e.key);
        const target = e.target;
      
        if (!isValidKey) {
          e.preventDefault();
        } else if (target.textContent.length > 0) {
          const selection = window.getSelection();
          const selectedText = selection.toString();
      
          if (selectedText.length > 0) {
            // Delete the selected text when a key is pressed
            const range = selection.getRangeAt(0);
            range.deleteContents();
            placeCaretAfterLastTypedCharacter(target);
          } else {
            placeCaretAfterLastTypedCharacter(target);
          }
        }
      };
      

    const handleInputChange = () => {
        onChange([minutes, seconds]);
    }

    return (
        <div className="timeInput d-inline-flex justify-content-evenly rounded">
            <section id='minutes' className='d-inline-block overflow-hidden mx-0' style={{ width: "34px" }}>
                <span
                    contentEditable
                    suppressContentEditableWarning
                    onInput={handleMinuteInput}
                    onBlur={e => { handleInputChange(); e.target.textContent = minutes || "0" }}
                    onKeyDown={handleKeyDown}
                >{prevMin.toString().padStart(1, '0')}</span>
            </section>
            <p> : </p>
            <section id='seconds' className='d-inline-block overflow-hidden mx-0' style={{ width: "24px" }}>
                <span
                    contentEditable
                    suppressContentEditableWarning
                    onInput={handleSecondInput}
                    onBlur={e => { handleInputChange(); e.target.textContent = `${seconds || 0}`.toString().padStart(2, '0')}}
                    onKeyDown={handleKeyDown}
                >{prevSec.toString().padStart(2, '0')}</span>
            </section>
        </div>
    );
}

export default TimeInput;
