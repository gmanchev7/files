import React, { useState, useEffect } from 'react';
import './App.css';

async function fetchTestData() {
  const response = await fetch('/data.json');
  if (!response.ok) {
    throw new Error('Network response was not ok');
  }
  return response.json();
}

function convertToFolderStructure(files) {
  if (!Array.isArray(files)) return files;
  return files.map(file =>
    typeof file === 'string' ? file : new Folder(convertToFolderStructure(file))
  );
}

async function findAllJavascriptFiles(folder) {
  const files = await folder.read();
  const results = await Promise.all(
    files.map(async (file) => {
      if (typeof file === 'string' && file.endsWith('.js')) {
        return [file];
      } else if (typeof file === 'object' && file.read) {
        return findAllJavascriptFiles(file);
      }
      return [];
    })
  );
  return results.flat();
}

function Folder(files) {
  return {
    size: () => new Promise(res => res(files.length)),
    read: () => new Promise(res => res(files))
  };
}

function App() {
  const [allFiles, setAllFiles] = useState([]);
  const [jsFiles, setJsFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [testData, setTestData] = useState([]);
  const [selectedRootIndex, setSelectedRootIndex] = useState('');

  useEffect(() => {
    fetchTestData()
      .then(data => {
        setTestData(data);
        if (data.length > 0) {
          setSelectedRootIndex(0);
          const initialRootFolder = new Folder(convertToFolderStructure(data[0].root));
          return initialRootFolder.read();
        }
        return [];
      })
      .catch(err => {
        setError('Error initializing files');
        console.error('Error:', err);
      });
  }, []);

  const handleClick = async () => {
    if (selectedRootIndex === '' || selectedRootIndex >= testData.length) {
      setError('Invalid root index');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const folder = new Folder(convertToFolderStructure(testData[selectedRootIndex].root));
      const files = await folder.read();
      setAllFiles(files);
      const javascriptFiles = await findAllJavascriptFiles(folder);
      setJsFiles(javascriptFiles);
    } catch (err) {
      setError('Error finding JavaScript files');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRootChange = (event) => {
    const index = Number(event.target.value);
    setSelectedRootIndex(index);
    setAllFiles([]); 
    setJsFiles([]); 
  };

  const renderFiles = (files) => {
    if (!Array.isArray(files)) {
      return <li>Invalid data</li>;
    }

    return files.map((file, index) => {
      if (typeof file === 'string') {
        return <li key={index}>{file}</li>;
      } else if (typeof file === 'object' && file.read) {
        return (
          <FolderContents key={index} folder={file} />
        );
      }
      return <li key={index}>Invalid item</li>;
    });
  };

  const FolderContents = ({ folder }) => {
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
      folder.read()
        .then(files => setFiles(files))
        .catch(err => {
          setError('Error reading folder contents');
          console.error('Error:', err);
        })
        .finally(() => setLoading(false));
    }, [folder]);

    if (loading) return <li>Loading...</li>;
    if (error) return <li>{error}</li>;

    return (
      <li>
        <strong>Folder:</strong>
        <ul>
          {renderFiles(files)}
        </ul>
      </li>
    );
  };

  return (
    <div>
      <h1>File Finder</h1>
      <div>
        <label htmlFor="rootSelect">Select Root Dataset: </label>
        <select id="rootSelect" value={selectedRootIndex} onChange={handleRootChange}>
          {testData.map((_, index) => (
            <option key={index} value={index}>
              Root {index + 1}
            </option>
          ))}
        </select>
      </div>
      <button onClick={handleClick} disabled={loading}>
        {loading ? 'Loading...' : 'Find JavaScript Files'}
      </button>
      {error && <p className="error">{error}</p>}
      <h2>All Files</h2>
      <ul>
        {Array.isArray(allFiles) && allFiles.length > 0 ? (
          renderFiles(allFiles)
        ) : (
          <p>No files available.</p>
        )}
      </ul>
      <h2>JavaScript Files</h2>
      <ul>
        {Array.isArray(jsFiles) && jsFiles.length > 0 ? (
          jsFiles.map((file, index) => (
            <li key={index}>{file}</li>
          ))
        ) : (
          !loading && <p>No JavaScript files found.</p>
        )}
      </ul>
    </div>
  );
}

export default App;
