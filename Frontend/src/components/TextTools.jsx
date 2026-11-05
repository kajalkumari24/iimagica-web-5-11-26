import React, { useState, useEffect } from 'react';

const TextTools = ({ fabricRef, selectedText }) => {
  const [textOptions, setTextOptions] = useState({
    fontSize: 24,
    fill: '#000000',
    fontFamily: 'Arial',
  });

  useEffect(() => {
    if (selectedText) {
      setTextOptions({
        fontSize: selectedText.fontSize,
        fill: selectedText.fill,
        fontFamily: selectedText.fontFamily,
      });
    }
  }, [selectedText]);

  const addText = () => {
    const text = new fabric.Textbox('Your Text Here', {
      left: 100,
      top: 100,
      ...textOptions,
    });
    fabricRef.current.add(text);
    fabricRef.current.setActiveObject(text);
  };

  const updateText = (prop, value) => {
    if (!selectedText) return;
    selectedText.set(prop, value);
    fabricRef.current.renderAll();
    setTextOptions((prev) => ({ ...prev, [prop]: value }));
  };

  const deleteText = () => {
    if (!selectedText) return;
    fabricRef.current.remove(selectedText);
    fabricRef.current.discardActiveObject();
  };

  return (
    <div>
      <button onClick={addText}>Add Text</button>
      {selectedText && (
        <>
          <div>
            <label>Font Size:</label>
            <input
              type="number"
              value={textOptions.fontSize}
              onChange={(e) => updateText('fontSize', parseInt(e.target.value, 10))}
            />
          </div>
          <div>
            <label>Color:</label>
            <input
              type="color"
              value={textOptions.fill}
              onChange={(e) => updateText('fill', e.target.value)}
            />
          </div>
          <div>
            <label>Font Family:</label>
            <select
              value={textOptions.fontFamily}
              onChange={(e) => updateText('fontFamily', e.target.value)}
            >
              <option value="Arial">Arial</option>
              <option value="Verdana">Verdana</option>
              <option value="Times New Roman">Times New Roman</option>
              <option value="Courier New">Courier New</option>
              <option value="Georgia">Georgia</option>
            </select>
          </div>
          <button onClick={deleteText}>Delete Text</button>
        </>
      )}
    </div>
  );
};

export default TextTools;
