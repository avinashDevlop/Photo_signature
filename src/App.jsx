import { useState, useRef } from 'react';
import './App.css';

function App() {
  const [persons, setPersons] = useState([]);
  const fileInputRefs = useRef({});
  const [isMerged, setIsMerged] = useState(false);
  const [dpi, setDpi] = useState(150);
  const [quality, setQuality] = useState(0.7);
  const [isDownloadingAll, setIsDownloadingAll] = useState(false);

  const handleAddPerson = () => {
    setPersons([...persons, { id: Date.now(), photo: null, signature: null }]);
  };

  const handleRemovePerson = (id) => {
    setPersons(persons.filter(person => person.id !== id));
  };

  const handleFileChange = (id, type, e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setPersons(persons.map(person => 
        person.id === id ? { ...person, [type]: event.target.result } : person
      ));
    };
    reader.readAsDataURL(file);
  };

  const handleMerge = () => {
    if (persons.every(p => p.photo && p.signature)) {
      setIsMerged(true);
    } else {
      alert('Please upload both photo and signature for all persons before merging.');
    }
  };

  const handleReset = () => {
    setPersons([]);
    setIsMerged(false);
  };

  const triggerFileInput = (id, type) => {
    fileInputRefs.current[`${id}-${type}`].click();
  };

  const cmToPixels = (cm) => Math.round(cm * 0.393701 * dpi);

  const compressImage = (dataUrl, targetSizeKB = 100, callback) => {
    const img = new Image();
    img.onload = function() {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      let quality = 0.9;
      let compressedDataUrl;
      
      const compress = () => {
        compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        const sizeKB = (compressedDataUrl.length * 0.75) / 1024;
        
        if (sizeKB <= targetSizeKB || quality <= 0.1) {
          callback(compressedDataUrl);
        } else {
          quality -= 0.1;
          setTimeout(compress, 0);
        }
      };
      
      compress();
    };
    img.src = dataUrl;
  };

  const handleDownload = (person, index) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    canvas.width = cmToPixels(3.5);
    canvas.height = cmToPixels(4.5);
    
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    const photoImg = new Image();
    photoImg.onload = function() {
      ctx.drawImage(photoImg, 0, 0, canvas.width, canvas.height);
      
      const sigImg = new Image();
      sigImg.onload = function() {
        const sigHeight = cmToPixels(1.5);
        const sigWidth = cmToPixels(3.5);
        ctx.drawImage(sigImg, 0, canvas.height - sigHeight, sigWidth, sigHeight);
        
        compressImage(canvas.toDataURL('image/jpeg', quality), 100, (compressedDataUrl) => {
          const link = document.createElement('a');
          link.download = `person-${index + 1}-${dpi}dpi.jpg`;
          link.href = compressedDataUrl;
          link.click();
        });
      };
      sigImg.src = person.signature;
    };
    photoImg.src = person.photo;
  };

  const handleDownloadAll = () => {
    if (isDownloadingAll) return;
    
    setIsDownloadingAll(true);
    
    const downloadNext = (index = 0) => {
      if (index >= persons.length) {
        setIsDownloadingAll(false);
        return;
      }
      
      handleDownload(persons[index], index);
      
      // Add slight delay between downloads to prevent browser blocking
      setTimeout(() => {
        downloadNext(index + 1);
      }, 300);
    };
    
    downloadNext();
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-content">
          <h1>ID Photo & Signature Merger</h1>
          <p>Create professional documents with exact dimensions (JPG under 100KB)</p>
        </div>
      </header>

      <main className="app-main">
        {!isMerged ? (
          <>
            <div className="settings-panel">
              <div className="settings-grid">
                <div className="setting-group">
                  <label>Output DPI:</label>
                  <select value={dpi} onChange={(e) => setDpi(parseInt(e.target.value))}>
                    <option value="72">72 (Screen)</option>
                    <option value="96">96 (Default)</option>
                    <option value="150">150 (Basic Print)</option>
                    <option value="300">300 (High Quality Print)</option>
                  </select>
                </div>
                
                <div className="setting-group">
                  <label>JPG Quality:</label>
                  <select value={quality} onChange={(e) => setQuality(parseFloat(e.target.value))}>
                    <option value="0.9">High (90%)</option>
                    <option value="0.7">Medium (70%)</option>
                    <option value="0.5">Low (50%)</option>
                  </select>
                </div>
              </div>
              
              <div className="dimension-info">
                <div className="dimension-item">
                  <span className="dimension-label">Photo:</span>
                  <span className="dimension-value">3.5×4.5cm ({cmToPixels(3.5)}×{cmToPixels(4.5)}px)</span>
                </div>
                <div className="dimension-item">
                  <span className="dimension-label">Signature:</span>
                  <span className="dimension-value">3.5×1.5cm ({cmToPixels(3.5)}×{cmToPixels(1.5)}px)</span>
                </div>
              </div>
            </div>

            <div className="person-list">
              {persons.length === 0 && (
                <div className="empty-state">
                  <div className="empty-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                      <circle cx="9" cy="7" r="4"></circle>
                      <line x1="19" y1="8" x2="19" y2="14"></line>
                      <line x1="22" y1="11" x2="16" y2="11"></line>
                    </svg>
                  </div>
                  <h3>No persons added yet</h3>
                  <p>Click the button below to get started</p>
                </div>
              )}

              {persons.map((person) => (
                <div key={person.id} className="person-card">
                  <div className="person-card-header">
                    <h3>Person {persons.indexOf(person) + 1}</h3>
                    {persons.length > 1 && (
                      <button 
                        onClick={() => handleRemovePerson(person.id)}
                        className="remove-person-btn"
                        aria-label="Remove person"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="18" y1="6" x2="6" y2="18"></line>
                          <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                      </button>
                    )}
                  </div>
                  
                  <div className="upload-section">
                    <div 
                      className="upload-box photo-upload" 
                      onClick={() => triggerFileInput(person.id, 'photo')}
                      style={{
                        width: `${cmToPixels(3.5)}px`,
                        height: `${cmToPixels(4.5)}px`
                      }}
                    >
                      {person.photo ? (
                        <img src={person.photo} alt="Uploaded photo" className="preview-image" />
                      ) : (
                        <div className="upload-placeholder">
                          <div className="upload-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                              <circle cx="8.5" cy="8.5" r="1.5"></circle>
                              <polyline points="21 15 16 10 5 21"></polyline>
                            </svg>
                          </div>
                          <p>Photo (3.5×4.5cm)</p>
                        </div>
                      )}
                      <input
                        type="file"
                        ref={el => fileInputRefs.current[`${person.id}-photo`] = el}
                        onChange={(e) => handleFileChange(person.id, 'photo', e)}
                        accept="image/*"
                        hidden
                      />
                    </div>

                    <div 
                      className="upload-box signature-upload"
                      onClick={() => triggerFileInput(person.id, 'signature')}
                      style={{
                        width: `${cmToPixels(3.5)}px`,
                        height: `${cmToPixels(1.5)}px`
                      }}
                    >
                      {person.signature ? (
                        <img src={person.signature} alt="Uploaded signature" className="preview-image" />
                      ) : (
                        <div className="upload-placeholder">
                          <div className="upload-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm0 18c-4.4 0-8-3.6-8-8s3.6-8 8-8 8 3.6 8 8-3.6 8-8 8z"></path>
                              <path d="M8 16s1.5-2 4-2 4 2 4 2"></path>
                              <line x1="9" y1="9" x2="9.01" y2="9"></line>
                              <line x1="15" y1="9" x2="15.01" y2="9"></line>
                            </svg>
                          </div>
                          <p>Signature (3.5×1.5cm)</p>
                        </div>
                      )}
                      <input
                        type="file"
                        ref={el => fileInputRefs.current[`${person.id}-signature`] = el}
                        onChange={(e) => handleFileChange(person.id, 'signature', e)}
                        accept="image/*"
                        hidden
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="action-buttons">
              <button onClick={handleAddPerson} className="btn add-btn">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                Add Person
              </button>
              {persons.length > 0 && (
                <button 
                  onClick={handleMerge} 
                  className="btn merge-btn" 
                  disabled={!persons.every(p => p.photo && p.signature)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="17 1 21 5 17 9"></polyline>
                    <path d="M3 11V9a4 4 0 0 1 4-4h14"></path>
                    <polyline points="7 23 3 19 7 15"></polyline>
                    <path d="M21 13v2a4 4 0 0 1-4 4H3"></path>
                  </svg>
                  Merge All
                </button>
              )}
            </div>
          </>
        ) : (
          <div className="results-container">
            <div className="results-header">
              <h2>Merged Results</h2>
              <p className="results-subtitle">JPG files under 100KB with exact dimensions</p>
            </div>
            <div className="output-settings">
              <div className="output-setting-item">
                <span className="setting-label">DPI:</span>
                <span className="setting-value">{dpi}</span>
              </div>
              <div className="output-setting-item">
                <span className="setting-label">Quality:</span>
                <span className="setting-value">{Math.round(quality * 100)}%</span>
              </div>
              <div className="output-setting-item">
                <span className="setting-label">Dimensions:</span>
                <span className="setting-value">{cmToPixels(3.5)}×{cmToPixels(4.5)}px</span>
              </div>
            </div>
            
            <div className="merged-results">
              {persons.map((person, index) => (
                <div key={person.id} className="merged-card">
                  <div className="merged-card-header">
                    <h3>Person {index + 1}</h3>
                  </div>
                  <div 
                    className="merged-image-container"
                    style={{
                      width: `${cmToPixels(3.5)}px`,
                      height: `${cmToPixels(4.5)}px`
                    }}
                  >
                    {person.photo && <img src={person.photo} alt={`Person ${index + 1} photo`} className="merged-photo" />}
                    {person.signature && (
                      <div 
                        className="merged-signature-container"
                        style={{
                          width: `${cmToPixels(3.5)}px`,
                          height: `${cmToPixels(1.5)}px`,
                          bottom: '0',
                          left: '0'
                        }}
                      >
                        <img src={person.signature} alt={`Person ${index + 1} signature`} className="merged-signature" />
                      </div>
                    )}
                  </div>
                  <div className="download-section">
                    <button 
                      onClick={() => handleDownload(person, index)}
                      className="btn download-btn"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="7 10 12 15 17 10"></polyline>
                        <line x1="12" y1="15" x2="12" y2="3"></line>
                      </svg>
                      Download JPG
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="results-actions">
              <button 
                onClick={handleDownloadAll} 
                className="btn download-all-btn"
                disabled={isDownloadingAll}
              >
                {isDownloadingAll ? (
                  <>
                    <svg className="spinner" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
                    </svg>
                    Downloading...
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                      <polyline points="7 10 12 15 17 10"></polyline>
                      <line x1="12" y1="15" x2="12" y2="3"></line>
                    </svg>
                    Download All ({persons.length})
                  </>
                )}
              </button>
              
              <button onClick={handleReset} className="btn reset-btn">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"></path>
                  <path d="M21 3v5h-5"></path>
                  <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"></path>
                  <path d="M8 16H3v5"></path>
                </svg>
                Start Over
              </button>
            </div>
          </div>
        )}
      </main>

      <footer className="app-footer">
        <div className="footer-content">
          <p>© {new Date().getFullYear()} Professional ID Photo Merger</p>
          <div className="footer-links">
            <a href="#" target="_blank" rel="noopener noreferrer">Help</a>
            <a href="#" target="_blank" rel="noopener noreferrer">Privacy</a>
            <a href="#" target="_blank" rel="noopener noreferrer">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;